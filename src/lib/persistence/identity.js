/**
 * identity.js — Gestión de Identidad Clínica y Correspondencia de Alimentos
 *
 * Módulo 2 de Persistencia de Nutrimemi.
 *
 * Responsabilidades:
 * 1. Clasificación estricta de identificadores (PERSISTED, PROVISIONAL, LEGACY_NO_ID).
 * 2. Cálculo de firmas canónicas de catálogo independientes del nombre variable.
 * 3. Alineación simétrica de instancias entre Base, Servidor y Local sin indexación posicional.
 * 4. Tratamiento de duplicados indistinguibles como operaciones de conjunto, bloqueando ambigüedades.
 * 5. Proyección de colecciones a identidades unificadas para el motor de ordenamiento.
 */

import { canonicalJsonSerialize } from './jsonContract.js';

export const MISSING = Symbol('NUTRIMEMI_MISSING');

export const IDENTIFIER_KIND = Object.freeze({
  PERSISTED: 'PERSISTED',
  PROVISIONAL: 'PROVISIONAL',
  LEGACY_NO_ID: 'LEGACY_NO_ID'
});

export const IDENTITY_CONFLICTS = Object.freeze({
  CANONICAL_LEGACY_TRANSITION_AMBIGUITY: 'CANONICAL_LEGACY_TRANSITION_AMBIGUITY',
  AMBIGUOUS_LEGACY_IDENTITY: 'AMBIGUOUS_LEGACY_IDENTITY',
  DUPLICATE_INSTANCE_ID_IN_SAME_VERSION: 'DUPLICATE_INSTANCE_ID_IN_SAME_VERSION',
  SERVER_DELETED_FOOD_LOCAL_MODIFIED: 'SERVER_DELETED_FOOD_LOCAL_MODIFIED',
  LOCAL_DELETED_FOOD_SERVER_MODIFIED: 'LOCAL_DELETED_FOOD_SERVER_MODIFIED'
});

/**
 * Clasifica la naturaleza del instanceId de un alimento.
 */
export function classifyFoodIdentifier(id) {
  if (id === undefined || id === null || id === '') {
    return IDENTIFIER_KIND.LEGACY_NO_ID;
  }
  if (typeof id === 'string' && id.startsWith('prov_')) {
    return IDENTIFIER_KIND.PROVISIONAL;
  }
  return IDENTIFIER_KIND.PERSISTED;
}

export function isPersistentId(id) {
  return classifyFoodIdentifier(id) === IDENTIFIER_KIND.PERSISTED;
}

/**
 * Normaliza y genera la firma canónica de catálogo de un alimento.
 * Si existe food.id (identificador del catálogo de alimentos), tiene precedencia absoluta.
 * Si no existe food.id, utiliza el nombre clínico normalizado sin diacríticos.
 */
export function computeCatalogSignature(food) {
  if (!food || typeof food !== 'object') {
    throw new TypeError('Alimento inválido: debe ser un objeto.');
  }

  const catId = food.id !== undefined && food.id !== null && String(food.id).trim() !== ''
    ? String(food.id).trim()
    : null;

  const name = food.name && typeof food.name === 'string'
    ? food.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : '';

  const group = food.groupKey && typeof food.groupKey === 'string'
    ? food.groupKey.trim().toLowerCase()
    : '';

  if (!catId && !name) {
    throw new TypeError('Alimento inválido: carece de identificador de catálogo y de nombre clínico.');
  }

  if (catId) {
    return JSON.stringify(['cat', catId, group]);
  }
  return JSON.stringify(['name', name, group]);
}

/**
 * Extrae el objeto de propiedades clínicas puras excluyendo metadatos de identidad efímeros.
 */
export function getPureClinicalData(food) {
  if (!food || typeof food !== 'object') return null;
  const { instanceId, _isAmbiguous, _isProvisional, ...clinical } = food;
  return clinical;
}

/**
 * Serializa de forma determinista la prescripción clínica para comparación de multiconjuntos.
 */
export function serializeClinicalPrescription(food) {
  return canonicalJsonSerialize(getPureClinicalData(food));
}

/**
 * Valida unicidad estricta de instanceId dentro de una misma versión.
 */
export function validateIntraVersionUniqueness(arr, versionName, conflicts, path) {
  const seen = new Set();
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (item && isPersistentId(item.instanceId)) {
      if (seen.has(item.instanceId)) {
        conflicts.push({
          path: `${path}.${versionName}[${i}]`,
          type: IDENTITY_CONFLICTS.DUPLICATE_INSTANCE_ID_IN_SAME_VERSION,
          instanceId: item.instanceId,
          message: `El instanceId "${item.instanceId}" aparece duplicado en la versión ${versionName}.`
        });
      }
      seen.add(item.instanceId);
    }
  }
}

/**
 * Canalización única de correspondencia de instancias entre Base, Servidor y Local.
 * Cero emparejamientos por índice posicional.
 * 
 * Devuelve:
 * {
 *   alignedTuples: Array<{ unifiedId, b, s, l, requiresMigration }>,
 *   conflicts: Array<ConflictDescriptor>,
 *   projectionMap: { base: Map, server: Map, local: Map }
 * }
 */
export function alignFoodCollections(baseArr, serverArr, localArr, path = 'selectedFoods') {
  const conflicts = [];
  const alignedTuples = [];

  const bAssigned = new Set();
  const sAssigned = new Set();
  const lAssigned = new Set();

  const projectionMap = {
    base: new Map(),
    server: new Map(),
    local: new Map()
  };

  function recordAlignment(unifiedId, bItem, sItem, lItem, requiresMigration = false) {
    if (bItem && bItem !== MISSING) projectionMap.base.set(bItem, unifiedId);
    if (sItem && sItem !== MISSING) projectionMap.server.set(sItem, unifiedId);
    if (lItem && lItem !== MISSING) projectionMap.local.set(lItem, unifiedId);

    alignedTuples.push({
      unifiedId,
      b: bItem || MISSING,
      s: sItem || MISSING,
      l: lItem || MISSING,
      requiresMigration
    });
  }

  // 1. Validar unicidad intra-versión
  validateIntraVersionUniqueness(baseArr, 'base', conflicts, path);
  validateIntraVersionUniqueness(serverArr, 'server', conflicts, path);
  validateIntraVersionUniqueness(localArr, 'local', conflicts, path);

  if (conflicts.length > 0) {
    return { alignedTuples: [], conflicts, projectionMap };
  }

  const bMap = new Map(); baseArr.forEach((f, i) => { if (isPersistentId(f.instanceId)) bMap.set(f.instanceId, { f, i }); });
  const sMap = new Map(); serverArr.forEach((f, i) => { if (isPersistentId(f.instanceId)) sMap.set(f.instanceId, { f, i }); });
  const lMap = new Map(); localArr.forEach((f, i) => { if (isPersistentId(f.instanceId)) lMap.set(f.instanceId, { f, i }); });

  // ---------------------------------------------------------------------------
  // PASO 1: Transición Canónica Compartida en Servidor y Local frente a Base Legacy
  // (Caso: S y L comparten el MISMO UUID consolidado, Base tenía alimento legacy)
  // ---------------------------------------------------------------------------
  for (const [id, sEntry] of sMap.entries()) {
    const lEntry = lMap.get(id);
    const bEntry = bMap.get(id);

    if (lEntry && !bEntry) {
      const sig = computeCatalogSignature(sEntry.f);
      const bCandidates = baseArr
        .map((f, i) => ({ f, i }))
        .filter(x => !isPersistentId(x.f.instanceId) && computeCatalogSignature(x.f) === sig);

      if (bCandidates.length === 1) {
        // Certeza matemática 1:1: Base contenía exactamente 1 alimento de esa firma
        const bItem = bCandidates[0];
        bAssigned.add(bItem.i);
        sAssigned.add(sEntry.i);
        lAssigned.add(lEntry.i);

        recordAlignment(id, bItem.f, sEntry.f, lEntry.f, false);
      } else if (bCandidates.length > 1) {
        // Ambigüedad en Base: múltiples duplicados legacy no permiten saber cuál recibió el UUID
        conflicts.push({
          path: `${path}[${sig}]`,
          type: IDENTITY_CONFLICTS.CANONICAL_LEGACY_TRANSITION_AMBIGUITY,
          instanceId: id,
          message: `Ambigüedad de migración: Base contenía múltiples copias legacy para la firma "${sig}". Imposible inferir cuál recibió el UUID "${id}".`
        });
        sAssigned.add(sEntry.i);
        lAssigned.add(lEntry.i);
      }
      // Si bCandidates.length === 0: no había candidato en Base; se procesará en Paso 2 como alta canónica
    }
  }

  // ---------------------------------------------------------------------------
  // PASO 2: Emparejamiento Canónico Estándar por instanceId Persistido Compartido
  // ---------------------------------------------------------------------------
  const allPersistentIds = new Set([...bMap.keys(), ...sMap.keys(), ...lMap.keys()]);

  for (const id of allPersistentIds) {
    const bEntry = bMap.get(id);
    const sEntry = sMap.get(id);
    const lEntry = lMap.get(id);

    if (sEntry && sAssigned.has(sEntry.i) && lEntry && lAssigned.has(lEntry.i)) {
      continue; // Ya asignado en Paso 1
    }

    const occurrences = (bEntry ? 1 : 0) + (sEntry ? 1 : 0) + (lEntry ? 1 : 0);

    if (occurrences >= 2) {
      if (bEntry) bAssigned.add(bEntry.i);
      if (sEntry) sAssigned.add(sEntry.i);
      if (lEntry) lAssigned.add(lEntry.i);

      recordAlignment(id, bEntry ? bEntry.f : MISSING, sEntry ? sEntry.f : MISSING, lEntry ? lEntry.f : MISSING, false);
      continue;
    }

    // Eliminación canónica convergente total (existía en Base y desapareció en Servidor y Local)
    if (bEntry && occurrences === 1) {
      bAssigned.add(bEntry.i);
      recordAlignment(id, bEntry.f, MISSING, MISSING, false);
      continue;
    }
  }

  // ---------------------------------------------------------------------------
  // PASO 3: Transición Simétrica Unilateral (Servidor O Local migró a UUID)
  // ---------------------------------------------------------------------------
  const getUnassigned = (arr, assigned) => arr.map((f, i) => ({ f, i })).filter(x => !assigned.has(x.i));

  const bRem = getUnassigned(baseArr, bAssigned);
  const sRem = getUnassigned(serverArr, sAssigned);
  const lRem = getUnassigned(localArr, lAssigned);

  const allSignatures = new Set([
    ...bRem.map(x => computeCatalogSignature(x.f)),
    ...sRem.map(x => computeCatalogSignature(x.f)),
    ...lRem.map(x => computeCatalogSignature(x.f))
  ]);

  for (const sig of allSignatures) {
    const bSig = bRem.filter(x => !bAssigned.has(x.i) && computeCatalogSignature(x.f) === sig);
    const sSig = sRem.filter(x => !sAssigned.has(x.i) && computeCatalogSignature(x.f) === sig);
    const lSig = lRem.filter(x => !lAssigned.has(x.i) && computeCatalogSignature(x.f) === sig);

    const sCanonical = sSig.filter(x => isPersistentId(x.f.instanceId));
    const lCanonical = lSig.filter(x => isPersistentId(x.f.instanceId));

    // Dirección 3A: Servidor migró a canónico, Base y Local son legacy (1:1:1)
    if (sCanonical.length === 1 && lCanonical.length === 0 && bSig.length === 1 && lSig.length === 1) {
      const sItem = sCanonical[0]; const bItem = bSig[0]; const lItem = lSig[0];
      bAssigned.add(bItem.i); sAssigned.add(sItem.i); lAssigned.add(lItem.i);
      recordAlignment(sItem.f.instanceId, bItem.f, sItem.f, lItem.f, false);
      continue;
    }

    // Dirección 3B: Local migró a canónico, Base y Servidor son legacy (1:1:1)
    if (lCanonical.length === 1 && sCanonical.length === 0 && bSig.length === 1 && sSig.length === 1) {
      const lItem = lCanonical[0]; const bItem = bSig[0]; const sItem = sSig[0];
      bAssigned.add(bItem.i); sAssigned.add(sItem.i); lAssigned.add(lItem.i);
      recordAlignment(lItem.f.instanceId, bItem.f, sItem.f, lItem.f, false);
      continue;
    }

    // Ambigüedad si Base tenía duplicados
    if ((sCanonical.length > 0 || lCanonical.length > 0) && bSig.length > 1) {
      conflicts.push({
        path: `${path}[${sig}]`,
        type: IDENTITY_CONFLICTS.CANONICAL_LEGACY_TRANSITION_AMBIGUITY,
        message: `Ambigüedad de migración unilateral: Base contenía múltiples duplicados legacy para la firma "${sig}".`
      });
      continue;
    }

    // -------------------------------------------------------------------------
    // PASO 4: Reconciliación de Clusters Legacy (CERO emparejamientos por índice)
    // -------------------------------------------------------------------------
    reconcilePureLegacyCluster(sig, bSig, sSig, lSig, bAssigned, sAssigned, lAssigned, recordAlignment, conflicts, path);
  }

  // ---------------------------------------------------------------------------
  // Verificación de Agotamiento Total (100% de elementos asignados o en conflicto)
  // ---------------------------------------------------------------------------
  const verifyConsumption = (arr, assigned, vName) => {
    arr.forEach((f, i) => {
      if (!assigned.has(i)) {
        conflicts.push({
          path: `${path}.${vName}[${i}]`,
          type: 'UNASSIGNED_FOOD_INSTANCE',
          message: `Elemento en ${vName}[${i}] no pudo ser reconciliado de forma segura.`
        });
      }
    });
  };

  verifyConsumption(baseArr, bAssigned, 'base');
  verifyConsumption(serverArr, sAssigned, 'server');
  verifyConsumption(localArr, lAssigned, 'local');

  return { alignedTuples, conflicts, projectionMap };
}

/**
 * Reconciliador de clusters de multiplicidad sin emparejamiento por índice.
 */
function reconcilePureLegacyCluster(sig, bEntries, sEntries, lEntries, bAssigned, sAssigned, lAssigned, recordAlignment, conflicts, path) {
  const bLen = bEntries.length;
  const sLen = sEntries.length;
  const lLen = lEntries.length;

  if (bLen === 0 && sLen === 0 && lLen === 0) return;

  // CASO N=1: Correspondencia unívoca absoluta 1:1:1
  if (bLen === 1 && sLen === 1 && lLen === 1) {
    const bE = bEntries[0]; const sE = sEntries[0]; const lE = lEntries[0];
    bAssigned.add(bE.i); sAssigned.add(sE.i); lAssigned.add(lE.i);
    const uId = `u_leg_${encodeURIComponent(sig)}`;
    recordAlignment(uId, bE.f, sE.f, lE.f, true);
    return;
  }

  // CASO B=0: Altas netas independientes sin base previa
  if (bLen === 0) {
    sEntries.forEach((sE, idx) => {
      sAssigned.add(sE.i);
      const uId = sE.f.instanceId || `u_add_s_${encodeURIComponent(sig)}_${idx}`;
      recordAlignment(uId, MISSING, sE.f, MISSING, true);
    });
    lEntries.forEach((lE, idx) => {
      lAssigned.add(lE.i);
      const uId = lE.f.instanceId || `u_add_l_${encodeURIComponent(sig)}_${idx}`;
      recordAlignment(uId, MISSING, MISSING, lE.f, true);
    });
    return;
  }

  // CASO B=1 con Eliminación Unilateral Limpia
  if (bLen === 1 && sLen === 0 && lLen === 1) {
    const bE = bEntries[0]; const lE = lEntries[0];
    bAssigned.add(bE.i); lAssigned.add(lE.i);
    const uId = `u_leg_${encodeURIComponent(sig)}`;
    recordAlignment(uId, bE.f, MISSING, lE.f, true);
    return;
  }

  if (bLen === 1 && sLen === 1 && lLen === 0) {
    const bE = bEntries[0]; const sE = sEntries[0];
    bAssigned.add(bE.i); sAssigned.add(sE.i);
    const uId = `u_leg_${encodeURIComponent(sig)}`;
    recordAlignment(uId, bE.f, sE.f, MISSING, true);
    return;
  }

  // CASO B >= 2: Duplicados Indistinguibles en Base
  // Comparación matemática de multiconjuntos clínicos normalizados
  const bMultiset = bEntries.map(e => serializeClinicalPrescription(e.f)).sort();
  const sMultiset = sEntries.map(e => serializeClinicalPrescription(e.f)).sort();
  const lMultiset = lEntries.map(e => serializeClinicalPrescription(e.f)).sort();

  const sEqualB = canonicalJsonSerialize(sMultiset) === canonicalJsonSerialize(bMultiset);
  const lEqualB = canonicalJsonSerialize(lMultiset) === canonicalJsonSerialize(bMultiset);
  const sEqualL = canonicalJsonSerialize(sMultiset) === canonicalJsonSerialize(lMultiset);

  // REGLA 1: Mutación cruzada dispar sobre duplicados indistinguibles -> BLOQUEO OBLIGATORIO
  if (!sEqualB && !lEqualB && !sEqualL) {
    conflicts.push({
      path: `${path}[${sig}]`,
      type: IDENTITY_CONFLICTS.AMBIGUOUS_LEGACY_IDENTITY,
      message: `Conflicto clínico irreconciliable: mutaciones dispares sobre copias de duplicados legacy indistinguibles ("${sig}"). Persistencia bloqueada.`
    });
    // Retener Local para visualización en UI sin emparejar con Base ni Servidor
    lEntries.forEach((lE, idx) => {
      lAssigned.add(lE.i);
      const uId = lE.f.instanceId || `u_conflict_${encodeURIComponent(sig)}_${idx}`;
      recordAlignment(uId, MISSING, MISSING, lE.f, true);
    });
    bEntries.forEach(e => bAssigned.add(e.i));
    sEntries.forEach(e => sAssigned.add(e.i));
    return;
  }

  // REGLA 2: Mutación Unilateral Local (Servidor no cambió: S == B)
  if (sEqualB && !lEqualB) {
    bEntries.forEach(e => bAssigned.add(e.i));
    sEntries.forEach(e => sAssigned.add(e.i));
    lEntries.forEach((lE, idx) => {
      lAssigned.add(lE.i);
      const uId = lE.f.instanceId || `u_loc_cluster_${encodeURIComponent(sig)}_${idx}`;
      recordAlignment(uId, MISSING, MISSING, lE.f, true);
    });
    return;
  }

  // REGLA 3: Mutación Unilateral Servidor (Local no cambió: L == B)
  if (lEqualB && !sEqualB) {
    bEntries.forEach(e => bAssigned.add(e.i));
    lEntries.forEach(e => lAssigned.add(e.i));
    sEntries.forEach((sE, idx) => {
      sAssigned.add(sE.i);
      const uId = sE.f.instanceId || `u_srv_cluster_${encodeURIComponent(sig)}_${idx}`;
      recordAlignment(uId, MISSING, sE.f, MISSING, true);
    });
    return;
  }

  // REGLA 4: Convergencia Exacta (S == L)
  bEntries.forEach(e => bAssigned.add(e.i));
  sEntries.forEach(e => sAssigned.add(e.i));
  lEntries.forEach((lE, idx) => {
    lAssigned.add(lE.i);
    const uId = lE.f.instanceId || `u_conv_cluster_${encodeURIComponent(sig)}_${idx}`;
    recordAlignment(uId, MISSING, MISSING, lE.f, true);
  });
}
