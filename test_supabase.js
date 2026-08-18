import { supabase } from './src/lib/supabaseClient.js';
async function test() {
  const { data, error } = await supabase.from('patient_reports').select('id').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", data);
  }
}
test();
