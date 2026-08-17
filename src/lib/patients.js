import { supabase } from './supabaseClient';

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
  return {
    id: dbPatient.id,
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
    menu: dbPatient.menu || {},
    dietForm: dbPatient.menu?.dietForm || {},
    formulas: dbPatient.menu?.formulas || {},
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
  if (history) mapped.history = history.map(h => h.entry);
  if (reports) mapped.reports = reports.map(r => r.snapshot);

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
  
  if (partialData.menu !== undefined || partialData.dietForm !== undefined || partialData.formulas !== undefined) {
    // Para no romper el esquema de DB, guardamos dietForm y formulas dentro del JSONB de menu
    dbUpdate.menu = {
      ...(partialData.menu || {}),
      dietForm: partialData.dietForm !== undefined ? partialData.dietForm : undefined,
      formulas: partialData.formulas !== undefined ? partialData.formulas : undefined
    };
  }

  if (partialData.onboardingAnswers !== undefined) dbUpdate.onboarding_answers = partialData.onboardingAnswers;

  dbUpdate.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('patients')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
  return getPatientById(id);
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
