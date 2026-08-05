/* src/supabase-client.ts */
import { createClient } from "@supabase/supabase-js";

// Overridable so the app can be pointed at a local stack or a preview branch.
// The production URL stays as the fallback: it is not a secret, and keeping it
// means an environment that hasn't set VITE_SUPABASE_URL still works rather
// than booting against `undefined`.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://tshtiffutyauyzfcekuq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
