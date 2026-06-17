const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://puvnsklbhqsnwckxvsib.supabase.co';
const supabaseKey = 'sb_publishable_eAqzv5KKGUk4QR07gbEY8w_8OMVL5sU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('employees').select('*').limit(1);
  if (error) {
    console.error('Error fetching employees:', error);
  } else {
    console.log('Columns in employees table:', Object.keys(data[0] || {}));
    console.log('Sample data:', data[0]);
  }
}
check();
