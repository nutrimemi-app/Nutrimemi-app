require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanGhosts() {
  const { data, error, count } = await supabase
    .from('patients')
    .delete({ count: 'exact' })
    .or('name.is.null,name.eq.""');
  
  if (error) {
    console.error('Error deleting ghosts:', error);
  } else {
    console.log(`Successfully deleted ${count} ghost patients.`);
  }
}

cleanGhosts();
