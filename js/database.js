// js/database.js

const supabaseUrl = 'https://eyymmsqitfshqbkcjsqy.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5eW1tc3FpdGZzaHFia2Nqc3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzgyOTIsImV4cCI6MjEwMDMxNDI5Mn0.ayDIi3v6LDi2IuZJWR3zBS8w-hq1_LlkwbbXYvuGgj4'; 

// Initialiseer de Supabase client
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase verbinding klaar!");