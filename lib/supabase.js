import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxjxgojiudufrfvzhhnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4anhnb2ppdWR1ZnJmdnpoaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4ODYyNDUsImV4cCI6MjEwMTQ2MjI0NX0.4tkRBTc7xYdoTcFPWDoX6pKxs4uLBlfEK_2SDcDX7g8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});