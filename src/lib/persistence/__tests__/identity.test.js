/**
 * identity.test.js — Pruebas Unitarias del Módulo 2 (Identidad y Correspondencia)
 */

import {
  classifyFoodIdentifier,
  computeCatalogSignature,
  validateIntraVersionUniqueness,
  alignFoodCollections,
  IDENTIFIER_KIND,
  IDENTITY_CONFLICTS,
  MISSING
} from '../identity';

export function runIdentityTests() {
  const results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name, status: 'PASSED' });
    } catch (err) {
      results.push({ name, status: 'FAILED', error: err.message, stack: err.stack });
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  // 1. Clasificación de identificadores
  test('Clasifica correctamente tipos de identificadores', () => {
    assert(classifyFoodIdentifier('uuid-1234') === IDENTIFIER_KIND.PERSISTED);
    assert(classifyFoodIdentifier('1719283746.1283') === IDENTIFIER_KIND.PERSISTED);
    assert(classifyFoodIdentifier('prov_abc123') === IDENTIFIER_KIND.PROVISIONAL);
    assert(classifyFoodIdentifier('') === IDENTIFIER_KIND.LEGACY_NO_ID);
    assert(classifyFoodIdentifier(null) === IDENTIFIER_KIND.LEGACY_NO_ID);
    assert(classifyFoodIdentifier(undefined) === IDENTIFIER_KIND.LEGACY_NO_ID);
  });

  // 2. Cálculo de firma canónica de catálogo
  test('Genera firma con precedencia de food.id sobre nombre variable', () => {
    const f1 = { id: 101, name: 'Avena Quaker', groupKey: 'cereales' };
    const f2 = { id: 101, name: 'Avena con canela', groupKey: 'cereales' };
    const sig1 = computeCatalogSignature(f1);
    const sig2 = computeCatalogSignature(f2);
    assert(sig1 === sig2, 'La firma debe basarse en el ID de catálogo');
    assert(sig1 === JSON.stringify(['cat', '101', 'cereales']));
  });

  test('Normaliza nombre clínico eliminando diacríticos cuando no hay food.id', () => {
    const f1 = { name: 'Plátano maduro', groupKey: 'frutas' };
    const f2 = { name: 'Platano Maduro ', groupKey: 'Frutas' };
    const sig1 = computeCatalogSignature(f1);
    const sig2 = computeCatalogSignature(f2);
    assert(sig1 === sig2, 'Nombres con tildes y mayúsculas deben coincidir');
  });

  // 3. Validación de unicidad intra-versión
  test('Detecta y rechaza duplicados de instanceId dentro de una misma versión', () => {
    const arr = [
      { instanceId: 'uuid-1', name: 'Avena' },
      { instanceId: 'uuid-1', name: 'Avena duplicada' }
    ];
    const conflicts = [];
    validateIntraVersionUniqueness(arr, 'base', conflicts, 'menu');
    assert(conflicts.length === 1, 'Debe emitir 1 conflicto');
    assert(conflicts[0].type === IDENTITY_CONFLICTS.DUPLICATE_INSTANCE_ID_IN_SAME_VERSION);
  });

  // 4. Transición canónica compartida (S y L con UUID frente a Base legacy)
  test('Resuelve transición cuando S y L comparten UUID y Base tiene 1 copia legacy (Caso D01)', () => {
    const base = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }]; // legacy sin instanceId
    const server = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales', instanceId: 'uuid-migrado-1' }];
    const local = [{ id: 101, name: 'Avena', qty: 150, groupKey: 'cereales', instanceId: 'uuid-migrado-1' }];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0, `No debe haber conflictos, pero hubo: ${JSON.stringify(conflicts)}`);
    assert(alignedTuples.length === 1, `Debe haber 1 tupla alineada, hubo ${alignedTuples.length}`);
    assert(alignedTuples[0].unifiedId === 'uuid-migrado-1');
    assert(alignedTuples[0].b !== MISSING, 'Base no debe ser MISSING');
    assert(alignedTuples[0].s !== MISSING, 'Server no debe ser MISSING');
    assert(alignedTuples[0].l !== MISSING, 'Local no debe ser MISSING');
  });

  test('Bloquea transición si Base tenía duplicados para esa firma (Ambigüedad)', () => {
    const base = [
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];
    const server = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales', instanceId: 'uuid-migrado-1' }];
    const local = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales', instanceId: 'uuid-migrado-1' }];

    const { conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 1, 'Debe generar conflicto de ambigüedad de transición');
    assert(conflicts[0].type === IDENTITY_CONFLICTS.CANONICAL_LEGACY_TRANSITION_AMBIGUITY);
  });

  // 5. Transición simétrica unilateral
  test('Resuelve migración unilateral en Local (Local tiene UUID, S y B son legacy)', () => {
    const base = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }];
    const server = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales', instanceId: 'prov_srv' }];
    const local = [{ id: 101, name: 'Avena', qty: 150, groupKey: 'cereales', instanceId: 'uuid-local-1' }];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0);
    assert(alignedTuples.length === 1);
    assert(alignedTuples[0].unifiedId === 'uuid-local-1');
  });

  test('Resuelve migración unilateral en Servidor (Servidor tiene UUID, L y B son legacy)', () => {
    const base = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }];
    const server = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales', instanceId: 'uuid-srv-1' }];
    const local = [{ id: 101, name: 'Avena', qty: 150, groupKey: 'cereales', instanceId: 'prov_loc' }];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0);
    assert(alignedTuples.length === 1);
    assert(alignedTuples[0].unifiedId === 'uuid-srv-1');
  });

  // 6. Eliminación canónica limpia
  test('Alinea eliminación canónica convergente cuando existía en Base y desapareció en S y L', () => {
    const base = [{ instanceId: 'uuid-1', name: 'Avena' }];
    const server = [];
    const local = [];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0);
    assert(alignedTuples.length === 1);
    assert(alignedTuples[0].unifiedId === 'uuid-1');
    assert(alignedTuples[0].b !== MISSING);
    assert(alignedTuples[0].s === MISSING);
    assert(alignedTuples[0].l === MISSING);
  });

  // 7. Altas concurrentes independientes sin deduplicación
  test('Conserva altas concurrentes de la misma firma como 2 instancias independientes', () => {
    const base = [];
    const server = [{ id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }];
    const local = [{ id: 101, name: 'Avena', qty: 150, groupKey: 'cereales' }];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0);
    assert(alignedTuples.length === 2, `Deben ser 2 instancias separadas, pero fueron ${alignedTuples.length}`);
  });

  // 8. Reconciliación de duplicados legacy sin emparejamiento por índice
  test('Bloquea duplicados legacy indistinguibles ante mutaciones dispares cruzadas', () => {
    const base = [
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];
    const server = [
      { id: 101, name: 'Avena', qty: 200, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];
    const local = [
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 300, groupKey: 'cereales' }
    ];

    const { conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 1);
    assert(conflicts[0].type === IDENTITY_CONFLICTS.AMBIGUOUS_LEGACY_IDENTITY);
  });

  test('Adopta mutación unilateral en duplicados legacy cuando Servidor no cambió (S == B)', () => {
    const base = [
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];
    const server = [
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];
    const local = [
      { id: 101, name: 'Avena', qty: 150, groupKey: 'cereales' },
      { id: 101, name: 'Avena', qty: 100, groupKey: 'cereales' }
    ];

    const { alignedTuples, conflicts } = alignFoodCollections(base, server, local);
    assert(conflicts.length === 0, `No debe haber conflicto, pero hubo: ${JSON.stringify(conflicts)}`);
    assert(alignedTuples.length === 2);
  });

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return {
    module: 'Módulo 2: Identidad y Correspondencia',
    total: results.length,
    passed,
    failed,
    results
  };
}
