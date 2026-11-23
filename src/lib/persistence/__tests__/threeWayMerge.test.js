/**
 * threeWayMerge.test.js — Suite de pruebas del motor de fusión tripartita
 *
 * Ejecutado en tiempo de ejecución por /api/tests/persistence.
 * No requiere Jest ni Vitest.
 */

import {
  threeWayPathMerge,
  mergeFoodArrays,
  mergePatientMenu,
  reconcileClinicalFields,
  MERGE_CONFLICTS
} from '../threeWayMerge.js';
import { MISSING } from '../identity.js';

// ---------------------------------------------------------------------------
// Micro-runner (mismo patrón que los otros módulos de test)
// ---------------------------------------------------------------------------
function createRunner(suiteName) {
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
    }
  }

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Aserción fallida');
  }

  function assertDeepEqual(a, b, msg) {
    const sa = JSON.stringify(a, _replacer, 2);
    const sb = JSON.stringify(b, _replacer, 2);
    if (sa !== sb) throw new Error((msg || 'Objetos no iguales') + `\nEsperado: ${sb}\nObtenido: ${sa}`);
  }

  function _replacer(_, v) {
    if (typeof v === 'symbol') return `Symbol(${String(v)})`;
    return v;
  }

  function summary() {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    return { module: suiteName, total: results.length, passed, failed, results };
  }

  return { test, assert, assertDeepEqual, summary };
}

// ---------------------------------------------------------------------------
// Tests de threeWayPathMerge
// ---------------------------------------------------------------------------
function runScalarMergeTests() {
  const { test, assert, assertDeepEqual, summary } = createRunner('threeWayMerge — Escalares');

  // T1: Sin cambios → devuelve base
  test('T1: Sin cambios (S==B, L==B) devuelve clon de base', () => {
    const conflicts = [];
    const result = threeWayPathMerge(42, 42, 42, 'campo', conflicts);
    assert(result === 42, `Esperado 42, obtenido ${result}`);
    assert(conflicts.length === 0, 'No debe haber conflictos');
  });

  // T2: Solo local cambió → adopta local
  test('T2: Solo local cambió (S==B, L!=B) → adopta local', () => {
    const conflicts = [];
    const result = threeWayPathMerge('original', 'original', 'modificado', 'campo', conflicts);
    assert(result === 'modificado', `Esperado "modificado", obtenido "${result}"`);
    assert(conflicts.length === 0, 'No debe haber conflictos');
  });

  // T3: Solo servidor cambió → adopta servidor
  test('T3: Solo servidor cambió (S!=B, L==B) → adopta servidor', () => {
    const conflicts = [];
    const result = threeWayPathMerge('original', 'nuevo', 'original', 'campo', conflicts);
    assert(result === 'nuevo', `Esperado "nuevo", obtenido "${result}"`);
    assert(conflicts.length === 0, 'No debe haber conflictos');
  });

  // T4: Ambos cambiaron igual → convergente, sin conflicto
  test('T4: Ambos cambiaron igual (S==L, S!=B) → convergente sin conflicto', () => {
    const conflicts = [];
    const result = threeWayPathMerge('viejo', 'nuevo', 'nuevo', 'campo', conflicts);
    assert(result === 'nuevo', `Esperado "nuevo", obtenido "${result}"`);
    assert(conflicts.length === 0, 'No debe haber conflictos en convergencia');
  });

  // T5: Ambos cambiaron diferente → conflicto, usa local como provisional
  test('T5: Ambos cambiaron diferente (S!=L, ambos!=B) → conflicto registrado', () => {
    const conflicts = [];
    const result = threeWayPathMerge('original', 'desde-servidor', 'desde-local', 'mi.campo', conflicts);
    assert(result === 'desde-local', `Provisional debe ser local, obtenido "${result}"`);
    assert(conflicts.length === 1, `Esperado 1 conflicto, obtenido ${conflicts.length}`);
    assert(conflicts[0].type === MERGE_CONFLICTS.SCALAR_CONFLICT, 'Tipo incorrecto de conflicto');
    assert(conflicts[0].path === 'mi.campo', 'Path del conflicto incorrecto');
  });

  // T6: Objetos anidados — convergente
  test('T6: Objetos anidados convergentes → sin conflicto', () => {
    const base   = { a: 1, b: 2 };
    const server = { a: 1, b: 99 };
    const local  = { a: 1, b: 99 };
    const conflicts = [];
    const result = threeWayPathMerge(base, server, local, 'obj', conflicts);
    assert(conflicts.length === 0, 'Sin conflictos esperado');
    assert(result.b === 99, 'b debe ser 99');
  });

  return summary();
}

// ---------------------------------------------------------------------------
// Tests de mergeFoodArrays
// ---------------------------------------------------------------------------
function runFoodArrayTests() {
  const { test, assert, assertDeepEqual, summary } = createRunner('threeWayMerge — Arrays de Alimentos');

  // Helpers
  const food = (instanceId, name, qty) => ({ instanceId, name, qty });
  const legacyFood = (name, qty) => ({ name, qty }); // sin instanceId

  // T7: Sin cambios → devuelve array idéntico
  test('T7: Sin cambios en ninguna rama → array resultante idéntico', () => {
    const f1 = food('uuid-1', 'Pollo', 100);
    const f2 = food('uuid-2', 'Arroz', 150);
    const arr = [f1, f2];
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(arr, arr, arr);
    assert(isPersistenceAllowed, 'Persistencia debe estar permitida');
    assert(conflicts.length === 0, 'Sin conflictos');
    assert(merged.length === 2, `Esperado 2 elementos, obtenido ${merged.length}`);
  });

  // T8: Modificación unilateral local de cantidad
  test('T8: Local modifica cantidad → adopta local', () => {
    const base   = [food('uuid-1', 'Pollo', 100)];
    const server = [food('uuid-1', 'Pollo', 100)];
    const local  = [food('uuid-1', 'Pollo', 150)];
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia debe estar permitida');
    assert(conflicts.length === 0, 'Sin conflictos');
    assert(merged[0].qty === 150, `Cantidad esperada 150, obtenida ${merged[0].qty}`);
  });

  // T9: Modificación unilateral del servidor
  test('T9: Servidor modifica cantidad → adopta servidor', () => {
    const base   = [food('uuid-1', 'Pollo', 100)];
    const server = [food('uuid-1', 'Pollo', 200)];
    const local  = [food('uuid-1', 'Pollo', 100)];
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia debe estar permitida');
    assert(merged[0].qty === 200, `Cantidad esperada 200, obtenida ${merged[0].qty}`);
  });

  // T10: Alta concurrente — ambas ramas añaden un alimento distinto
  test('T10: Altas concurrentes → dos instancias independientes en el resultado', () => {
    const base   = [];
    const server = [food('uuid-s', 'Tomate', 50)];
    const local  = [food('uuid-l', 'Lechuga', 80)];
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    // Ambas instancias son independientes → 2 elementos
    assert(merged.length === 2, `Esperado 2, obtenido ${merged.length}`);
  });

  // T11: Eliminación convergente — ambas ramas eliminan el alimento
  test('T11: Eliminación convergente → alimento ausente en resultado', () => {
    const f1 = food('uuid-1', 'Pollo', 100);
    const f2 = food('uuid-2', 'Arroz', 150);
    const base   = [f1, f2];
    const server = [f2]; // elimina f1
    const local  = [f2]; // elimina f1
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged.length === 1, `Esperado 1 elemento, obtenido ${merged.length}`);
    assert(merged[0].instanceId === 'uuid-2', 'Solo debe quedar uuid-2');
  });

  // T12: Alimento legacy 1:1:1 → fusión correcta
  test('T12: Legacy 1:1:1 con modificación local → adopta local', () => {
    const base   = [legacyFood('Pollo', 100)];
    const server = [legacyFood('Pollo', 100)];
    const local  = [legacyFood('Pollo', 150)];
    const { merged, conflicts, isPersistenceAllowed, legacyItemsToMigrate } = mergeFoodArrays(base, server, local);
    assert(merged.length === 1, 'Un solo elemento');
    assert(merged[0].qty === 150, `Cantidad esperada 150, obtenida ${merged[0].qty}`);
    assert(legacyItemsToMigrate.length === 1, 'Debe marcarse para migración');
  });

  // T13: Legacy duplicados indistinguibles con mutaciones dispares → conflicto AMBIGUOUS_LEGACY_IDENTITY
  test('T13: Legacy duplicados con mutaciones dispares → bloqueo AMBIGUOUS_LEGACY_IDENTITY', () => {
    // Dos pollos idénticos en base, servidor modifica uno, local modifica el otro de forma diferente
    const base   = [legacyFood('Pollo', 100), legacyFood('Pollo', 100)];
    const server = [legacyFood('Pollo', 200), legacyFood('Pollo', 200)]; // S != B
    const local  = [legacyFood('Pollo', 150), legacyFood('Pollo', 150)]; // L != B, L != S
    const { merged, conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    assert(!isPersistenceAllowed, 'Persistencia debe estar bloqueada');
    assert(conflicts.length > 0, 'Debe haber conflictos');
    const hasAmbiguous = conflicts.some(c =>
      c.type === 'AMBIGUOUS_LEGACY_IDENTITY' || c.type === MERGE_CONFLICTS.IDENTITY_CONFLICT
    );
    assert(hasAmbiguous, `Esperado conflicto de ambigüedad, obtenidos: ${conflicts.map(c=>c.type).join(', ')}`);
  });

  // T14: Eliminación de servidor + modificación local → SERVER_DELETED_LOCAL_MODIFIED
  test('T14: Servidor elimina, local modifica → conflicto SERVER_DELETED_LOCAL_MODIFIED', () => {
    const base   = [food('uuid-1', 'Pollo', 100)];
    const server = [];                                   // servidor eliminó el alimento
    const local  = [food('uuid-1', 'Pollo', 150)];      // local lo modificó
    const { conflicts, isPersistenceAllowed } = mergeFoodArrays(base, server, local);
    assert(!isPersistenceAllowed, 'Persistencia debe estar bloqueada');
    const hasConflict = conflicts.some(c => c.type === MERGE_CONFLICTS.SERVER_DELETED_LOCAL_MODIFIED);
    assert(hasConflict, `Esperado SERVER_DELETED_LOCAL_MODIFIED, obtenidos: ${conflicts.map(c=>c.type).join(', ')}`);
  });

  return summary();
}

// ---------------------------------------------------------------------------
// Tests de mergePatientMenu
// ---------------------------------------------------------------------------
function runMenuMergeTests() {
  const { test, assert, assertDeepEqual, summary } = createRunner('threeWayMerge — Menú Completo');

  const food = (instanceId, name, qty) => ({ instanceId, name, qty });

  // T15: Guardar day1 no sobrescribe day2
  test('T15: Guardar day1 no sobrescribe day2 del servidor', () => {
    const day1Foods = [food('uuid-a', 'Arroz', 100)];
    const day2Foods = [food('uuid-b', 'Leche', 200)];

    const base   = { _days: { day1: { desayuno: [] }, day2: { desayuno: day2Foods } } };
    const server = { _days: { day1: { desayuno: [] }, day2: { desayuno: day2Foods } } };
    // local solo envía day1
    const local  = { _days: { day1: { desayuno: day1Foods } } };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged._days.day2 !== undefined, 'day2 debe preservarse');
    assert(Array.isArray(merged._days.day2.desayuno), 'desayuno de day2 debe ser array');
    assert(merged._days.day2.desayuno.length === 1, 'day2 debe conservar su alimento');
    assert(merged._days.day2.desayuno[0].instanceId === 'uuid-b', 'Alimento de day2 intacto');
    assert(merged._days.day1.desayuno.length === 1, 'day1 actualizado correctamente');
  });

  // T16: dietForm y formulas preservados cuando no vienen en payload
  test('T16: dietForm y formulas del servidor se preservan si local no los envía', () => {
    const base   = { dietForm: 'dieta-A', formulas: ['f1'] };
    const server = { dietForm: 'dieta-A', formulas: ['f1'] };
    const local  = {}; // local no envía dietForm ni formulas

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    // dietForm y formulas deben provenir del servidor (sin cambios)
    assert(merged.dietForm === 'dieta-A', `dietForm esperado "dieta-A", obtenido "${merged.dietForm}"`);
    assert(Array.isArray(merged.formulas) && merged.formulas[0] === 'f1', 'formulas debe preservarse');
  });

  // T17: Modificación concurrente en dietForm → conflicto, bloquea persistencia
  test('T17: Modificación concurrente en dietForm → conflicto registrado', () => {
    const base   = { dietForm: 'dieta-A' };
    const server = { dietForm: 'dieta-B' }; // servidor cambió
    const local  = { dietForm: 'dieta-C' }; // local cambió diferente

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(!isPersistenceAllowed, 'Persistencia bloqueada por conflicto');
    assert(conflicts.length > 0, 'Debe haber conflictos');
    assert(conflicts[0].type === MERGE_CONFLICTS.SCALAR_CONFLICT, 'Tipo incorrecto');
    assert(merged.dietForm === 'dieta-C', 'Valor provisional debe ser local');
  });

  // T18: Arrays de alimentos dentro del menú se fusionan correctamente
  test('T18: Fusión de alimentos dentro de un slot de menú (añadir por servidor)', () => {
    const base   = { _days: { day1: { almuerzo: [] } } };
    const server = { _days: { day1: { almuerzo: [food('uuid-s', 'Pollo', 120)] } } };
    const local  = { _days: { day1: { almuerzo: [] } } };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged._days.day1.almuerzo.length === 1, 'Alimento añadido por servidor debe estar presente');
  });

  // T19: Regresión — No resucitar día eliminado concurrentemente en el servidor
  test('T19: Día eliminado en el servidor no se resucita desde base cuando local no lo envía', () => {
    const day1Foods = [food('uuid-d1', 'Avena', 50)];
    const day2Foods = [food('uuid-d2', 'Pollo', 150)];

    const base = {
      _days: {
        day1: { desayuno: day1Foods },
        day2: { almuerzo: day2Foods }
      }
    };
    // El servidor eliminó day2 concurrentemente
    const server = {
      _days: {
        day1: { desayuno: day1Foods }
      }
    };
    // Local solo editó day1 (day2 no viene en payload local)
    const local = {
      _days: {
        day1: { desayuno: [...day1Foods, food('uuid-d1-b', 'Nueces', 20)] }
      }
    };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'No debe haber conflictos');
    assert(merged._days.day1.desayuno.length === 2, 'day1 debe actualizarse con el alimento nuevo');
    assert(merged._days.day2 === undefined, 'day2 NO debe resucitarse de base si fue eliminado en el servidor');
  });

  // T20: Regresión — Comida omitida en payload local NO se interpreta como comida vacía
  test('T20: Comida omitida en payload local preserva alimentos del servidor sin vaciar el slot', () => {
    const fDesayuno = food('uuid-des', 'Huevos', 2);
    const fCena1 = food('uuid-c1', 'Sopa', 250);
    const fCena2 = food('uuid-c2', 'Pan', 50);

    const base = {
      _days: {
        day1: {
          desayuno: [fDesayuno],
          cena: [fCena1, fCena2]
        }
      }
    };
    const server = {
      _days: {
        day1: {
          desayuno: [fDesayuno],
          cena: [fCena1, fCena2]
        }
      }
    };
    // Local solo envía desayuno; cena queda omitida (undefined) en local._days.day1
    const local = {
      _days: {
        day1: {
          desayuno: [fDesayuno, food('uuid-des-2', 'Aguacate', 30)]
        }
      }
    };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'No debe haber conflictos');
    assert(merged._days.day1.desayuno.length === 2, 'Desayuno local debe incorporarse');
    assert(Array.isArray(merged._days.day1.cena), 'Cena debe existir como array');
    assert(merged._days.day1.cena.length === 2, `Cena omitida debe conservar sus 2 alimentos del servidor, obtenidos ${merged._days.day1.cena.length}`);
    assert(merged._days.day1.cena[0].instanceId === 'uuid-c1', 'Alimento 1 de cena intacto');
    assert(merged._days.day1.cena[1].instanceId === 'uuid-c2', 'Alimento 2 de cena intacto');
  });

  // T21: Regresión — Eliminación explícita (array vacío []) sí vacía la comida
  test('T21: Eliminación explícita de comida (array []) sí vacía el slot correctamente', () => {
    const fCena = food('uuid-c1', 'Sopa', 250);

    const base = {
      _days: {
        day1: { cena: [fCena] }
      }
    };
    const server = {
      _days: {
        day1: { cena: [fCena] }
      }
    };
    // Local explícitamente envía array vacío para eliminar los alimentos de la cena
    const local = {
      _days: {
        day1: { cena: [] }
      }
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(Array.isArray(merged._days.day1.cena), 'Cena debe ser array');
    assert(merged._days.day1.cena.length === 0, 'Cena debe quedar vacía por eliminación explícita del usuario');
  });

  // T22: Regresión — Fusión en estructura de comida tipo objeto ({ time, selectedFoods, portions })
  test('T22: Fusión de estructura de comida tipo objeto preserva selectedFoods y metadatos', () => {
    const f1 = food('uuid-f1', 'Pescado', 150);
    const f2 = food('uuid-f2', 'Ensalada', 80);

    const base = {
      _days: {
        day1: {
          almuerzo: { time: '13:00', selectedFoods: [f1], portions: { proteinas: '1' } }
        }
      }
    };
    // Servidor cambió time a 13:30
    const server = {
      _days: {
        day1: {
          almuerzo: { time: '13:30', selectedFoods: [f1], portions: { proteinas: '1' } }
        }
      }
    };
    // Local añadió ensalada a selectedFoods
    const local = {
      _days: {
        day1: {
          almuerzo: { time: '13:00', selectedFoods: [f1, f2], portions: { proteinas: '1' } }
        }
      }
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    const alm = merged._days.day1.almuerzo;
    assert(alm.time === '13:30', `time del servidor (13:30) debe prevalecer, obtenido ${alm.time}`);
    assert(alm.selectedFoods.length === 2, `selectedFoods debe contener 2 alimentos, obtenidos ${alm.selectedFoods.length}`);
    assert(alm.portions.proteinas === '1', 'portions debe preservarse');
  });

  // T23: Claves desconocidas — cambio solo en servidor: gana servidor
  test('T23: Claves desconocidas — cambio solo en servidor: gana servidor', () => {
    const base = { customClinicCode: 'CLINIC-10' };
    const server = { customClinicCode: 'CLINIC-20' }; // Servidor actualizó código
    const local = { customClinicCode: 'CLINIC-10' };  // Local no lo cambió

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'Cero conflictos');
    assert(merged.customClinicCode === 'CLINIC-20', `Gana servidor: esperado CLINIC-20, obtenido ${merged.customClinicCode}`);
  });

  // T24: Claves desconocidas — cambio solo en local: gana local
  test('T24: Claves desconocidas — cambio solo en local: gana local', () => {
    const base = { customClinicCode: 'CLINIC-10' };
    const server = { customClinicCode: 'CLINIC-10' }; // Servidor intacto
    const local = { customClinicCode: 'CLINIC-30' };  // Local actualizó

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'Cero conflictos');
    assert(merged.customClinicCode === 'CLINIC-30', `Gana local: esperado CLINIC-30, obtenido ${merged.customClinicCode}`);
  });

  // T25: Claves desconocidas — ambos cambian al mismo valor: convergencia limpia
  test('T25: Claves desconocidas — ambos cambian al mismo valor: convergencia sin conflicto', () => {
    const base = { noteDoctor: 'Nota inicial' };
    const server = { noteDoctor: 'Nota convergente' };
    const local = { noteDoctor: 'Nota convergente' };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'Cero conflictos en convergencia');
    assert(merged.noteDoctor === 'Nota convergente', 'Valor convergente adoptado');
  });

  // T26: Claves desconocidas — ambos cambian a valores distintos: conflicto y bloqueo
  test('T26: Claves desconocidas — ambos cambian a valores distintos: conflicto y persistencia bloqueada', () => {
    const base = { customTag: 'tag-A' };
    const server = { customTag: 'tag-B' }; // Servidor puso B
    const local = { customTag: 'tag-C' };  // Local puso C

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(!isPersistenceAllowed, 'Persistencia DEBE bloquearse ante conflicto en clave desconocida');
    assert(conflicts.length > 0, 'Debe registrarse el conflicto');
    assert(conflicts.some(c => c.path === 'customTag'), 'El path del conflicto debe señalar a customTag');
    assert(merged.customTag === 'tag-C', 'Valor provisional debe ser local');
  });

  // T27: Claves desconocidas — propiedad omitida en local: conservar versión de servidor
  test('T27: Claves desconocidas — omitida en local: conserva la del servidor sin resucitar base', () => {
    const base = { serverCode: 'SC-1', deletedCode: 'DEL-1' };
    const server = { serverCode: 'SC-2' }; // Servidor actualizó serverCode y eliminó deletedCode
    const local = {};                       // Local no envió ninguna clave desconocida

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged.serverCode === 'SC-2', 'serverCode del servidor debe conservarse');
    assert(merged.deletedCode === undefined, 'deletedCode eliminado en servidor NO debe resucitarse de base');
  });

  // T28: Claves desconocidas — eliminación explícita (null) se respeta
  test('T28: Claves desconocidas — eliminación explícita (null) elimina la clave', () => {
    const base = { extraNote: 'Aviso anterior' };
    const server = { extraNote: 'Aviso anterior' };
    const local = { extraNote: null }; // Eliminación explícita mediante null

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged.extraNote === null || merged.extraNote === undefined, 'extraNote debe eliminarse');
  });

  return summary();
}

// ---------------------------------------------------------------------------
// Tests de reconcileClinicalFields (Reconciliación Clínica)
// ---------------------------------------------------------------------------
function runClinicalReconciliationTests() {
  const { test, assert, summary } = createRunner('threeWayMerge — Reconciliación Clínica');

  // CR1: Modificar una propiedad de details no elimina las demás
  test('CR1: Modificar una propiedad de details conserva las demás del servidor', () => {
    const base = {
      details: { name: 'Ana', phone: '0414-111', ci: 'V-1234', weight: 65 }
    };
    const server = {
      details: { name: 'Ana', phone: '0414-111', ci: 'V-1234', weight: 65, medications: 'Eutirox' }
    };
    // Local solo modificó phone
    const local = {
      details: { phone: '0414-222' }
    };

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(mergedUpdate.details.phone === '0414-222', 'phone local aplicado');
    assert(mergedUpdate.details.name === 'Ana', 'name preservado');
    assert(mergedUpdate.details.ci === 'V-1234', 'ci preservada');
    assert(mergedUpdate.details.weight === 65, 'weight preservado');
    assert(mergedUpdate.details.medications === 'Eutirox', 'medications añadida por servidor preservada');
  });

  // CR2: Modificar una medición no elimina otras mediciones
  test('CR2: Modificar una medición no elimina otras mediciones del servidor', () => {
    const base = {
      measurements: { PESO: '70', CINTURA: '85', CUELLO: '38' }
    };
    const server = {
      measurements: { PESO: '70', CINTURA: '85', CUELLO: '38', BRAZO: '32' }
    };
    // Local solo modificó CINTURA
    const local = {
      measurements: { CINTURA: '82' }
    };

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(mergedUpdate.measurements.CINTURA === '82', 'CINTURA local aplicada');
    assert(mergedUpdate.measurements.PESO === '70', 'PESO intacto');
    assert(mergedUpdate.measurements.CUELLO === '38', 'CUELLO intacto');
    assert(mergedUpdate.measurements.BRAZO === '32', 'BRAZO del servidor intacto');
  });

  // CR3: Un campo omitido no se interpreta como eliminado
  test('CR3: Campo omitido en local no se interpreta como eliminación', () => {
    const base = { details: { email: 'ana@mail.com', notas: 'Paciente con reflujo' } };
    const server = { details: { email: 'ana@mail.com', notas: 'Paciente con reflujo' } };
    const local = { details: { notas: 'Reflujo controlado' } }; // email omitido

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(mergedUpdate.details.email === 'ana@mail.com', 'email omitido no debe eliminarse');
    assert(mergedUpdate.details.notas === 'Reflujo controlado', 'notas actualizadas');
  });

  // CR4: Eliminación explícita sí se respeta
  test('CR4: Eliminación explícita (null) en details se respeta', () => {
    const base = { details: { tutorPhone: '0412-555' } };
    const server = { details: { tutorPhone: '0412-555' } };
    const local = { details: { tutorPhone: null } }; // Eliminación explícita

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(mergedUpdate.details.tutorPhone === null, 'tutorPhone explícitamente eliminado a null');
  });

  // CR5: Dos cambios independientes se fusionan limpiamente
  test('CR5: Dos cambios independientes (servidor modificó peso, local modificó teléfono) se fusionan', () => {
    const base = {
      details: { weight: 68, phone: '0414-000' }
    };
    const server = {
      details: { weight: 70, phone: '0414-000' } // Servidor cambió weight
    };
    const local = {
      details: { weight: 68, phone: '0414-999' } // Local cambió phone (con weight de base)
    };

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(mergedUpdate.details.weight === 70, `Weight del servidor (70) preservado, obtenido ${mergedUpdate.details.weight}`);
    assert(mergedUpdate.details.phone === '0414-999', 'Phone de local aplicado');
  });

  // CR6: Dos cambios incompatibles en el mismo campo generan conflicto y bloquean la escritura
  test('CR6: Dos cambios incompatibles en el mismo campo generan conflicto y bloquean persistencia', () => {
    const base = { details: { weight: 68 } };
    const server = { details: { weight: 70 } }; // Servidor registró 70
    const local = { details: { weight: 72 } };  // Local registró 72

    const { conflicts, isPersistenceAllowed } = reconcileClinicalFields(base, server, local);
    assert(!isPersistenceAllowed, 'Persistencia bloqueada ante conflicto en mismo campo clínico');
    assert(conflicts.length > 0, 'Debe haber conflictos');
    assert(conflicts[0].field === 'details.weight', 'Conflicto debe señalar details.weight');
  });

  return summary();
}

// ---------------------------------------------------------------------------
// Exportación principal
// ---------------------------------------------------------------------------
export function runThreeWayMergeTests() {
  const r1 = runScalarMergeTests();
  const r2 = runFoodArrayTests();
  const r3 = runMenuMergeTests();
  const r4 = runClinicalReconciliationTests();

  const total  = r1.total  + r2.total  + r3.total  + r4.total;
  const passed = r1.passed + r2.passed + r3.passed + r4.passed;
  const failed = r1.failed + r2.failed + r3.failed + r4.failed;

  return {
    module: 'threeWayMerge',
    total,
    passed,
    failed,
    suites: [r1, r2, r3, r4]
  };
}
