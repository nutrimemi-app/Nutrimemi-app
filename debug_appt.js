const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('appointments')
    .insert([{
      patient_id: '8c7bab3a-0ea3-4517-9355-c3b462a5214d', // Maria's ID from screenshot
      patient_name: 'Test',
      appointment_date: '2026-08-17',
      appointment_time: '14:00',
      type: 'Control',
      notes: 'Test note'
    }]);
  
  if (error) {
    console.log('INSERT ERROR:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
  }

  // Also let's try to query a single row to see columns
  const { data: rowData, error: rowError } = await supabase.from('appointments').select('*').limit(1);
  if (rowError) console.log('SELECT ERROR:', rowError);
  console.log('COLUMNS:', rowData && rowData.length > 0 ? Object.keys(rowData[0]) : 'No rows');
}

testInsert();
