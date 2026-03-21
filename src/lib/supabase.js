import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validación robusta: No bloqueamos la ejecución si las llaves no son válidas o son los placeholders por defecto
const isValidConfig = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl.startsWith('https://') && 
                     !supabaseUrl.includes('tu_url_aqui');

let supabaseInstance;

if (isValidConfig) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn("Error crítico al inicializar Supabase:", e.message);
  }
}

export const supabase = supabaseInstance || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithOAuth: () => {
      alert('⚠️ Supabase no está configurado correctamente. Conecta tu proyecto en el archivo .env');
      return { error: new Error('Supabase no configurado') };
    },
    signOut: () => Promise.resolve()
  }
};
