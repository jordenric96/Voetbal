// js/database.js

const supabaseUrl = 'https://eyymmsqitfshqbkcjsqy.supabase.co'; 
const supabaseKey = 'sb_publishable_u-2UeA3zqbjavdx37ul1UQ_hb5Z5fQr.'; 

// Initialiseer de Supabase client
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase verbinding klaar!");