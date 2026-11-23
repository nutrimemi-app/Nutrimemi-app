/**
 * threeWayMerge.js — Motor de Fusión Tripartita de Menús Clínicos
 *
 * Módulo 3 de Persistencia de Nutrimemi.
 *
 * Responsabilidades:
 * 1. Fusión determinista de campos escalares y de objeto mediante comparación tripartita.
 * 2. Fusión de arrays de alimentos delegando identidad a identity.js y orden a arrayOrdering.js.
 * 3. Fusión completa del menú clínico (_days / dietForm / formulas) sin pérdida de datos.
 * 4. Nunca genera crypto.randomUUID(); las migraciones se marcan con requiresMigration: true.
 * 5. Importa MISSING desde identity.js — referencia simbólica única en toda la aplicación.
 */

import { canonicalJsonSerialize } from './jsonContract.js';
import {
  MISSING,
  IDENTITY_CONFLICTS,
  alignFoodCollections,
  getPureClinicalData,
  isPersistentId
} from './identity.js';
import { resolveArrayOrdering } from './arrayOrdering.js';

// ---------------------------------------------------------------------------
// Tipos de conflicto de merge
// ---------------------------------------------------------------------------
export const MERGE_CONFLICTS = Object.freeze({
  SCALAR_CONFLICT:            'SCALAR_CONFLICT',
  FOOD_ARRAY_CONFLICT:        'FOOD_ARRAY_CONFLICT',
  FOOD_ORDERING_CONFLICT:     'FOOD_ORDERING_CONFLICT',
  SERVER_DELETED_LOCAL_MODIFIED: 'SERVER_DELETED_LOCAL_MODIFIED',
  LOCAL_DELETED_SERVER_MODIFIED: 'LOCAL_DELETED_SERVER_MODIFIED',
  AMBIGUOUS_LEGACY_IDENTITY:  'AMBIGUOUS_LEGACY_IDENTITY',
  IDENTITY_CONFLICT:          'IDENTITY_CONFLICT'
});

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Compara dos valores con serialización canónica, manejando el centinela MISSING.
 * MISSING !== cualquier valor real (incluido undefined o null).
 */
function valuesEqual(a, b) {
  if (a === MISSING && b === MISSING) return true;
  if (a === MISSING || b === MISSING) return false;
  try {
    return canonicalJsonSerialize(a) === canonicalJsonSerialize(b);
  } catch {
    // Si no son serializables, se tratan como distintos
    return false;
  }
}

// ---------------------------------------------------------------------------
// API pública: fusión de campo escalar / objeto simple
// ---------------------------------------------------------------------------

/**
 * Fusión estándar de tres vías para un campo escalar o de objeto simple.
 *
 * Reglas (B = base, S = servidor, L = local):
 *   S == B  &&  L == B  → sin cambio → devuelve clon de base
 *   S == B  &&  L != B  → solo local cambió → devuelve clon de local
 *   S != B  &&  L == B  → solo servidor cambió → devuelve clon de servidor
 *   S != B  &&  L != B  &&  S == L → convergente → devuelve clon de servidor/local
 *   S != B  &&  L != B  &&  S != L → conflicto → empuja a conflicts, devuelve clon de local
 *
 * @param {any} base
 * @param {any} server
 * @param {any} local
 * @param {string} path
 * @param {Array}  conflicts  Array de conflictos acumulados (mutado en conflicto)
 * @returns {any}  Valor resuelto (nunca MISSING)
 */
export function threeWayPathMerge(base, server, local, path, conflicts) {
  const sEqualsB = valuesEqual(server, base);
  const lEqualsB = valuesEqual(local, base);

  if (sEqualsB && lEqualsB) return _clone(base);
  if (sEqualsB && !lEqualsB) return _clone(local);
  if (!sEqualsB && lEqualsB) return _clone(server);

  // Ambos cambiaron
  const sEqualsL = valuesEqual(server, local);
  if (sEqualsL) return _clone(server);  // convergente

  // Conflicto real
  conflicts.push({
    path,
    type: MERGE_CONFLICTS.SCALAR_CONFLICT,
    base: _safeCopy(base),
    server: _safeCopy(server),
    local: _safeCopy(local),
    message: `Conflicto en "${path}": servidor y local modificaron el campo de forma incompatible.`
  });
  return _clone(local); // valor provisional para UI
}

// Clonación defensiva: JSON round-trip si es serializable, copia directa si no
function _clone(v) {
  if (v === null || v === undefined) return v;
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}

function _safeCopy(v) {
  try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); }
}

// ---------------------------------------------------------------------------
// Fusión de array de alimentos
// ---------------------------------------------------------------------------

/**
 * Funde tres arrays de alimentos (base, servidor, local) estableciendo correspondencia
 * por identidad (identity.js) y ordenando el resultado (arrayOrdering.js).
 *
 * @param {Array}  baseArr    Array de alimentos en la versión base
 * @param {Array}  serverArr  Array de alimentos recibido del servidor
 * @param {Array}  localArr   Array de alimentos del cliente
 * @param {string} path       Ruta de contexto para mensajes de conflicto
 * @returns {{
 *   merged: Array,
 *   conflicts: Array,
 *   legacyItemsToMigrate: Array,
 *   isPersistenceAllowed: boolean
 * }}
 */
export function mergeFoodArrays(baseArr, serverArr, localArr, path = 'selectedFoods') {
  const conflicts = [];

  // Garantizar arrays
  const bArr = Array.isArray(baseArr)   ? baseArr   : [];
  const sArr = Array.isArray(serverArr) ? serverArr : [];
  const lArr = Array.isArray(localArr)  ? localArr  : [];

  // 1. Alineación de instancias (identity.js)
  const { alignedTuples, conflicts: idConflicts } = alignFoodCollections(bArr, sArr, lArr, path);

  // Absorber conflictos de identidad
  for (const c of idConflicts) {
    conflicts.push({
      ...c,
      type: c.type in MERGE_CONFLICTS ? c.type : MERGE_CONFLICTS.IDENTITY_CONFLICT
    });
  }

  // Si hay conflictos de identidad irreconciliables, bloquear
  if (idConflicts.length > 0) {
    return { merged: [], conflicts, legacyItemsToMigrate: [], isPersistenceAllowed: false };
  }

  // 2. Fusión clínica de cada tupla alineada
  const mergedItemsMap = new Map(); // unifiedId → alimento fusionado
  const legacyItemsToMigrate = [];  // elementos que necesitan UUID real

  for (const tuple of alignedTuples) {
    const { unifiedId, b, s, l, requiresMigration } = tuple;
    const merged = _fuseTuple(b, s, l, `${path}[${unifiedId}]`, conflicts);
    if (merged !== null) {
      mergedItemsMap.set(unifiedId, merged);
      if (requiresMigration) {
        legacyItemsToMigrate.push({ unifiedId, item: merged });
      }
    }
  }

  // 3. Proyectar arrays para el ordenamiento (cada elemento lleva instanceId = unifiedId)
  const projectArr = (arr) =>
    arr
      .filter(f => {
        // Solo incluimos los que quedaron en el merge final
        // Buscamos su unifiedId en mergedItemsMap a través de los tuples
        return alignedTuples.some(t => {
          const v = (arr === bArr ? t.b : arr === sArr ? t.s : t.l);
          return v === f && mergedItemsMap.has(t.unifiedId);
        });
      })
      .map(f => {
        const tuple = alignedTuples.find(t => {
          const v = (arr === bArr ? t.b : arr === sArr ? t.s : t.l);
          return v === f;
        });
        return { ...f, instanceId: tuple ? tuple.unifiedId : f.instanceId };
      });

  const projBase   = projectArr(bArr);
  const projServer = projectArr(sArr);
  const projLocal  = projectArr(lArr);

  // 4. Ordenamiento topológico (arrayOrdering.js)
  const { orderedItems, isPersistenceAllowed } = resolveArrayOrdering(
    projBase,
    projServer,
    projLocal,
    mergedItemsMap,
    conflicts,
    path
  );

  return {
    merged: orderedItems,
    conflicts,
    legacyItemsToMigrate,
    isPersistenceAllowed: isPersistenceAllowed && conflicts.length === 0
  };
}

/**
 * Fusiona la tripleta clínica de un alimento individual.
 * Devuelve null si el elemento fue eliminado en ambas ramas.
 */
function _fuseTuple(b, s, l, path, conflicts) {
  const bMissing = b === MISSING;
  const sMissing = s === MISSING;
  const lMissing = l === MISSING;

  // Eliminación convergente: ambas ramas eliminaron el elemento
  if (sMissing && lMissing) return null;

  // Alta neta en servidor únicamente
  if (bMissing && !sMissing && lMissing) {
    return _mergeAllFields(null, s, null, path, conflicts);
  }

  // Alta neta en local únicamente
  if (bMissing && sMissing && !lMissing) {
    return _mergeAllFields(null, null, l, path, conflicts);
  }

  // Alta concurrente en ambas ramas (cada una es instancia independiente)
  if (bMissing && !sMissing && !lMissing) {
    // Ambas instancias son independientes; aquí solo se fusiona la local
    // (la del servidor ya está en su propio unifiedId)
    return _mergeAllFields(null, null, l, path, conflicts);
  }

  // Eliminación unilateral del servidor, local lo modificó
  if (!bMissing && sMissing && !lMissing) {
    const bClinical = getPureClinicalData(b);
    const lClinical = getPureClinicalData(l);
    const bSerial = canonicalJsonSerialize(bClinical);
    const lSerial = canonicalJsonSerialize(lClinical);
    if (bSerial !== lSerial) {
      // Conflicto: servidor eliminó, local modificó
      conflicts.push({
        path,
        type: MERGE_CONFLICTS.SERVER_DELETED_LOCAL_MODIFIED,
        local: _safeCopy(l),
        message: `Conflicto en "${path}": el servidor eliminó este alimento pero local lo modificó.`
      });
      return _clone(l); // provisional para UI
    }
    // Local no lo modificó → respetar eliminación del servidor
    return null;
  }

  // Eliminación unilateral de local, servidor lo modificó
  if (!bMissing && !sMissing && lMissing) {
    const bClinical = getPureClinicalData(b);
    const sClinical = getPureClinicalData(s);
    const bSerial = canonicalJsonSerialize(bClinical);
    const sSerial = canonicalJsonSerialize(sClinical);
    if (bSerial !== sSerial) {
      // Conflicto: local eliminó, servidor modificó
      conflicts.push({
        path,
        type: MERGE_CONFLICTS.LOCAL_DELETED_SERVER_MODIFIED,
        server: _safeCopy(s),
        message: `Conflicto en "${path}": local eliminó este alimento pero el servidor lo modificó.`
      });
      return _clone(s); // provisional para UI
    }
    // Servidor no lo modificó → respetar eliminación local
    return null;
  }

  // Caso normal: los tres presentes → fusionar campo a campo
  return _mergeAllFields(b, s, l, path, conflicts);
}

/**
 * Fusiona campo a campo los datos clínicos de un alimento.
 * Cuando alguna versión es null/MISSING, se usa el valor presente.
 */
function _mergeAllFields(b, s, l, path, conflicts) {
  // Recopilar todas las claves clínicas (excluyendo instanceId de las tres versiones)
  const bData = (b && b !== MISSING) ? getPureClinicalData(b) : null;
  const sData = (s && s !== MISSING) ? getPureClinicalData(s) : null;
  const lData = (l && l !== MISSING) ? getPureClinicalData(l) : null;

  const allKeys = new Set([
    ...(bData ? Object.keys(bData) : []),
    ...(sData ? Object.keys(sData) : []),
    ...(lData ? Object.keys(lData) : [])
  ]);

  const result = {};

  // instanceId: mantener el que provenga del servidor o local (canónico si existe)
  const resolvedInstanceId = _resolveInstanceId(b, s, l);
  if (resolvedInstanceId !== undefined) {
    result.instanceId = resolvedInstanceId;
  }

  for (const key of allKeys) {
    const bVal = bData ? bData[key] : MISSING;
    const sVal = sData ? sData[key] : MISSING;
    const lVal = lData ? lData[key] : MISSING;

    // Si una versión es null/ausente, tratar sus valores como MISSING para merge
    const effectiveB = (bData === null) ? MISSING : (bVal === undefined ? MISSING : bVal);
    const effectiveS = (sData === null) ? MISSING : (sVal === undefined ? MISSING : sVal);
    const effectiveL = (lData === null) ? MISSING : (lVal === undefined ? MISSING : lVal);

    const resolved = _mergeField(effectiveB, effectiveS, effectiveL, `${path}.${key}`, conflicts);
    if (resolved !== undefined) {
      result[key] = resolved;
    }
  }

  return result;
}

/**
 * Fusiona un campo individual (versión simple de threeWayPathMerge que acepta MISSING).
 */
function _mergeField(b, s, l, path, conflicts) {
  const bMissing = b === MISSING;
  const sMissing = s === MISSING;
  const lMissing = l === MISSING;

  // Alta neta
  if (bMissing && !sMissing && lMissing) return _clone(s);
  if (bMissing && sMissing && !lMissing) return _clone(l);
  if (bMissing && !sMissing && !lMissing) {
    // Ambas ramas añadieron el campo
    if (valuesEqual(s, l)) return _clone(s);
    // Divergencia: usar local como provisional
    conflicts.push({
      path,
      type: MERGE_CONFLICTS.SCALAR_CONFLICT,
      server: _safeCopy(s),
      local: _safeCopy(l),
      message: `Conflicto en "${path}": ambas ramas añadieron el campo con valores distintos.`
    });
    return _clone(l);
  }

  // Eliminación
  if (!bMissing && sMissing && lMissing) return undefined; // campo eliminado en ambos
  if (!bMissing && sMissing && !lMissing) {
    // Servidor eliminó, local tiene valor → respetar local si no cambió, conflicto si cambió
    if (valuesEqual(b, l)) return undefined; // local no cambió el campo
    // Local modificó el campo que el servidor eliminó
    conflicts.push({
      path,
      type: MERGE_CONFLICTS.SCALAR_CONFLICT,
      server: null,
      local: _safeCopy(l),
      message: `Conflicto en "${path}": el servidor eliminó el campo pero local tiene un valor modificado.`
    });
    return _clone(l);
  }
  if (!bMissing && !sMissing && lMissing) {
    if (valuesEqual(b, s)) return undefined;
    conflicts.push({
      path,
      type: MERGE_CONFLICTS.SCALAR_CONFLICT,
      server: _safeCopy(s),
      local: null,
      message: `Conflicto en "${path}": local eliminó el campo pero el servidor tiene un valor modificado.`
    });
    return _clone(s);
  }

  // Caso normal: los tres tienen valor
  return threeWayPathMerge(b, s, l, path, conflicts);
}

/**
 * Resuelve qué instanceId usar en el objeto fusionado.
 * Prioridad: UUID persistido del servidor > UUID persistido de local > cualquier otro.
 */
function _resolveInstanceId(b, s, l) {
  const sId = (s && s !== MISSING) ? s.instanceId : undefined;
  const lId = (l && l !== MISSING) ? l.instanceId : undefined;
  const bId = (b && b !== MISSING) ? b.instanceId : undefined;

  if (isPersistentId(sId)) return sId;
  if (isPersistentId(lId)) return lId;
  if (sId !== undefined && sId !== null && sId !== '') return sId;
  if (lId !== undefined && lId !== null && lId !== '') return lId;
  return bId;
}

// ---------------------------------------------------------------------------
// Fusión completa del menú de un día
// ---------------------------------------------------------------------------

/**
 * Fusiona dos objetos de tipo "día de menú" (p.ej. day1 o day2).
 * Cada propiedad del objeto es un slot de comida (string o array de alimentos).
 *
 * @param {Object|null} baseDay
 * @param {Object|null} serverDay
 * @param {Object|null} localDay
 * @param {string}      dayPath
 * @param {Array}       conflicts
 * @returns {{ mergedDay: Object, legacyItemsToMigrate: Array, isPersistenceAllowed: boolean }}
 */
function _mergeDay(baseDay, serverDay, localDay, dayPath, conflicts) {
  const bDay = (baseDay  && typeof baseDay  === 'object') ? baseDay  : {};
  const sDay = (serverDay && typeof serverDay === 'object') ? serverDay : {};
  const lDay = (localDay  && typeof localDay  === 'object') ? localDay  : {};

  const allSlots = new Set([...Object.keys(bDay), ...Object.keys(sDay), ...Object.keys(lDay)]);
  const mergedDay = {};
  const legacyItemsToMigrate = [];
  let isPersistenceAllowed = true;

  for (const slot of allSlots) {
    const bSlot = bDay[slot];
    const sSlot = sDay[slot];
    const lSlot = lDay[slot];
    const slotPath = `${dayPath}.${slot}`;

    // Si local no incluye este slot (comida omitida en el payload local):
    // No interpretar como comida vacía ni como eliminación intencional.
    if (lSlot === undefined) {
      if (sSlot !== undefined) {
        mergedDay[slot] = _clone(sSlot);
        const foodsToCheck = Array.isArray(sSlot)
          ? sSlot
          : (sSlot && typeof sSlot === 'object' && Array.isArray(sSlot.selectedFoods) ? sSlot.selectedFoods : null);
        if (foodsToCheck) {
          for (let i = 0; i < foodsToCheck.length; i++) {
            const item = foodsToCheck[i];
            if (item && typeof item === 'object' && !isPersistentId(item.instanceId)) {
              legacyItemsToMigrate.push({
                path: Array.isArray(sSlot) ? `${slotPath}[${i}]` : `${slotPath}.selectedFoods[${i}]`,
                item: _clone(item),
                reason: 'legacy_id'
              });
            }
          }
        }
      }
      // Si sSlot es undefined (eliminado en servidor), NO resucitar de bSlot
      continue;
    }

    // Si es un objeto de comida estructurada ({ time, selectedFoods, portions })
    const isStructuredMeal = (
      (lSlot && typeof lSlot === 'object' && !Array.isArray(lSlot) && Array.isArray(lSlot.selectedFoods)) ||
      (sSlot && typeof sSlot === 'object' && !Array.isArray(sSlot) && Array.isArray(sSlot.selectedFoods)) ||
      (bSlot && typeof bSlot === 'object' && !Array.isArray(bSlot) && Array.isArray(bSlot.selectedFoods))
    );

    if (isStructuredMeal) {
      const bObj = (bSlot && typeof bSlot === 'object' && !Array.isArray(bSlot)) ? bSlot : {};
      const sObj = (sSlot && typeof sSlot === 'object' && !Array.isArray(sSlot)) ? sSlot : {};
      const lObj = (lSlot && typeof lSlot === 'object' && !Array.isArray(lSlot)) ? lSlot : {};

      const bFoods = Array.isArray(bObj.selectedFoods) ? bObj.selectedFoods : [];
      const sFoods = Array.isArray(sObj.selectedFoods) ? sObj.selectedFoods : [];
      const lFoods = Array.isArray(lObj.selectedFoods) ? lObj.selectedFoods : [];

      const foodsResult = mergeFoodArrays(bFoods, sFoods, lFoods, `${slotPath}.selectedFoods`);
      for (const c of foodsResult.conflicts) conflicts.push(c);
      for (const item of foodsResult.legacyItemsToMigrate) legacyItemsToMigrate.push(item);
      if (!foodsResult.isPersistenceAllowed) isPersistenceAllowed = false;

      // Fusionar time
      const timeMerged = _mergeField(
        bObj.time === undefined ? MISSING : bObj.time,
        sObj.time === undefined ? MISSING : sObj.time,
        lObj.time === undefined ? MISSING : lObj.time,
        `${slotPath}.time`,
        conflicts
      );

      // Fusionar portions
      const portionsMerged = _mergeField(
        bObj.portions === undefined ? MISSING : bObj.portions,
        sObj.portions === undefined ? MISSING : sObj.portions,
        lObj.portions === undefined ? MISSING : lObj.portions,
        `${slotPath}.portions`,
        conflicts
      );

      mergedDay[slot] = {
        ..._clone(sObj),
        ..._clone(lObj),
        selectedFoods: foodsResult.merged,
        ...(timeMerged !== undefined ? { time: timeMerged } : {}),
        ...(portionsMerged !== undefined ? { portions: portionsMerged } : {})
      };
      continue;
    }

    // Si es array directo de alimentos (local explícitamente envió un array para este slot)
    if (Array.isArray(lSlot) || Array.isArray(sSlot) || Array.isArray(bSlot)) {
      const bFoods = Array.isArray(bSlot) ? bSlot : [];
      const sFoods = Array.isArray(sSlot) ? sSlot : [];
      const lFoods = Array.isArray(lSlot) ? lSlot : [];

      const result = mergeFoodArrays(bFoods, sFoods, lFoods, slotPath);
      mergedDay[slot] = result.merged;
      for (const c of result.conflicts) conflicts.push(c);
      for (const item of result.legacyItemsToMigrate) legacyItemsToMigrate.push(item);
      if (!result.isPersistenceAllowed) isPersistenceAllowed = false;
      continue;
    }

    // Campo escalar o de objeto plano general
    const effectiveB = bSlot === undefined ? MISSING : bSlot;
    const effectiveS = sSlot === undefined ? MISSING : sSlot;
    const effectiveL = lSlot === undefined ? MISSING : lSlot;

    const resolved = _mergeField(effectiveB, effectiveS, effectiveL, slotPath, conflicts);
    if (resolved !== undefined) {
      mergedDay[slot] = resolved;
    }
    if (conflicts.some(c => c.path.startsWith(slotPath))) {
      isPersistenceAllowed = false;
    }
  }

  return { mergedDay, legacyItemsToMigrate, isPersistenceAllowed };
}

// ---------------------------------------------------------------------------
// API pública principal
// ---------------------------------------------------------------------------

/**
 * Fusiona el menú completo de un paciente (base, servidor, local).
 *
 * Preserva: _days, dietForm, formulas y cualquier clave desconocida.
 * No sobrescribe day2 cuando solo se guarda day1 (ni viceversa).
 * No genera UUIDs — marca los elementos que los necesiten con requiresMigration.
 *
 * @param {Object} base   Estado del menú cuando el usuario abrió la vista
 * @param {Object} server Estado actual en Supabase (lectura fresca antes de escribir)
 * @param {Object} local  Cambios que el usuario quiere persistir
 * @returns {{
 *   merged:                Object,
 *   conflicts:             Array,
 *   legacyItemsToMigrate:  Array,
 *   isPersistenceAllowed:  boolean
 * }}
 */
export function mergePatientMenu(base, server, local) {
  if (!local || typeof local !== 'object') {
    throw new TypeError('mergePatientMenu: "local" debe ser un objeto.');
  }

  const b = (base   && typeof base   === 'object') ? base   : {};
  const s = (server && typeof server === 'object') ? server : {};
  const l = local;

  const conflicts = [];
  const legacyItemsToMigrate = [];
  let isPersistenceAllowed = true;

  const merged = {};

  // 1. Fusionar _days (estructura de días del menú)
  const bDays = (b._days && typeof b._days === 'object') ? b._days : {};
  const sDays = (s._days && typeof s._days === 'object') ? s._days : {};
  const lDays = (l._days && typeof l._days === 'object') ? l._days : {};

  const allDayKeys = new Set([
    ...Object.keys(bDays),
    ...Object.keys(sDays),
    ...Object.keys(lDays)
  ]);

  if (allDayKeys.size > 0) {
    merged._days = {};
    for (const dayKey of allDayKeys) {
      const bDay = bDays[dayKey];
      const sDay = sDays[dayKey];
      const lDay = lDays[dayKey];

      // Si local no incluye este día en el payload actual, significa que esta operación no pretende modificarlo.
      // Si existe en el servidor, conservar la versión del servidor.
      // Si no existe en el servidor (fue eliminado concurrentemente o nunca existió), NO recuperarlo desde base.
      // No resucitar días eliminados.
      if (lDay === undefined) {
        if (sDay !== undefined) {
          merged._days[dayKey] = _clone(sDay);
        }
        continue;
      }

      const dayResult = _mergeDay(bDay, sDay, lDay, `_days.${dayKey}`, conflicts);
      merged._days[dayKey] = dayResult.mergedDay;
      for (const item of dayResult.legacyItemsToMigrate) legacyItemsToMigrate.push(item);
      if (!dayResult.isPersistenceAllowed) isPersistenceAllowed = false;
    }
  }

  // 2. Fusionar dietForm (campo escalar/objeto simple)
  // Si local no incluye dietForm, se interpreta como "no tocado" (no eliminación intencional)
  if ('dietForm' in l) {
    const bDiet = b.dietForm === undefined ? MISSING : b.dietForm;
    const sDiet = s.dietForm === undefined ? MISSING : s.dietForm;
    const lDiet = l.dietForm;
    const resolvedDiet = _mergeField(bDiet, sDiet, lDiet, 'dietForm', conflicts);
    if (resolvedDiet !== undefined) merged.dietForm = resolvedDiet;
  } else if (s.dietForm !== undefined) {
    merged.dietForm = _clone(s.dietForm);
  } else if (b.dietForm !== undefined) {
    merged.dietForm = _clone(b.dietForm);
  }

  // 3. Fusionar formulas (array de objetos simples, sin lógica de alimentos)
  // Si local no incluye formulas, se interpreta como "no tocado"
  if ('formulas' in l) {
    const bForm = b.formulas === undefined ? MISSING : b.formulas;
    const sForm = s.formulas === undefined ? MISSING : s.formulas;
    const lForm = l.formulas;
    const resolvedForm = _mergeField(bForm, sForm, lForm, 'formulas', conflicts);
    if (resolvedForm !== undefined) merged.formulas = resolvedForm;
  } else if (s.formulas !== undefined) {
    merged.formulas = _clone(s.formulas);
  } else if (b.formulas !== undefined) {
    merged.formulas = _clone(b.formulas);
  }

  // 4. Fusión tripartita de claves desconocidas (campos personalizados en la raíz de JSONB)
  const knownKeys = new Set(['_days', 'dietForm', 'formulas']);
  const allUnknownKeys = new Set([
    ...Object.keys(b).filter(k => !knownKeys.has(k)),
    ...Object.keys(s).filter(k => !knownKeys.has(k)),
    ...Object.keys(l).filter(k => !knownKeys.has(k))
  ]);

  for (const key of allUnknownKeys) {
    const keyPath = key;
    const inB = key in b;
    const inS = key in s;
    const inL = key in l;

    // Si la clave no está en local: omitida en el payload local.
    // Conservar la versión del servidor si existe. Si el servidor también la eliminó, no resucitar de base.
    if (!inL) {
      if (inS) {
        merged[key] = _clone(s[key]);
      }
      continue;
    }

    // Local incluyó la clave explícitamente (adición, modificación o eliminación explícita)
    const effectiveB = inB ? b[key] : MISSING;
    const effectiveS = inS ? s[key] : MISSING;
    const effectiveL = inL ? l[key] : MISSING;

    const resolved = _mergeField(effectiveB, effectiveS, effectiveL, keyPath, conflicts);
    if (resolved !== undefined) {
      merged[key] = resolved;
    }
    if (conflicts.some(c => c.path === keyPath || c.path.startsWith(`${keyPath}.`))) {
      isPersistenceAllowed = false;
    }
  }

  if (conflicts.length > 0) isPersistenceAllowed = false;

  return { merged, conflicts, legacyItemsToMigrate, isPersistenceAllowed };
}

/**
 * Reconciliación tripartita de campos clínicos generales (details, measurements, name, etc.)
 * ante colisiones CAS.
 *
 * Reglas:
 * 1. Si el servidor cambió un campo y local no lo modificó -> se preserva el cambio del servidor.
 * 2. Si local cambió un campo y el servidor no lo modificó -> se aplica el cambio local.
 * 3. Si ambos cambiaron al mismo valor -> convergencia limpia.
 * 4. Si ambos cambiaron a valores incompatibles -> CONFLICTO CLÍNICO EXPLÍCITO (bloqueo).
 */
export function reconcileClinicalFields(basePatient, serverPatient, localPartialData) {
  const conflicts = [];
  const mergedUpdate = {};

  const b = basePatient || {};
  const s = serverPatient || {};
  const l = localPartialData || {};

  // 1. Campos escalares de nivel superior
  const topScalarKeys = ['name', 'goal', 'status'];
  for (const key of topScalarKeys) {
    if (l[key] !== undefined) {
      const bVal = b[key];
      const sVal = s[key];
      const lVal = l[key];

      const sChanged = sVal !== bVal;
      const lChanged = lVal !== bVal;

      if (!sChanged && lChanged) {
        mergedUpdate[key] = lVal;
      } else if (sChanged && !lChanged) {
        // Servidor cambió, local no lo tocó intencionalmente: adoptar servidor
        mergedUpdate[key] = sVal;
      } else if (sChanged && lChanged) {
        if (sVal === lVal) {
          mergedUpdate[key] = lVal;
        } else {
          conflicts.push({
            field: key,
            base: bVal,
            server: sVal,
            local: lVal,
            message: `Conflicto concurrente en "${key}": servidor (${sVal}) y local (${lVal}) tienen valores incompatibles.`
          });
        }
      }
    }
  }

  // 2. Objetos anidados: details y measurements
  const objectKeys = ['details', 'measurements'];
  for (const objKey of objectKeys) {
    if (l[objKey] && typeof l[objKey] === 'object') {
      const bObj = b[objKey] || {};
      const sObj = s[objKey] || {};
      const lObj = l[objKey];

      const mergedSub = { ...sObj };
      const allSubKeys = new Set([
        ...Object.keys(bObj),
        ...Object.keys(sObj),
        ...Object.keys(lObj)
      ]);

      for (const k of allSubKeys) {
        if (k in lObj) {
          const bVal = bObj[k];
          const sVal = sObj[k];
          const lVal = lObj[k];

          const sChanged = JSON.stringify(sVal) !== JSON.stringify(bVal);
          const lChanged = JSON.stringify(lVal) !== JSON.stringify(bVal);

          if (!sChanged && lChanged) {
            mergedSub[k] = lVal;
          } else if (sChanged && !lChanged) {
            // El servidor actualizó esta propiedad concurrente (ej. nuevo peso) -> conservar servidor
            mergedSub[k] = sVal;
          } else if (sChanged && lChanged) {
            if (JSON.stringify(sVal) === JSON.stringify(lVal)) {
              mergedSub[k] = lVal;
            } else {
              conflicts.push({
                field: `${objKey}.${k}`,
                base: bVal,
                server: sVal,
                local: lVal,
                message: `Conflicto concurrente en "${objKey}.${k}": servidor (${sVal}) y local (${lVal}) tienen valores incompatibles.`
              });
            }
          }
        }
      }
      mergedUpdate[objKey] = mergedSub;
    }
  }

  return {
    mergedUpdate,
    conflicts,
    isPersistenceAllowed: conflicts.length === 0
  };
}
