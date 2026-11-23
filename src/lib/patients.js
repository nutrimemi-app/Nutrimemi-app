import { supabase } from './supabaseClient';
import { mergePatientMenu, reconcileClinicalFields } from './persistence/threeWayMerge';

const calculateAge = (dateString) => {
  if (!dateString) return '';
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

/**
 * Mapea el registro de la DB al objeto anidado que usa la UI
 */
const mapDbToUI = (dbPatient) => {
  if (!dbPatient) return null;

  const rawMenu = dbPatient.menu || {};

  // --- Fase 1: Extracción segura de días del menú ---
  // Si existe la clave estructurada _days, la usamos directamente.
  // Si no existe (expedientes históricos), construimos day1 desde la raíz del menú.
  const daysData = rawMenu._days || null;
  let menus;
  if (daysData) {
    // Expediente nuevo: tiene estructura _days con day1 y day2
    menus = {
      day1: daysData.day1 || {},
      day2: daysData.day2 || {}
    };
  } else {
    // Expediente histórico: la raíz del menu ES el Día 1
    // Extraemos solo las claves de comidas (excluimos dietForm, formulas, _days)
    const RESERVED_KEYS = new Set(['dietForm', 'formulas', '_days']);
    const day1FromRoot = Object.fromEntries(
      Object.entries(rawMenu).filter(([k]) => !RESERVED_KEYS.has(k))
    );
    menus = {
      day1: day1FromRoot,
      day2: {}
    };
  }

  return {
    id: dbPatient.id,
    updated_at: dbPatient.updated_at || null,
    name: dbPatient.name,
    goal: dbPatient.goal || 'Nuevo Paciente',
    status: dbPatient.status || 'Activo',
    lastSeen: dbPatient.updated_at ? new Date(dbPatient.updated_at).toLocaleDateString() : 'Hoy',
    details: {
      name: dbPatient.name,
      email: dbPatient.email,
      ci: dbPatient.ci,
      phone: dbPatient.phone,
      birthDate: dbPatient.birth_date,
      gender: dbPatient.gender,
      height: dbPatient.height,
      weight: dbPatient.weight,
      clinicalHistory: dbPatient.clinical_history,
      medications: dbPatient.medications,
      notas: dbPatient.notes,
      isPediatric: dbPatient.is_pediatric,
      tutorName: dbPatient.tutor_name,
      tutorPhone: dbPatient.tutor_phone,
      mealPlan: dbPatient.meal_plan,
      tags: dbPatient.tags || [],
      age: dbPatient.birth_date ? calculateAge(dbPatient.birth_date) : ''
    },
    history: [], // Se llenará si se consulta por ID
    reports: [],
    measurements: dbPatient.measurements || {},
    menu: rawMenu,          // Raíz JSONB completa (compatibilidad con código heredado)
    menus: menus,           // Estructura normalizada { day1, day2 }
    dietForm: rawMenu.dietForm || {},
    formulas: rawMenu.formulas || {},
    onboardingAnswers: dbPatient.onboarding_answers || {}
  };
};

export const getPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
  return data.map(mapDbToUI);
};

export const getPatientById = async (id) => {
  const [
    { data: patient, error: patientError },
    { data: history },
    { data: reports }
  ] = await Promise.all([
    supabase.from('patients').select('*').eq('id', id).single(),
    supabase.from('patient_history_entries').select('entry').eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('patient_reports').select('snapshot').eq('patient_id', id).order('created_at', { ascending: false })
  ]);

  if (patientError || !patient) {
    console.error('Error fetching patient:', patientError);
    return null;
  }

  const mapped = mapDbToUI(patient);
  if (history) {
    mapped.history = history.map(h => h.entry);
  } else {
    // Fallback if supabase table is missing
    try {
      if (typeof window !== 'undefined') {
        const localHist = JSON.parse(window.localStorage.getItem(`patient_history_${id}`) || '[]');
        if (localHist.length > 0) mapped.history = localHist;
      }
    } catch(e) {}
  }
  
  if (reports) {
    mapped.reports = reports.map(r => r.snapshot);
  } else {
    try {
      if (typeof window !== 'undefined') {
        const localRep = JSON.parse(window.localStorage.getItem(`patient_reports_${id}`) || '[]');
        if (localRep.length > 0) mapped.reports = localRep;
      }
    } catch(e) {}
  }

  return mapped;
};

export const getPatientByEmail = async (email) => {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('email', email)
    .single();

  if (patientError || !patient) {
    console.error('Error fetching patient by email:', patientError);
    return null;
  }

  const [
    { data: history },
    { data: reports }
  ] = await Promise.all([
    supabase.from('patient_history_entries').select('entry').eq('patient_id', patient.id).order('created_at', { ascending: false }),
    supabase.from('patient_reports').select('snapshot').eq('patient_id', patient.id).order('created_at', { ascending: false })
  ]);

  const mapped = mapDbToUI(patient);
  if (history) mapped.history = history.map(h => h.entry);
  if (reports) mapped.reports = reports.map(r => r.snapshot);

  return mapped;
};

export const createPatient = async (formData) => {
  const newPatient = {
    name: formData.name,
    email: formData.email || null,
    ci: formData.ci,
    phone: formData.phone,
    birth_date: formData.birthDate || null,
    gender: formData.gender || 'female',
    height: formData.height ? parseFloat(formData.height) : null,
    weight: formData.weight ? parseFloat(formData.weight) : null,
    clinical_history: formData.clinicalHistory || '',
    medications: formData.medications || '',
    notes: formData.notas || '',
    is_pediatric: formData.isPediatric || false,
    tutor_name: formData.tutorName || '',
    tutor_phone: formData.tutorPhone || '',
    meal_plan: formData.mealPlan || '3+2 snacks',
    tags: formData.tags || [],
    goal: 'Nuevo Paciente',
    status: 'Activo',
    password: formData.password || null
  };

  const { data, error } = await supabase
    .from('patients')
    .insert([newPatient])
    .select()
    .single();

  if (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
  return mapDbToUI(data);
};

export const updatePatient = async (id, partialData) => {
  const dbUpdate = {};
  
  if (partialData.name !== undefined) dbUpdate.name = partialData.name;
  if (partialData.goal !== undefined) dbUpdate.goal = partialData.goal;
  if (partialData.status !== undefined) dbUpdate.status = partialData.status;
  // Campos de primer nivel para activación de cuenta del paciente
  if (partialData.email !== undefined) dbUpdate.email = partialData.email;
  if (partialData.password !== undefined) dbUpdate.password = partialData.password;
  
  if (partialData.details) {
    if (partialData.details.name !== undefined) dbUpdate.name = partialData.details.name;
    if (partialData.details.email !== undefined) dbUpdate.email = partialData.details.email;
    if (partialData.details.ci !== undefined) dbUpdate.ci = partialData.details.ci;
    if (partialData.details.phone !== undefined) dbUpdate.phone = partialData.details.phone;
    if (partialData.details.birthDate !== undefined) dbUpdate.birth_date = partialData.details.birthDate;
    if (partialData.details.gender !== undefined) dbUpdate.gender = partialData.details.gender;
    if (partialData.details.height !== undefined) dbUpdate.height = partialData.details.height ? parseFloat(partialData.details.height) : null;
    if (partialData.details.weight !== undefined) dbUpdate.weight = partialData.details.weight ? parseFloat(partialData.details.weight) : null;
    if (partialData.details.clinicalHistory !== undefined) dbUpdate.clinical_history = partialData.details.clinicalHistory;
    if (partialData.details.medications !== undefined) dbUpdate.medications = partialData.details.medications;
    if (partialData.details.notas !== undefined) dbUpdate.notes = partialData.details.notas;
    if (partialData.details.isPediatric !== undefined) dbUpdate.is_pediatric = partialData.details.isPediatric;
    if (partialData.details.tutorName !== undefined) dbUpdate.tutor_name = partialData.details.tutorName;
    if (partialData.details.tutorPhone !== undefined) dbUpdate.tutor_phone = partialData.details.tutorPhone;
    if (partialData.details.mealPlan !== undefined) dbUpdate.meal_plan = partialData.details.mealPlan;
    if (partialData.details.tags !== undefined) dbUpdate.tags = partialData.details.tags;
  }

  if (partialData.measurements !== undefined) dbUpdate.measurements = partialData.measurements;
  if (partialData.onboardingAnswers !== undefined) dbUpdate.onboarding_answers = partialData.onboardingAnswers;

  const RESERVED_KEYS = new Set(['dietForm', 'formulas', '_days']);

  // Construcción del menú si viene en partialData
  const hasMenuUpdate = (
    partialData.menu !== undefined ||
    partialData.menus !== undefined ||
    partialData.dietForm !== undefined ||
    partialData.formulas !== undefined
  );

  if (hasMenuUpdate) {
    let existingMenu = {};
    if (partialData.menu === undefined && partialData.menus === undefined) {
      const { data: currentPatient } = await supabase
        .from('patients')
        .select('menu')
        .eq('id', id)
        .single();
      existingMenu = currentPatient?.menu || {};
    }

    const existingDays = existingMenu._days || null;
    const existingDay1 = existingDays?.day1 ?? existingMenu;
    const existingDay2 = existingDays?.day2 ?? {};

    const day1Data = partialData.menus?.day1
      ?? partialData.menu
      ?? existingDay1
      ?? {};
    const day2Data = partialData.menus?.day2
      ?? existingDay2
      ?? {};

    const day1RootEntries = Object.fromEntries(
      Object.entries(day1Data).filter(([k]) => !RESERVED_KEYS.has(k))
    );

    const newDietForm = partialData.dietForm !== undefined
      ? partialData.dietForm
      : (partialData.menu?.dietForm ?? existingMenu.dietForm);
    const newFormulas = partialData.formulas !== undefined
      ? partialData.formulas
      : (partialData.menu?.formulas ?? existingMenu.formulas);

    // Preservar claves desconocidas en la raíz del menú existente
    const unknownRootKeys = {};
    for (const k of Object.keys(existingMenu)) {
      if (!RESERVED_KEYS.has(k) && !(k in day1RootEntries)) {
        unknownRootKeys[k] = existingMenu[k];
      }
    }

    dbUpdate.menu = {
      ...unknownRootKeys,
      ...day1RootEntries,
      _days: {
        day1: day1Data,
        day2: day2Data
      },
      ...(newDietForm !== undefined ? { dietForm: newDietForm } : {}),
      ...(newFormulas !== undefined ? { formulas: newFormulas } : {})
    };
  }

  // Metadatos de OCC (NUNCA se insertan en Supabase; se usan solo para control en memoria)
  const expectedUpdatedAt = partialData._expectedUpdatedAt;
  if (!expectedUpdatedAt || typeof expectedUpdatedAt !== 'string' || expectedUpdatedAt.trim() === '') {
    const err = new Error('Operación rechazada: se requiere una versión válida (updated_at) para actualizar el expediente de forma segura.');
    err.code = 'MISSING_VERSION_TOKEN';
    throw err;
  }

  let currentExpectedUpdatedAt = expectedUpdatedAt;
  let currentMenuBase = partialData._menuBase || null;
  const patientBase = partialData._patientBase || {};

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts <= maxAttempts) {
    attempts++;
    dbUpdate.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('patients')
      .update(dbUpdate)
      .eq('id', id)
      .eq('updated_at', currentExpectedUpdatedAt)
      .select();

    if (error) {
      console.error('Error updating patient:', error);
      throw error;
    }

    // Colisión CAS detectada: 0 filas actualizadas porque updated_at cambió concurrentemente
    if (!data || data.length === 0) {
      const { data: serverPatient, error: fetchErr } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !serverPatient) {
        throw new Error('No se pudo obtener el estado actual del paciente para la reconciliación concurrente.');
      }

      // CORRECCIÓN 2: Reconciliación tripartita de campos clínicos (details, measurements, name, etc.)
      // Evita que un reintento sobrescriba cambios concurrentes de peso, medidas o datos
      const {
        mergedUpdate: reconciledClinical,
        conflicts: clinicalConflicts,
        isPersistenceAllowed: clinicalAllowed
      } = reconcileClinicalFields(patientBase, serverPatient, partialData);

      if (!clinicalAllowed) {
        const conflictErr = new Error('Conflicto clínico concurrente en datos del paciente. Persistencia bloqueada.');
        conflictErr.code = 'CLINICAL_FIELD_CONFLICT';
        conflictErr.conflicts = clinicalConflicts;
        throw conflictErr;
      }

      // Aplicar campos clínicos reconciliados a dbUpdate
      if (reconciledClinical.name !== undefined) dbUpdate.name = reconciledClinical.name;
      if (reconciledClinical.goal !== undefined) dbUpdate.goal = reconciledClinical.goal;
      if (reconciledClinical.status !== undefined) dbUpdate.status = reconciledClinical.status;
      if (reconciledClinical.details) {
        const d = reconciledClinical.details;
        if (d.name !== undefined) dbUpdate.name = d.name;
        if (d.email !== undefined) dbUpdate.email = d.email;
        if (d.ci !== undefined) dbUpdate.ci = d.ci;
        if (d.phone !== undefined) dbUpdate.phone = d.phone;
        if (d.birthDate !== undefined) dbUpdate.birth_date = d.birthDate;
        if (d.gender !== undefined) dbUpdate.gender = d.gender;
        if (d.height !== undefined) dbUpdate.height = d.height ? parseFloat(d.height) : null;
        if (d.weight !== undefined) dbUpdate.weight = d.weight ? parseFloat(d.weight) : null;
        if (d.clinicalHistory !== undefined) dbUpdate.clinical_history = d.clinicalHistory;
        if (d.medications !== undefined) dbUpdate.medications = d.medications;
        if (d.notas !== undefined) dbUpdate.notes = d.notas;
        if (d.isPediatric !== undefined) dbUpdate.is_pediatric = d.isPediatric;
        if (d.tutorName !== undefined) dbUpdate.tutor_name = d.tutorName;
        if (d.tutorPhone !== undefined) dbUpdate.tutor_phone = d.tutorPhone;
        if (d.mealPlan !== undefined) dbUpdate.meal_plan = d.mealPlan;
        if (d.tags !== undefined) dbUpdate.tags = d.tags;
      }
      if (reconciledClinical.measurements !== undefined) {
        dbUpdate.measurements = reconciledClinical.measurements;
      }

      // Reconciliación del menú si la llamada incluía base de menú
      if (currentMenuBase) {
        const serverMenu = serverPatient.menu || {};
        const localMenu = {
          _days: {
            day1: partialData.menus?.day1 || partialData.menu || {},
            day2: partialData.menus?.day2 || {}
          },
          dietForm: partialData.dietForm !== undefined ? partialData.dietForm : partialData.menu?.dietForm,
          formulas: partialData.formulas !== undefined ? partialData.formulas : partialData.menu?.formulas
        };

        const mergeResult = mergePatientMenu(currentMenuBase, serverMenu, localMenu);

        if (!mergeResult.isPersistenceAllowed) {
          const conflictErr = new Error('Conflicto clínico concurrente en el menú. Persistencia bloqueada para proteger los datos.');
          conflictErr.code = 'PERSISTENCE_CONFLICT';
          conflictErr.conflicts = mergeResult.conflicts;
          throw conflictErr;
        }

        const day1Data = mergeResult.merged._days?.day1 || {};
        const day2Data = mergeResult.merged._days?.day2 || {};
        const day1RootEntries = Object.fromEntries(
          Object.entries(day1Data).filter(([k]) => !RESERVED_KEYS.has(k))
        );

        const unknownKeys = {};
        for (const k of Object.keys(mergeResult.merged)) {
          if (!RESERVED_KEYS.has(k)) {
            unknownKeys[k] = mergeResult.merged[k];
          }
        }

        dbUpdate.menu = {
          ...unknownKeys,
          ...day1RootEntries,
          _days: {
            day1: day1Data,
            day2: day2Data
          },
          ...(mergeResult.merged.dietForm !== undefined ? { dietForm: mergeResult.merged.dietForm } : {}),
          ...(mergeResult.merged.formulas !== undefined ? { formulas: mergeResult.merged.formulas } : {})
        };

        currentMenuBase = serverMenu;
      } else if (!hasMenuUpdate) {
        // Si la llamada no modificaba el menú, aseguramos conservar el menú fresco del servidor
        delete dbUpdate.menu;
      }

      // Actualizar expectedUpdatedAt al nuevo timestamp del servidor y reintentar
      currentExpectedUpdatedAt = serverPatient.updated_at;
      continue;
    }

    // Éxito: al menos una fila actualizada
    return getPatientById(id);
  }

  throw new Error('No se pudo completar el guardado tras reintentos por alta concurrencia.');
};

export const addHistoryEntry = async (patientId, entry) => {
  const { error } = await supabase
    .from('patient_history_entries')
    .insert([{ patient_id: patientId, entry }]);
    
  if (error) {
    console.error('Error adding history entry:', error);
    throw error;
  }
};

export const addReport = async (patientId, snapshot) => {
  const { error } = await supabase
    .from('patient_reports')
    .insert([{ patient_id: patientId, snapshot }]);
    
  if (error) {
    console.error('Error adding report:', error);
    throw error;
  }
};

export const deletePatient = async (id) => {
  const { error } = await supabase.from('patients').delete().eq('id', id);
  if (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
  return true;
};
