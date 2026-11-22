/**
 * arrayOrdering.js — Ordenamiento Topológico y Resolución de Precedencias
 *
 * Módulo 4 de Persistencia de Nutrimemi.
 *
 * Responsabilidades:
 * 1. Preservar el orden relativo base de elementos conservados.
 * 2. Preservar estrictamente el orden intra-rama de inserciones secuenciales consecutivas (X -> Y).
 * 3. Anclar nuevas inserciones a su predecesor y sucesor base supervivientes más cercanos.
 * 4. PROHIBIR aristas estáticas entre inserciones independientes de ramas distintas (resuelve O5).
 * 5. Diferenciar conflictos semánticos de reordenamiento de ciclos topológicos.
 * 6. BLOQUEAR la persistencia (isPersistenceAllowed: false) ante cualquier conflicto de orden.
 * 7. Desempate dinámico determinista en la cola de Kahn exclusivamente por puntos de código UTF-16.
 */

export const ORDERING_CONFLICTS = Object.freeze({
  REORDER_INCOMPATIBLE_CONFLICT: 'REORDER_INCOMPATIBLE_CONFLICT',
  REORDER_CYCLE_CONFLICT: 'REORDER_CYCLE_CONFLICT'
});

const codePointCompare = (a, b) => (a === b ? 0 : (a < b ? -1 : 1));

/**
 * Ordena deterministamente una colección de alimentos fusionados.
 * 
 * @param {Array} baseArr - Array proyectado con unifiedIds
 * @param {Array} serverArr - Array proyectado con unifiedIds
 * @param {Array} localArr - Array proyectado con unifiedIds
 * @param {Map} mergedItemsMap - Mapa de unifiedId -> alimento fusionado
 * @param {Array} conflicts - Array de conflictos acumulados
 * @param {string} [path='selectedFoods'] - Ruta para mensajes de error
 * @returns {{ orderedItems: Array, isPersistenceAllowed: boolean }}
 */
export function resolveArrayOrdering(baseArr, serverArr, localArr, mergedItemsMap, conflicts, path = 'selectedFoods') {
  const mergedIds = Array.from(mergedItemsMap.keys());

  if (mergedIds.length <= 1) {
    return {
      orderedItems: mergedIds.map(id => mergedItemsMap.get(id)),
      isPersistenceAllowed: conflicts.length === 0
    };
  }

  const adj = new Map();
  const inDegree = new Map();
  for (const id of mergedIds) {
    adj.set(id, new Set());
    inDegree.set(id, 0);
  }

  const addEdge = (u, v) => {
    if (u === v) return;
    if (adj.has(u) && adj.has(v) && !adj.get(u).has(v)) {
      adj.get(u).add(v);
      inDegree.set(v, inDegree.get(v) + 1);
    }
  };

  const baseSet = new Set(baseArr.map(f => f.instanceId));

  // 1. Preservación Estricta de Precedencias Intra-Rama (Inserciones secuenciales en una misma rama)
  // Si una rama insertó [A, X, Y, B], se genera la arista X -> Y de forma obligatoria
  const addIntraBranchEdges = (arr) => {
    for (let i = 0; i < arr.length - 1; i++) {
      const u = arr[i].instanceId;
      const v = arr[i + 1].instanceId;
      if (mergedItemsMap.has(u) && mergedItemsMap.has(v)) {
        if (!baseSet.has(u) || !baseSet.has(v)) {
          addEdge(u, v);
        }
      }
    }
  };

  addIntraBranchEdges(serverArr);
  addIntraBranchEdges(localArr);

  // 2. Anclajes Directos hacia Extremos Base Supervivientes Más Cercanos
  const anchorToSurvivingBase = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      const id = arr[i].instanceId;
      if (!baseSet.has(id) && mergedItemsMap.has(id)) {
        // Buscar predecesor base superviviente más próximo
        for (let p = i - 1; p >= 0; p--) {
          const predId = arr[p].instanceId;
          if (baseSet.has(predId) && mergedItemsMap.has(predId)) {
            addEdge(predId, id);
            break;
          }
        }
        // Buscar sucesor base superviviente más próximo
        for (let s = i + 1; s < arr.length; s++) {
          const succId = arr[s].instanceId;
          if (baseSet.has(succId) && mergedItemsMap.has(succId)) {
            addEdge(id, succId);
            break;
          }
        }
      }
    }
  };

  anchorToSurvivingBase(serverArr);
  anchorToSurvivingBase(localArr);

  // 3. Precedencias entre Elementos Base Conservados y Detección de Conflictos Semánticos
  let hasSemanticReorderConflict = false;

  const getPairs = (arr) => {
    const map = new Map();
    for (let i = 0; i < arr.length; i++) {
      const u = arr[i].instanceId;
      if (!map.has(u)) map.set(u, new Set());
      for (let j = i + 1; j < arr.length; j++) {
        map.get(u).add(arr[j].instanceId);
      }
    }
    return map;
  };

  const bPairs = getPairs(baseArr);
  const sPairs = getPairs(serverArr);
  const lPairs = getPairs(localArr);

  const hasPair = (m, u, v) => m.has(u) && m.get(u).has(v);

  for (let i = 0; i < mergedIds.length; i++) {
    for (let j = i + 1; j < mergedIds.length; j++) {
      const u = mergedIds[i];
      const v = mergedIds[j];

      // Solo evaluamos pares que existían en Base
      if (baseSet.has(u) && baseSet.has(v)) {
        const s_uV = hasPair(sPairs, u, v);
        const s_vU = hasPair(sPairs, v, u);
        const l_uV = hasPair(lPairs, u, v);
        const l_vU = hasPair(lPairs, v, u);
        const b_uV = hasPair(bPairs, u, v);
        const b_vU = hasPair(bPairs, v, u);

        const sChanged = (s_uV !== b_uV) || (s_vU !== b_vU);
        const lChanged = (l_uV !== b_uV) || (l_vU !== b_vU);

        // Conflicto Semántico: Servidor pide U->V y Local pide V->U
        if (sChanged && lChanged && ((s_uV && l_vU) || (s_vU && l_uV))) {
          hasSemanticReorderConflict = true;
          conflicts.push({
            path: `${path}.ordering`,
            type: ORDERING_CONFLICTS.REORDER_INCOMPATIBLE_CONFLICT,
            pair: [u, v],
            message: `Conflicto semántico de reordenamiento sobre los elementos [${u}, ${v}]. Persistencia bloqueada.`
          });
          // Para visualización provisional en UI se adopta la preferencia local
          if (l_uV) addEdge(u, v); else addEdge(v, u);
          continue;
        }

        // Reordenamiento unilateral Servidor
        if (sChanged && !lChanged) {
          if (s_uV) addEdge(u, v); else if (s_vU) addEdge(v, u);
          continue;
        }

        // Reordenamiento unilateral Local
        if (lChanged && !sChanged) {
          if (l_uV) addEdge(u, v); else if (l_vU) addEdge(v, u);
          continue;
        }

        // Acuerdo unánime respecto a Base
        if (b_uV) addEdge(u, v); else if (b_vU) addEdge(v, u);
      }
    }
  }

  // 4. Algoritmo de Kahn con Cola Prioritaria Determinista (Puntos de Código UTF-16)
  const queue = mergedIds.filter(id => inDegree.get(id) === 0).sort(codePointCompare);
  const sortedIds = [];

  while (queue.length > 0) {
    const curr = queue.shift();
    sortedIds.push(curr);

    for (const next of adj.get(curr)) {
      const deg = inDegree.get(next) - 1;
      inDegree.set(next, deg);
      if (deg === 0) {
        queue.push(next);
        queue.sort(codePointCompare);
      }
    }
  }

  const hasCycle = sortedIds.length !== mergedIds.length;
  if (hasCycle) {
    conflicts.push({
      path: `${path}.ordering`,
      type: ORDERING_CONFLICTS.REORDER_CYCLE_CONFLICT,
      message: 'Ciclo topológico circular irreconciliable detectado. Persistencia bloqueada.'
    });
  }

  // DISCRIMINACIÓN DE PERSISTENCIA:
  // Si existe ciclo O existe conflicto semántico, la persistencia queda TERMINANTEMENTE BLOQUEADA.
  const isPersistenceAllowed = !hasCycle && !hasSemanticReorderConflict && conflicts.length === 0;

  // Fallback visual exclusivamente para borrador en pantalla
  if (hasCycle) {
    const localMap = new Map(localArr.map((it, idx) => [it.instanceId, idx]));
    const fallbackSorted = [...mergedIds].sort((a, b) => {
      const idxA = localMap.has(a) ? localMap.get(a) : 9999;
      const idxB = localMap.has(b) ? localMap.get(b) : 9999;
      return idxA - idxB || codePointCompare(a, b);
    });
    return {
      orderedItems: fallbackSorted.map(id => mergedItemsMap.get(id)),
      isPersistenceAllowed: false
    };
  }

  return {
    orderedItems: sortedIds.map(id => mergedItemsMap.get(id)),
    isPersistenceAllowed
  };
}
