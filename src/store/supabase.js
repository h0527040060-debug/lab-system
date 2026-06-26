import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

// מיפוי מפתחות state לשמות עמודות ב-DB
export const STATE_TO_DB_KEY = {
  customers:       'customers',
  devices:         'devices',
  repairs:         'repairs',
  parts:           'parts',
  stockBatches:    'stock_batches',
  suppliers:       'suppliers',
  purchaseOrders:  'purchase_orders',
  generalExpenses: 'general_expenses',
  workCatalog:     'work_catalog',
  services:        'services',
  technicians:     'technicians',
  warrantyAppeals: 'warranty_appeals',
  settings:        'settings',
  users:           'users',
  statusConfig:    'status_config',
  roleConfig:      'role_config',
};

export const DB_TO_STATE_KEY = Object.fromEntries(
  Object.entries(STATE_TO_DB_KEY).map(([k, v]) => [v, k])
);

// טעינת כל הנתונים מ-Supabase
export async function loadAllFromDB() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('lab_data').select('*');
    if (error) { console.error('Supabase load error:', error); return null; }
    const result = {};
    data.forEach(row => { result[row.key] = row.data; });
    return result;
  } catch (e) {
    console.error('Supabase connection error:', e);
    return null;
  }
}

// שמירת מפתח אחד ל-Supabase
export async function saveKeyToDB(dbKey, value) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('lab_data').upsert(
      { key: dbKey, data: value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) console.error(`Supabase save error [${dbKey}]:`, error);
  } catch (e) {
    console.error(`Supabase save exception [${dbKey}]:`, e);
  }
}

// שמירת כל הנתונים בבת אחת (למיגרציה ראשונית)
export async function saveAllToDB(stateSnapshot) {
  if (!supabase) return;
  try {
    const rows = Object.entries(stateSnapshot).map(([key, data]) => ({
      key,
      data,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('lab_data').upsert(rows, { onConflict: 'key' });
    if (error) console.error('Supabase bulk save error:', error);
  } catch (e) {
    console.error('Supabase bulk save exception:', e);
  }
}
