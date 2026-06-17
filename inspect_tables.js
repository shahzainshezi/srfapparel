const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://puvnsklbhqsnwckxvsib.supabase.co';
const supabaseKey = 'sb_publishable_eAqzv5KKGUk4QR07gbEY8w_8OMVL5sU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPCs() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql'];
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql_query: 'select 1' });
      if (error) {
        console.log(`RPC "${rpc}": Error - ${error.message}`);
      } else {
        console.log(`RPC "${rpc}": SUCCESS!`, data);
      }
    } catch (e) {
      console.log(`RPC "${rpc}": Exception - ${e.message}`);
    }
  }
}

testRPCs();
