const SUPABASE_URL = "https://wiosfrpgbgzqqiheaxve.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpb3NmcnBnYmd6cXFpaGVheHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzQ1MTUsImV4cCI6MjA5ODc1MDUxNX0.ngj64yzE2IuC8dKZen-TA5WJl6IA3_d7BST4lKY8eVk";

if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("O SDK do Supabase não foi carregado.");
} else {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}
