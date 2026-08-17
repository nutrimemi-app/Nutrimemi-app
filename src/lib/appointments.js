import { supabase } from './supabaseClient';

export const getAppointments = async () => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });
    
  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
  // Map to the format the UI expects
  return data.map(d => ({
    id: d.id,
    patientId: d.patient_id,
    patientName: d.patient_name,
    date: d.appointment_date,
    time: d.appointment_time,
    type: d.type,
    notes: d.notes || ''
  }));
};

export const createAppointment = async (appt) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      patient_id: appt.patientId,
      patient_name: appt.patientName,
      appointment_date: appt.date,
      appointment_time: appt.time,
      type: appt.type,
      notes: appt.notes
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
  
  return {
    id: data.id,
    patientId: data.patient_id,
    patientName: data.patient_name,
    date: data.appointment_date,
    time: data.appointment_time,
    type: data.type,
    notes: data.notes || ''
  };
};

export const updateAppointment = async (id, appt) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      patient_id: appt.patientId,
      patient_name: appt.patientName,
      appointment_date: appt.date,
      appointment_time: appt.time,
      type: appt.type,
      notes: appt.notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
  
  return {
    id: data.id,
    patientId: data.patient_id,
    patientName: data.patient_name,
    date: data.appointment_date,
    time: data.appointment_time,
    type: data.type,
    notes: data.notes || ''
  };
};

export const deleteAppointment = async (id) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) {
    console.error('Error deleting appointment:', error);
    return false;
  }
  return true;
};
