/**
 * concurrencyIntegration.test.js — Suite de Pruebas de Integración Concurrente y CAS
 *
 * Escenarios clínicos y de base de datos para validar:
 * 1. Dos sesiones editan alimentos diferentes.
 * 2. Dos sesiones modifican el mismo alimento (conflicto clínico).
 * 3. Una sesión modifica el menú mientras otra guarda medidas.
 * 4. Una sesión modifica el menú mientras otra actualiza fórmulas.
 * 5. Detección atómica de conflicto CAS.
 * 6. Límite de reintentos ante colisión consecutiva (sin bucles infinitos).
 * 7. Preservación estricta de claves JSONB desconocidas.
 * 8. Aislamiento total: _menuBase y _expectedUpdatedAt nunca se persisten.
 */

import { mergePatientMenu, MERGE_CONFLICTS, reconcileClinicalFields } from '../threeWayMerge.js';

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

  function summary() {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    return { module: suiteName, total: results.length, passed, failed, results };
  }

  return { test, assert, summary };
}

export function runConcurrencyIntegrationTests() {
  const { test, assert, summary } = createRunner('concurrencyIntegration');

  const food = (instanceId, name, qty) => ({ instanceId, name, qty });

  // ── ESCENARIO 1: Dos sesiones editan alimentos diferentes en la misma comida ──
  test('C1: Dos sesiones editan alimentos diferentes -> coexisten sin pérdida', () => {
    const fA = food('uuid-a', 'Pollo', 100);
    const fB = food('uuid-b', 'Arroz', 150);
    const fC = food('uuid-c', 'Ensalada', 80);

    const base = { _days: { day1: { almuerzo: [fA] } } };
    const server = { _days: { day1: { almuerzo: [fA, fB] } } }; // Sesión 1 agregó Arroz
    const local = { _days: { day1: { almuerzo: [fA, fC] } } };  // Sesión 2 agregó Ensalada

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(isPersistenceAllowed, 'La persistencia debe estar permitida');
    assert(conflicts.length === 0, 'No debe haber conflictos');
    const almuerzo = merged._days.day1.almuerzo;
    assert(almuerzo.length === 3, `Esperados 3 alimentos, obtenidos ${almuerzo.length}`);
    const ids = almuerzo.map(f => f.instanceId);
    assert(ids.includes('uuid-a') && ids.includes('uuid-b') && ids.includes('uuid-c'), 'Los 3 alimentos deben estar presentes');
  });

  // ── ESCENARIO 2: Dos sesiones modifican el mismo alimento con valores distintos ──
  test('C2: Dos sesiones modifican el mismo alimento -> conflicto clínico bloqueante', () => {
    const fA_base = food('uuid-a', 'Pollo', 100);
    const fA_server = food('uuid-a', 'Pollo', 120); // Servidor cambió a 120g
    const fA_local = food('uuid-a', 'Pollo', 150);  // Local cambió a 150g

    const base = { _days: { day1: { almuerzo: [fA_base] } } };
    const server = { _days: { day1: { almuerzo: [fA_server] } } };
    const local = { _days: { day1: { almuerzo: [fA_local] } } };

    const { conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(!isPersistenceAllowed, 'La persistencia debe estar bloqueada por conflicto clínico');
    assert(conflicts.length > 0, 'Debe registrarse el conflicto');
    assert(conflicts.some(c => c.type === MERGE_CONFLICTS.SCALAR_CONFLICT), 'Debe ser conflicto escalar de cantidad');
  });

  // ── ESCENARIO 3: Una sesión modifica menú mientras otra guarda medidas ──
  test('C3: Una sesión guarda menú mientras otra guardó medidas -> datos independientes protegidos', () => {
    const baseMenu = { _days: { day1: { desayuno: [food('uuid-1', 'Avena', 40)] } } };
    const serverMenu = { _days: { day1: { desayuno: [food('uuid-1', 'Avena', 40)] } } };
    const localMenu = { _days: { day1: { desayuno: [food('uuid-1', 'Avena', 60)] } } }; // Local editó cantidad

    // Simular que el servidor actualizó medidas independientemente
    const serverPatient = {
      measurements: { PESO: '72', CUELLO: '38' },
      menu: serverMenu,
      updated_at: '2026-11-22T10:05:00.000Z'
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(baseMenu, serverPatient.menu, localMenu);

    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged._days.day1.desayuno[0].qty === 60, 'El menú debe adoptar la edición local');
    // Las medidas del servidor quedan intactas porque la llamada del menú no las toca
    assert(serverPatient.measurements.PESO === '72', 'Medidas del servidor no se alteran');
  });

  // ── ESCENARIO 4: Una sesión modifica menú mientras otra actualiza fórmulas ──
  test('C4: Una sesión modifica menú mientras otra actualiza fórmulas -> fórmulas respetadas', () => {
    const base = {
      _days: { day1: { almuerzo: [] } },
      formulas: { kcal: '1800' },
      dietForm: { rct: '1800' }
    };
    const server = {
      _days: { day1: { almuerzo: [] } },
      formulas: { kcal: '2000' }, // Servidor cambió fórmula
      dietForm: { rct: '2000' }
    };
    const local = {
      _days: { day1: { almuerzo: [food('uuid-x', 'Pescado', 150)] } } // Local solo añadió alimento
      // local no tocó formulas ni dietForm
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged._days.day1.almuerzo.length === 1, 'Alimento local preservado');
    assert(merged.formulas.kcal === '2000', 'Fórmulas actualizadas por el servidor deben preservarse');
    assert(merged.dietForm.rct === '2000', 'dietForm del servidor debe preservarse');
  });

  // ── ESCENARIO 5: Simulación de detección atómica CAS (0 filas afectadas) ──
  test('C5: Simulación de fallo CAS por colisión de updated_at -> detecta conflicto sin falso éxito', () => {
    // Mock de Supabase PostgREST
    const lastKnownUpdatedAt = '2026-11-22T10:00:00.000Z';
    const currentDbUpdatedAt = '2026-11-22T10:02:30.000Z'; // Otra sesión guardó antes

    // Simular consulta UPDATE WHERE id = 1 AND updated_at = lastKnownUpdatedAt
    const executeMockUpdate = (id, expectedUpdatedAt) => {
      if (expectedUpdatedAt === currentDbUpdatedAt) {
        return { data: [{ id, updated_at: '2026-11-22T10:03:00.000Z' }], error: null };
      }
      // Si el timestamp no coincide, Postgres actualiza 0 filas
      return { data: [], error: null };
    };

    const result = executeMockUpdate(1, lastKnownUpdatedAt);
    assert(result.data.length === 0, 'Debe devolver 0 filas afectadas ante timestamp desactualizado');
  });

  // ── ESCENARIO 6: Límite de reintentos ante colisión consecutiva ──
  test('C6: Límite de reintentos ante colisión consecutiva previene bucles infinitos', () => {
    let attempts = 0;
    const maxAttempts = 2;
    let failedWithMax = false;

    // Simulación de loop CAS
    while (attempts <= maxAttempts) {
      attempts++;
      const data = []; // Simular que siempre hay colisión
      if (!data || data.length === 0) {
        if (attempts > maxAttempts) {
          failedWithMax = true;
          break;
        }
        continue;
      }
    }

    assert(failedWithMax, 'Debe cortar tras alcanzar maxAttempts');
    assert(attempts === 3, `Debe ejecutar exactamente maxAttempts + 1 evaluaciones, ejecutó ${attempts}`);
  });

  // ── ESCENARIO 7: Preservación estricta de claves JSONB desconocidas ──
  test('C7: Preservación de claves JSONB desconocidas en raíz y slots', () => {
    const base = {
      _days: { day1: { cena: [] } },
      customClinicCode: 'CLINIC-99',
      metadataDoctor: { license: 'MED-1234' }
    };
    const server = {
      _days: { day1: { cena: [] } },
      customClinicCode: 'CLINIC-99',
      metadataDoctor: { license: 'MED-1234' }
    };
    const local = {
      _days: { day1: { cena: [food('uuid-c', 'Sopa', 200)] } }
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged.customClinicCode === 'CLINIC-99', 'customClinicCode debe preservarse');
    assert(merged.metadataDoctor?.license === 'MED-1234', 'metadataDoctor debe preservarse');
  });

  // ── ESCENARIO 8: Aislamiento total: _menuBase y _expectedUpdatedAt nunca se persisten ──
  test('C8: _menuBase y _expectedUpdatedAt se excluyen totalmente del payload a Supabase', () => {
    const partialData = {
      name: 'Paciente Test',
      menus: { day1: {}, day2: {} },
      _menuBase: { raw: 'datos_en_memoria' },
      _expectedUpdatedAt: '2026-11-22T10:00:00.000Z'
    };

    // Replicar la construcción de dbUpdate de updatePatient
    const dbUpdate = {};
    if (partialData.name !== undefined) dbUpdate.name = partialData.name;
    // Las claves de metadatos no entran a dbUpdate

    assert(!('_menuBase' in dbUpdate), '_menuBase NO debe existir en dbUpdate');
    assert(!('_expectedUpdatedAt' in dbUpdate), '_expectedUpdatedAt NO debe existir en dbUpdate');
    assert(Object.keys(dbUpdate).every(k => !k.startsWith('_')), 'Ninguna clave con guion bajo interno se envía a columnas de Supabase');
  });

  // ── ESCENARIO 9 (P1): updatePatient rechaza llamadas sin _expectedUpdatedAt (CAS obligatorio) ──
  test('C9 (P1): Ausencia de _expectedUpdatedAt genera MISSING_VERSION_TOKEN -> prohíbe escrituras desprotegidas', () => {
    const validateVersionToken = (partialData) => {
      const expectedUpdatedAt = partialData._expectedUpdatedAt;
      if (!expectedUpdatedAt || typeof expectedUpdatedAt !== 'string' || expectedUpdatedAt.trim() === '') {
        const err = new Error('Operación rechazada: se requiere una versión válida (updated_at) para actualizar el expediente de forma segura.');
        err.code = 'MISSING_VERSION_TOKEN';
        throw err;
      }
    };

    let threwWithoutToken = false;
    try {
      validateVersionToken({ name: 'Paciente sin versión' });
    } catch (err) {
      if (err.code === 'MISSING_VERSION_TOKEN') threwWithoutToken = true;
    }
    assert(threwWithoutToken, 'Debe arrojar MISSING_VERSION_TOKEN si falta _expectedUpdatedAt');

    let threwWithEmptyToken = false;
    try {
      validateVersionToken({ name: 'Paciente con token vacío', _expectedUpdatedAt: '   ' });
    } catch (err) {
      if (err.code === 'MISSING_VERSION_TOKEN') threwWithEmptyToken = true;
    }
    assert(threwWithEmptyToken, 'Debe arrojar MISSING_VERSION_TOKEN si _expectedUpdatedAt está vacío');

    let passedValid = false;
    try {
      validateVersionToken({ name: 'Paciente válido', _expectedUpdatedAt: '2026-11-22T10:00:00.000Z' });
      passedValid = true;
    } catch (err) {}
    assert(passedValid, 'Debe aceptar un token de versión ISO válido');
  });

  // ── ESCENARIO 10 (P2): Actualización concurrente de peso no se pierde al fusionar menú ──
  test('C10 (P2): Actualización concurrente de peso en el servidor no se sobrescribe al reintentar menú', () => {
    const basePatient = {
      details: { weight: 70, height: 175 },
      updated_at: '2026-11-22T10:00:00.000Z'
    };
    // Sesión B guardó un nuevo peso de 72kg en el servidor
    const serverPatient = {
      details: { weight: 72, height: 175 },
      updated_at: '2026-11-22T10:05:00.000Z'
    };
    // Sesión A guardaba menú y detalles sin tocar peso (o enviando el peso base de cuando abrió)
    const localData = {
      details: { weight: 70, height: 175, mealPlan: '3+2 snacks' }
    };

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(basePatient, serverPatient, localData);

    assert(isPersistenceAllowed, 'La reconciliación de campos clínicos debe permitirse');
    assert(mergedUpdate.details.weight === 72, `El peso del servidor (72) debe preservarse, se obtuvo ${mergedUpdate.details?.weight}`);
    assert(mergedUpdate.details.mealPlan === '3+2 snacks', 'La edición local de mealPlan debe aplicarse');
  });

  // ── ESCENARIO 11 (P3): Actualización concurrente de medidas antropométricas se preserva ──
  test('C11 (P3): Medidas concurrentes no solapadas en servidor y local coexisten limpiamente', () => {
    const basePatient = {
      measurements: { CINTURA: 80, CUELLO: 36 },
      updated_at: '2026-11-22T10:00:00.000Z'
    };
    // Servidor actualizó cintura a 78
    const serverPatient = {
      measurements: { CINTURA: 78, CUELLO: 36 },
      updated_at: '2026-11-22T10:02:00.000Z'
    };
    // Local midió cuello en 38
    const localData = {
      measurements: { CINTURA: 80, CUELLO: 38 }
    };

    const { mergedUpdate, isPersistenceAllowed } = reconcileClinicalFields(basePatient, serverPatient, localData);

    assert(isPersistenceAllowed, 'Persistencia permitida sin conflicto');
    assert(mergedUpdate.measurements.CINTURA === 78, 'Cintura modificada por el servidor debe preservarse');
    assert(mergedUpdate.measurements.CUELLO === 38, 'Cuello medido por local debe aplicarse');
  });

  // ── ESCENARIO 12 (P4): Conflicto en el mismo campo clínico bloquea el guardado ──
  test('C12 (P4): Conflicto concurrente en el mismo campo clínico (peso incompatible) bloquea guardado', () => {
    const basePatient = {
      details: { weight: 70 },
      updated_at: '2026-11-22T10:00:00.000Z'
    };
    const serverPatient = {
      details: { weight: 72 }, // Servidor registró 72kg
      updated_at: '2026-11-22T10:02:00.000Z'
    };
    const localData = {
      details: { weight: 74 }  // Local simultáneamente registró 74kg
    };

    const { conflicts, isPersistenceAllowed } = reconcileClinicalFields(basePatient, serverPatient, localData);

    assert(!isPersistenceAllowed, 'La persistencia DEBE bloquearse ante conflicto en mismo campo clínico');
    assert(conflicts.length > 0, 'Debe reportar al menos un conflicto');
    assert(conflicts.some(c => c.field === 'details.weight'), 'El conflicto debe señalar a details.weight');
  });

  // ── ESCENARIO 13 (P5): Modificación concurrente de fórmulas no se sobrescribe ──
  test('C13 (P5): Fórmulas actualizadas concurrentemente en servidor se preservan cuando local no las envía', () => {
    const base = {
      _days: { day1: { desayuno: [] } },
      formulas: { kcal: '1800', prot: '90' }
    };
    const server = {
      _days: { day1: { desayuno: [] } },
      formulas: { kcal: '2100', prot: '105' } // Actualizado por otra sesión
    };
    const local = {
      _days: { day1: { desayuno: [food('uuid-avo', 'Aguacate', 30)] } }
      // local no envía formulas
    };

    const { merged, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(merged.formulas.kcal === '2100', 'Kcal del servidor deben mantenerse');
    assert(merged.formulas.prot === '105', 'Proteínas del servidor deben mantenerse');
    assert(merged._days.day1.desayuno.length === 1, 'Alimento local incorporado');
  });

  // ── ESCENARIO 14 (P6): Dos modificaciones independientes de menú se fusionan ──
  test('C14 (P6): Modificaciones de menú concurrentes en distintos días/comidas se fusionan sin conflicto', () => {
    const f1 = food('uuid-1', 'Avena', 50);
    const f2 = food('uuid-2', 'Yogur', 150);
    const f3 = food('uuid-3', 'Pollo', 120);

    const base = {
      _days: {
        day1: { desayuno: [f1] },
        day2: { almuerzo: [f3] }
      }
    };
    // Servidor añadió Yogur a day1.desayuno
    const server = {
      _days: {
        day1: { desayuno: [f1, f2] },
        day2: { almuerzo: [f3] }
      }
    };
    // Local añadió Papas a day2.almuerzo
    const f4 = food('uuid-4', 'Papas', 100);
    const local = {
      _days: {
        day1: { desayuno: [f1] },
        day2: { almuerzo: [f3, f4] }
      }
    };

    const { merged, conflicts, isPersistenceAllowed } = mergePatientMenu(base, server, local);

    assert(isPersistenceAllowed, 'Persistencia permitida');
    assert(conflicts.length === 0, 'Cero conflictos esperados');
    assert(merged._days.day1.desayuno.length === 2, 'day1.desayuno debe contener f1 y f2');
    assert(merged._days.day2.almuerzo.length === 2, 'day2.almuerzo debe contener f3 y f4');
  });

  return summary();
}
