/**
 * jsonContract.test.js — Pruebas Unitarias del Módulo 1 (Contrato JSON)
 */

import { safeValidateAndCloneJson, canonicalJsonSerialize, MISSING } from '../jsonContract';

export function runJsonContractTests() {
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

  function assertThrows(fn, expectedSubstr) {
    let threw = false;
    try {
      fn();
    } catch (err) {
      threw = true;
      if (expectedSubstr && !err.message.includes(expectedSubstr)) {
        throw new Error(`Se esperaba error con "${expectedSubstr}", pero se obtuvo: "${err.message}"`);
      }
    }
    if (!threw) {
      throw new Error('Se esperaba que la función lanzara un error, pero no lo hizo');
    }
  }

  // 1. Primitivos válidos
  test('Acepta primitivos válidos (strings, números finitos, booleanos, null)', () => {
    assert(safeValidateAndCloneJson('hola') === 'hola');
    assert(safeValidateAndCloneJson(123.45) === 123.45);
    assert(safeValidateAndCloneJson(0) === 0);
    assert(safeValidateAndCloneJson(true) === true);
    assert(safeValidateAndCloneJson(false) === false);
    assert(safeValidateAndCloneJson(null) === null);
  });

  // 2. Rechazo de tipos no serializables
  test('Rechaza undefined, funciones, símbolos y BigInt', () => {
    assertThrows(() => safeValidateAndCloneJson(undefined), 'undefined prohibido');
    assertThrows(() => safeValidateAndCloneJson(() => {}), 'tipo no serializable');
    assertThrows(() => safeValidateAndCloneJson(Symbol('test')), 'tipo no serializable');
    assertThrows(() => safeValidateAndCloneJson(10n), 'tipo no serializable');
  });

  // 3. Rechazo de números no finitos
  test('Rechaza NaN, Infinity y -Infinity', () => {
    assertThrows(() => safeValidateAndCloneJson(NaN), 'número no finito');
    assertThrows(() => safeValidateAndCloneJson(Infinity), 'número no finito');
    assertThrows(() => safeValidateAndCloneJson(-Infinity), 'número no finito');
  });

  // 4. Rechazo del centinela MISSING en entrada
  test('Rechaza centinela MISSING en datos de entrada', () => {
    assertThrows(() => safeValidateAndCloneJson(MISSING), 'centinela MISSING');
    assertThrows(() => safeValidateAndCloneJson({ valor: MISSING }), 'centinela MISSING');
    assertThrows(() => safeValidateAndCloneJson([MISSING]), 'centinela MISSING');
  });

  // 5. Rechazo de índices no canónicos en arrays
  test('Rechaza índices no canónicos en arrays ("01", "1.0", "-0")', () => {
    const a1 = [10];
    a1['01'] = 20;
    assertThrows(() => safeValidateAndCloneJson(a1), 'índice de array no canónico');

    const a2 = [10];
    a2['1.0'] = 20;
    assertThrows(() => safeValidateAndCloneJson(a2), 'índice de array no canónico');

    const a3 = [10];
    a3['-0'] = 20;
    assertThrows(() => safeValidateAndCloneJson(a3), 'índice de array no canónico');
  });

  // 6. Rechazo de arrays dispersos
  test('Rechaza arrays dispersos con huecos', () => {
    const arr = new Array(3);
    arr[0] = 1;
    arr[2] = 3;
    assertThrows(() => safeValidateAndCloneJson(arr), 'array disperso');
  });

  // 7. Rechazo de getters en arrays sin ejecutarlos
  test('Rechaza getters en índices de arrays sin ejecutarlos', () => {
    let getterExecuted = false;
    const arr = [];
    Object.defineProperty(arr, '0', {
      get() {
        getterExecuted = true;
        return 'malicioso';
      },
      enumerable: true,
      configurable: true
    });
    arr.length = 1;

    assertThrows(() => safeValidateAndCloneJson(arr), 'getter');
    assert(!getterExecuted, 'El getter no debió ser ejecutado');
  });

  // 8. Rechazo de getters en objetos sin ejecutarlos
  test('Rechaza getters en objetos sin ejecutarlos', () => {
    let getterExecuted = false;
    const obj = {};
    Object.defineProperty(obj, 'secreto', {
      get() {
        getterExecuted = true;
        return 'malicioso';
      },
      enumerable: true,
      configurable: true
    });

    assertThrows(() => safeValidateAndCloneJson(obj), 'getter/setter');
    assert(!getterExecuted, 'El getter no debió ser ejecutado');
  });

  // 9. Rechazo de propiedades no enumerables
  test('Rechaza propiedades no enumerables en objetos', () => {
    const obj = { visible: 1 };
    Object.defineProperty(obj, 'oculto', {
      value: 2,
      enumerable: false,
      configurable: true
    });

    assertThrows(() => safeValidateAndCloneJson(obj), 'no enumerable');
  });

  // 10. Rechazo de claves reservadas
  test('Rechaza claves reservadas (__proto__, constructor, prototype)', () => {
    const o1 = JSON.parse('{"__proto__": {"hacked": true}}');
    assertThrows(() => safeValidateAndCloneJson(o1), '__proto__');

    const o2 = { constructor: 'bad' };
    assertThrows(() => safeValidateAndCloneJson(o2), 'constructor');

    const o3 = { prototype: 'bad' };
    assertThrows(() => safeValidateAndCloneJson(o3), 'prototype');
  });

  // 11. Rechazo de prototipos no estándar (Date, Map, Set, clases)
  test('Rechaza clases no planas (Date, Map, Set)', () => {
    assertThrows(() => safeValidateAndCloneJson(new Date()), 'prototipo de objeto no permitido');
    assertThrows(() => safeValidateAndCloneJson(new Map()), 'prototipo de objeto no permitido');
    assertThrows(() => safeValidateAndCloneJson(new Set()), 'prototipo de objeto no permitido');
  });

  // 12. Detección de referencias circulares
  test('Detecta y rechaza referencias circulares reales', () => {
    const cyclic = {};
    cyclic.self = cyclic;
    assertThrows(() => safeValidateAndCloneJson(cyclic), 'referencia circular');
  });

  // 13. Admisión de estructuras de diamante (objetos compartidos no circulares)
  test('Admite objetos compartidos no circulares (grafo diamante)', () => {
    const shared = { valor: 42 };
    const root = { a: shared, b: shared };
    const cloned = safeValidateAndCloneJson(root);
    assert(cloned.a.valor === 42, 'Debe clonar subárbol a');
    assert(cloned.b.valor === 42, 'Debe clonar subárbol b');
  });

  // 14. Serialización canónica determinista
  test('Serializa de forma canónica ordenando claves alfabéticamente', () => {
    const o1 = { z: 1, a: 2, m: { y: 10, b: 20 } };
    const o2 = { a: 2, m: { b: 20, y: 10 }, z: 1 };
    const s1 = canonicalJsonSerialize(o1);
    const s2 = canonicalJsonSerialize(o2);
    assert(s1 === '{"a":2,"m":{"b":20,"y":10},"z":1}', `Serialización esperada pero fue: ${s1}`);
    assert(s1 === s2, 'Ambas serializaciones deben ser exactamente idénticas');
  });

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  return {
    module: 'Módulo 1: Contrato JSON',
    total: results.length,
    passed,
    failed,
    results
  };
}
