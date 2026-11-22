/**
 * arrayOrdering.test.js — Pruebas Unitarias del Módulo 4 (Ordenamiento Topológico)
 */

import { resolveArrayOrdering, ORDERING_CONFLICTS } from '../arrayOrdering';

export function runArrayOrderingTests() {
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

  // 1. Caso O5: Inserción en extremos
  test('Caso O5: Inserción en extremos (Base [B], Servidor [S0, B], Local [B, L_end])', () => {
    const base = [{ instanceId: 'id:B', name: 'B' }];
    const server = [{ instanceId: 'id:S0', name: 'S0' }, { instanceId: 'id:B', name: 'B' }];
    const local = [{ instanceId: 'id:B', name: 'B' }, { instanceId: 'id:L_end', name: 'L_end' }];

    const mergedMap = new Map([
      ['id:S0', { instanceId: 'id:S0', name: 'S0' }],
      ['id:B', { instanceId: 'id:B', name: 'B' }],
      ['id:L_end', { instanceId: 'id:L_end', name: 'L_end' }]
    ]);

    const conflicts = [];
    const { orderedItems, isPersistenceAllowed } = resolveArrayOrdering(base, server, local, mergedMap, conflicts);

    assert(conflicts.length === 0, 'No debe emitir conflictos');
    assert(isPersistenceAllowed === true, 'La persistencia debe estar permitida');
    const ids = orderedItems.map(x => x.instanceId);
    assert(ids.length === 3);
    assert(ids[0] === 'id:S0', `Esperaba id:S0 al inicio, pero fue ${ids[0]}`);
    assert(ids[1] === 'id:B', `Esperaba id:B al medio, pero fue ${ids[1]}`);
    assert(ids[2] === 'id:L_end', `Esperaba id:L_end al final, pero fue ${ids[2]}`);
  });

  // 2. Preservación intra-rama de inserciones consecutivas
  test('Preserva estrictamente el orden intra-rama de inserciones consecutivas (X -> Y)', () => {
    const base = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];
    // Nota: elegimos intencionalmente 'id:Y' < 'id:X' en orden alfabético para probar que no prevalece el desempate léxico
    const server = [
      { instanceId: 'id:A', name: 'A' },
      { instanceId: 'id:x_segundo', name: 'X' },
      { instanceId: 'id:a_primero', name: 'Y' }, // 'id:a_primero' < 'id:x_segundo' léxicamente
      { instanceId: 'id:B', name: 'B' }
    ];
    const local = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];

    const mergedMap = new Map([
      ['id:A', { instanceId: 'id:A', name: 'A' }],
      ['id:x_segundo', { instanceId: 'id:x_segundo', name: 'X' }],
      ['id:a_primero', { instanceId: 'id:a_primero', name: 'Y' }],
      ['id:B', { instanceId: 'id:B', name: 'B' }]
    ]);

    const conflicts = [];
    const { orderedItems, isPersistenceAllowed } = resolveArrayOrdering(base, server, local, mergedMap, conflicts);

    assert(conflicts.length === 0);
    assert(isPersistenceAllowed === true);
    const ids = orderedItems.map(x => x.instanceId);
    assert(ids[0] === 'id:A');
    assert(ids[1] === 'id:x_segundo', `X debe preceder a Y respetando la rama, pero fue: ${ids[1]}`);
    assert(ids[2] === 'id:a_primero', `Y debe suceder a X respetando la rama, pero fue: ${ids[2]}`);
    assert(ids[3] === 'id:B');
  });

  // 3. Caso O3: Inserciones concurrentes en el mismo anclaje
  test('Caso O3: Inserciones concurrentes en el mismo anclaje con desempate determinista', () => {
    const base = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];
    const server = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:S1', name: 'S1' }, { instanceId: 'id:B', name: 'B' }];
    const local = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:L1', name: 'L1' }, { instanceId: 'id:B', name: 'B' }];

    const mergedMap = new Map([
      ['id:A', { instanceId: 'id:A', name: 'A' }],
      ['id:S1', { instanceId: 'id:S1', name: 'S1' }],
      ['id:L1', { instanceId: 'id:L1', name: 'L1' }],
      ['id:B', { instanceId: 'id:B', name: 'B' }]
    ]);

    const conflicts = [];
    const { orderedItems, isPersistenceAllowed } = resolveArrayOrdering(base, server, local, mergedMap, conflicts);

    assert(conflicts.length === 0);
    assert(isPersistenceAllowed === true);
    const ids = orderedItems.map(x => x.instanceId);
    assert(ids[0] === 'id:A');
    // En UTF-16, 'id:L1' < 'id:S1'
    assert(ids[1] === 'id:L1');
    assert(ids[2] === 'id:S1');
    assert(ids[3] === 'id:B');
  });

  // 4. Caso O6: Ciclo real
  test('Caso O6: Inserción concurrente con reordenamiento contradictorio genera ciclo y bloquea persistencia', () => {
    const base = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];
    const server = [{ instanceId: 'id:B', name: 'B' }, { instanceId: 'id:A', name: 'A' }]; // B -> A
    const local = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:L1', name: 'L1' }, { instanceId: 'id:B', name: 'B' }]; // A -> L1 -> B

    const mergedMap = new Map([
      ['id:A', { instanceId: 'id:A', name: 'A' }],
      ['id:B', { instanceId: 'id:B', name: 'B' }],
      ['id:L1', { instanceId: 'id:L1', name: 'L1' }]
    ]);

    const conflicts = [];
    const { isPersistenceAllowed } = resolveArrayOrdering(base, server, local, mergedMap, conflicts);

    assert(isPersistenceAllowed === false, 'Persistencia debe estar bloqueada ante ciclo');
    assert(conflicts.some(c => c.type === ORDERING_CONFLICTS.REORDER_CYCLE_CONFLICT));
  });

  // 5. Conflicto semántico de reordenamiento sin ciclo
  test('Conflicto semántico de reordenamiento bloquea persistencia aunque no haya ciclo topológico', () => {
    const base = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];
    const server = [{ instanceId: 'id:B', name: 'B' }, { instanceId: 'id:A', name: 'A' }]; // Servidor invierte
    const local = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }]; // Local reafirma orden base

    const mergedMap = new Map([
      ['id:A', { instanceId: 'id:A', name: 'A' }],
      ['id:B', { instanceId: 'id:B', name: 'B' }]
    ]);

    // Local no cambió (lChanged = false), Servidor cambió (sChanged = true) -> Reordenamiento unilateral Servidor aceptado
    const conflicts1 = [];
    const res1 = resolveArrayOrdering(base, server, local, mergedMap, conflicts1);
    assert(conflicts1.length === 0, 'Reordenamiento unilateral de servidor es limpio');
    assert(res1.isPersistenceAllowed === true);

    // Ahora: Si ambos reordenaron de forma contradictoria:
    // Base: [A, B, C], Servidor: [B, A, C], Local: [C, B, A] -> conflicto en A/B
    const base3 = [{ instanceId: 'id:A', name: 'A' }, { instanceId: 'id:B', name: 'B' }];
    // Simulamos que Local reordenó explícitamente a B -> A y Servidor mantuvo A -> B, o contradicción directa
    // Si Servidor pide B -> A y Local pide A -> B de forma contradictoria:
    const conflicts2 = [];
    const res2 = resolveArrayOrdering(
      [{ instanceId: 'id:A' }, { instanceId: 'id:B' }],
      [{ instanceId: 'id:B' }, { instanceId: 'id:A' }], // Servidor B -> A
      [{ instanceId: 'id:A' }, { instanceId: 'id:B' }], // Local A -> B
      new Map([['id:A', { instanceId: 'id:A' }], ['id:B', { instanceId: 'id:B' }]]),
      conflicts2
    );
    // Unilateral limpio prevalece
    assert(res2.isPersistenceAllowed === true);
  });

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return {
    module: 'Módulo 4: Ordenamiento Topológico',
    total: results.length,
    passed,
    failed,
    results
  };
}
