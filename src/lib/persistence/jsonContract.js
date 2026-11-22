/**
 * jsonContract.js — Contrato de Validación y Clonación Segura para JSONB
 *
 * Módulo 1 de Persistencia de Nutrimemi.
 *
 * FRONTERA DE CONFIANZA:
 * Este módulo opera sobre datos deserializados procedentes de fuentes controladas
 * (Supabase PostgREST, respuestas de API o estados de React en memoria).
 * Produce representaciones inmutables (Object.freeze) con prototipo nulo (Object.create(null))
 * o arrays densos seguros.
 * LIMITACIÓN FRENTE A PROXY:
 * En JavaScript estándar no existe un mecanismo universal que impida a un objeto Proxy
 * ejecutar sus trampas (traps) durante la introspección reflexiva (Reflect.ownKeys,
 * Object.getOwnPropertyDescriptor). Si se introduce un Proxy hostil, sus trampas se
 * ejecutarán. La defensa implementada consiste en comprobar rigurosamente descriptores,
 * rechazar getters/setters, prohibir claves no canónicas y aislar el resultado en una
 * copia congelada independiente de las referencias originales.
 */

export const MISSING = Symbol('NUTRIMEMI_MISSING');

/**
 * Valida recursivamente y clona profundamente un valor asegurando estricta compatibilidad JSON.
 * 
 * Rechaza:
 * - undefined, funciones, símbolos, BigInt
 * - NaN, Infinity, -Infinity
 * - Getters y setters (sin invocarlos)
 * - Propiedades no enumerables
 * - Arrays dispersos (huecos o índices faltantes)
 * - Índices de array no canónicos ("01", "1.0", "-0", etc.)
 * - Referencias circulares
 * - Prototipos no estándar (solo se admiten Object.prototype y null)
 * - Claves reservadas de polución (__proto__, constructor, prototype)
 * - El centinela MISSING en datos de entrada
 *
 * @param {any} rootValue - Valor a validar y clonar
 * @param {string} [rootPath=''] - Ruta de contexto para mensajes de error
 * @returns {any} Copia inmutable congelada y purificada
 * @throws {TypeError} Si se viola cualquier regla del contrato JSON
 */
export function safeValidateAndCloneJson(rootValue, rootPath = '') {
  const ancestorStack = new Set();

  function walk(value, path) {
    if (value === MISSING) {
      throw new TypeError(`Contrato JSON violado: centinela MISSING no permitido en datos de entrada en "${path}".`);
    }
    if (value === null) return null;

    const t = typeof value;
    if (t === 'undefined') {
      throw new TypeError(`Contrato JSON violado: valor undefined prohibido en "${path}".`);
    }
    if (t === 'function' || t === 'symbol' || t === 'bigint') {
      throw new TypeError(`Contrato JSON violado: tipo no serializable "${t}" en "${path}".`);
    }
    if (t === 'number') {
      if (!Number.isFinite(value)) {
        throw new TypeError(`Contrato JSON violado: número no finito (${value}) en "${path}".`);
      }
      return value;
    }
    if (t === 'string' || t === 'boolean') {
      return value;
    }

    if (t === 'object') {
      if (ancestorStack.has(value)) {
        throw new TypeError(`Contrato JSON violado: referencia circular detectada en "${path}".`);
      }
      ancestorStack.add(value);

      try {
        if (Array.isArray(value)) {
          // 1. Validar descriptor de 'length'
          const lenDesc = Object.getOwnPropertyDescriptor(value, 'length');
          if (
            !lenDesc ||
            typeof lenDesc.value !== 'number' ||
            !Number.isInteger(lenDesc.value) ||
            lenDesc.value < 0
          ) {
            throw new TypeError(`Contrato JSON violado: descriptor 'length' inválido en array en "${path}".`);
          }
          if (lenDesc.enumerable) {
            throw new TypeError(`Contrato JSON violado: propiedad 'length' enumerable prohibida en array en "${path}".`);
          }

          const len = lenDesc.value;
          const keys = Reflect.ownKeys(value);

          // 2. Validar que cada clave propia sea exactamente un índice entero canónico
          for (const key of keys) {
            if (key === 'length') continue;
            if (typeof key === 'symbol') {
              throw new TypeError(`Contrato JSON violado: clave Symbol prohibida en array en "${path}".`);
            }

            const strKey = String(key);
            const numKey = Number(strKey);
            if (
              !Number.isInteger(numKey) ||
              numKey < 0 ||
              numKey >= len ||
              String(numKey) !== strKey
            ) {
              throw new TypeError(`Contrato JSON violado: índice de array no canónico o propiedad extra ("${strKey}") en "${path}".`);
            }

            const desc = Object.getOwnPropertyDescriptor(value, strKey);
            if (!desc || !('value' in desc) || !desc.enumerable) {
              throw new TypeError(`Contrato JSON violado: elemento no enumerable o getter en índice [${strKey}] de "${path}".`);
            }
          }

          // 3. Clonar array denso comprobando que no haya huecos
          const outArr = new Array(len);
          for (let i = 0; i < len; i++) {
            const desc = Object.getOwnPropertyDescriptor(value, String(i));
            if (!desc || desc.value === undefined) {
              throw new TypeError(`Contrato JSON violado: array disperso (hueco en índice [${i}]) en "${path}".`);
            }
            outArr[i] = walk(desc.value, `${path}[${i}]`);
          }
          return Object.freeze(outArr);
        }

        // 4. Validar prototipo de objeto plano
        const proto = Object.getPrototypeOf(value);
        if (proto !== Object.prototype && proto !== null) {
          throw new TypeError(`Contrato JSON violado: prototipo de objeto no permitido en "${path}".`);
        }

        const keys = Reflect.ownKeys(value);
        // Construcción directa sobre Object.create(null)
        const outObj = Object.create(null);

        for (const key of keys) {
          if (typeof key === 'symbol') {
            throw new TypeError(`Contrato JSON violado: clave Symbol prohibida en "${path}".`);
          }
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            throw new TypeError(`Contrato JSON violado: clave reservada prohibida "${key}" en "${path}".`);
          }

          const desc = Object.getOwnPropertyDescriptor(value, key);
          if (!desc || !('value' in desc)) {
            throw new TypeError(`Contrato JSON violado: getter/setter prohibido en propiedad "${key}" de "${path}".`);
          }
          if (!desc.enumerable) {
            throw new TypeError(`Contrato JSON violado: propiedad no enumerable "${key}" prohibida en "${path}".`);
          }

          outObj[key] = walk(desc.value, path ? `${path}.${key}` : key);
        }

        return Object.freeze(outObj);
      } finally {
        ancestorStack.delete(value);
      }
    }

    throw new TypeError(`Contrato JSON violado: tipo no admitido en "${path}".`);
  }

  return walk(rootValue, rootPath);
}

/**
 * Serializa de forma determinista y canónica cualquier estructura previamente validada.
 * Ordena las claves alfabéticamente por puntos de código UTF-16.
 *
 * @param {any} value - Estructura validada
 * @returns {string} Cadena JSON canónica
 */
export function canonicalJsonSerialize(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'number') return String(value);
  if (t === 'string') return JSON.stringify(value);
  if (t === 'boolean') return value ? 'true' : 'false';

  if (Array.isArray(value)) {
    const items = value.map(canonicalJsonSerialize);
    return `[${items.join(',')}]`;
  }

  if (t === 'object') {
    const keys = Object.keys(value).sort((a, b) => (a === b ? 0 : a < b ? -1 : 1));
    const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalJsonSerialize(value[k])}`);
    return `{${entries.join(',')}}`;
  }

  throw new TypeError(`Tipo "${t}" no serializable en contrato JSON.`);
}
