import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

// ישויות שנשמרות בשורה נפרדת לכל פריט (גרנולרי)
// מיפוי: stateKey → prefix בDB
export const GRANULAR_ENTITIES = {
  customers:       'customer__',
  devices:         'device__',
  repairs:         'repair__',
  parts:           'part__',
  stockBatches:    'stockbatch__',
  suppliers:       'supplier__',
  purchaseOrders:  'po__',
  generalExpenses: 'expense__',
  workCatalog:     'work__',
  services:        'service__',
  technicians:     'tech__',
  warrantyAppeals: 'appeal__',
  manufacturers:   'mfg__',
  models:          'model__',
  users:           'user__',   // כל משתמש בשורה נפרדת — מונע מחיקת משתמשים חדשים
};

// מיפוי הפוך: prefix → stateKey (לשימוש ב-LOAD_ONE וב-Realtime)
export const PREFIX_TO_STATE_KEY = Object.fromEntries(
  Object.entries(GRANULAR_ENTITIES).map(([stateKey, prefix]) => [prefix, stateKey])
);

// ישויות scalar — נשמרות כשורה אחת (ללא id ייחודי לכל פריט)
export const STATE_TO_DB_KEY = {
  settings:     'settings',
  statusConfig: 'status_config',
  roleConfig:   'role_config',
};

export const DB_TO_STATE_KEY = Object.fromEntries(
  Object.entries(STATE_TO_DB_KEY).map(([k, v]) => [v, k])
);

// מיפוי לגישה ל-DB keys ישנים (למיגרציה)
const OLD_DB_KEY_TO_STATE_KEY = {
  customers: 'customers', devices: 'devices', repairs: 'repairs',
  parts: 'parts', stock_batches: 'stockBatches', suppliers: 'suppliers',
  purchase_orders: 'purchaseOrders', general_expenses: 'generalExpenses',
  work_catalog: 'workCatalog', services: 'services',
  technicians: 'technicians', warranty_appeals: 'warrantyAppeals',
  users: 'users', // מיגרציה מפורמט ישן (key='users', data=[...]) לגרנולרי
};

// טעינת כל הנתונים מ-Supabase
// מחזיר: { customers: [...], repairs: [...], settings: {...}, ... } (ממופה לפי stateKey)
export async function loadAllFromDB() {
  if (!supabase) return null;
  // שגיאת רשת/שרת → זורק כדי שהקורא ידע שזה מצב אופליין (ולא "פעם ראשונה")
  let data, error;
  try {
    ({ data, error } = await supabase.from('lab_data').select('*'));
  } catch (e) {
    console.error('Supabase connection error:', e);
    throw new Error('supabase-offline');
  }
  if (error) { console.error('Supabase load error:', error); throw new Error('supabase-offline'); }
  try {
    if (!data || data.length === 0) return null; // באמת ריק — פעם ראשונה

    // אתחל מערכים לכל ישות גרנולרית
    const result = {};
    Object.keys(GRANULAR_ENTITIES).forEach(stateKey => { result[stateKey] = []; });

    const oldFormatRows = [];

    data.forEach(row => {
      const { key, data: rowData } = row;

      // פורמט גרנולרי חדש (prefix__id)
      const prefixEntry = Object.entries(PREFIX_TO_STATE_KEY)
        .find(([prefix]) => key.startsWith(prefix));
      if (prefixEntry) {
        const [, stateKey] = prefixEntry;
        if (rowData) result[stateKey].push(rowData);
        return;
      }

      // ישות scalar (settings, users, statusConfig, roleConfig)
      const scalarStateKey = DB_TO_STATE_KEY[key];
      if (scalarStateKey) {
        result[scalarStateKey] = rowData;
        return;
      }

      // פורמט ישן — מערך שלם — צריך מיגרציה
      const oldStateKey = OLD_DB_KEY_TO_STATE_KEY[key];
      if (oldStateKey && Array.isArray(rowData)) {
        // ממזג עם מה שכבר נטען גרנולרית (אם יש)
        const existing = result[oldStateKey] || [];
        const existingIds = new Set(existing.map(i => i?.id).filter(Boolean));
        const toAdd = rowData.filter(i => i?.id && !existingIds.has(i.id));
        result[oldStateKey] = [...existing, ...toAdd];
        oldFormatRows.push({ dbKey: key, stateKey: oldStateKey });
      }
    });

    // הרץ מיגרציה ברקע
    if (oldFormatRows.length > 0) {
      migrateOldFormatToGranular(result, oldFormatRows).catch(console.error);
    }

    return result;
  } catch (e) {
    // שגיאת עיבוד לא צפויה — עדיף לשמור על הנתונים המקומיים מאשר לדרוס
    console.error('Supabase parse error:', e);
    throw new Error('supabase-offline');
  }
}

// מיגרציה: המר שורות ישנות (key='repairs', data=[...]) לשורות גרנולריות
async function migrateOldFormatToGranular(loadedResult, oldFormatRows) {
  if (!supabase) return;
  const now = new Date().toISOString();
  for (const { dbKey, stateKey } of oldFormatRows) {
    const items = loadedResult[stateKey];
    const prefix = GRANULAR_ENTITIES[stateKey];
    if (!prefix) continue;

    if (Array.isArray(items) && items.length > 0) {
      const rows = items.filter(item => item?.id).map(item => ({
        key: `${prefix}${item.id}`,
        data: item,
        updated_at: now,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('lab_data').upsert(rows, { onConflict: 'key' });
        if (error) console.error(`Migration upsert error [${stateKey}]:`, error);
      }
    }
    // מחק שורה ישנה
    await supabase.from('lab_data').delete().eq('key', dbKey);
  }
}

// שמירת פריט בודד (גרנולרי) — לשימוש חיצוני אם צריך
export async function saveItemToDB(stateKey, item) {
  if (!supabase || !item?.id) return;
  const prefix = GRANULAR_ENTITIES[stateKey];
  if (!prefix) return;
  const key = `${prefix}${item.id}`;
  try {
    const { error } = await supabase.from('lab_data').upsert(
      { key, data: item, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    if (error) console.error(`Supabase save error [${key}]:`, error);
  } catch (e) {
    console.error(`Supabase save exception [${key}]:`, e);
  }
}

// שמירת מפתח scalar ל-Supabase (settings, users, statusConfig, roleConfig)
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

// שמירת כל הנתונים בבת אחת (ראשון פעם — מ-localStorage ל-Supabase)
// stateSnapshot: { stateKey: value } (ישויות גרנולריות ו-scalar)
export async function saveAllToDB(stateSnapshot) {
  if (!supabase) return;
  const now = new Date().toISOString();
  const rows = [];

  for (const [stateKey, value] of Object.entries(stateSnapshot)) {
    const prefix = GRANULAR_ENTITIES[stateKey];
    if (prefix && Array.isArray(value)) {
      value.filter(item => item?.id).forEach(item => {
        rows.push({ key: `${prefix}${item.id}`, data: item, updated_at: now });
      });
    } else if (STATE_TO_DB_KEY[stateKey]) {
      rows.push({ key: STATE_TO_DB_KEY[stateKey], data: value, updated_at: now });
    }
  }

  try {
    if (rows.length > 0) {
      const { error } = await supabase.from('lab_data').upsert(rows, { onConflict: 'key' });
      if (error) console.error('Supabase bulk save error:', error);
    }
  } catch (e) {
    console.error('Supabase bulk save exception:', e);
  }
}
