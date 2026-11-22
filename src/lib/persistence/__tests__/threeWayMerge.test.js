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

  return summary();
}

// ---------------------------------------------------------------------------
// Exportación principal
// ---------------------------------------------------------------------------
export function runThreeWayMergeTests() {
  const r1 = runScalarMergeTests();
  const r2 = runFoodArrayTests();
  const r3 = runMenuMergeTests();

  const total  = r1.total  + r2.total  + r3.total;
  const passed = r1.passed + r2.passed + r3.passed;
  const failed = r1.failed + r2.failed + r3.failed;

  return {
    module: 'threeWayMerge',
    total,
    passed,
    failed,
    suites: [r1, r2, r3]
  };
}
