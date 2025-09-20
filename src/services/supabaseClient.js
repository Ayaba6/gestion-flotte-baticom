import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://jizfgmipbdzsuxewckjf.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppemZnbWlwYmR6c3V4ZXdja2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDkwNzksImV4cCI6MjA3MzcyNTA3OX0.iHYxuvcPEy71BbnTlzzgzgCOr548PP1RHb40iWWvmMc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
