/* src/supabase-client.ts */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tshtiffutyauyzfcekuq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
