// שכבת persistence ל-localStorage עם prefix אחיד
const STORAGE_PREFIX = 'horovitz_';

export const storageKeys = {
  CUSTOMERS: 'customers',
  DEVICES: 'devices',
  REPAIRS: 'repairs',
  PARTS: 'parts',
  STOCK_BATCHES: 'stock_batches',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  GENERAL_EXPENSES: 'general_expenses',
  WORK_CATALOG: 'work_catalog',
  SERVICES: 'services',
  TECHNICIANS: 'technicians',
  WARRANTY_APPEALS: 'warranty_appeals',
  MANUFACTURERS: 'manufacturers',
  MODELS: 'models',
  SETTINGS: 'settings',
  CURRENT_USER: 'current_user',
  USERS: 'users',
  STATUS_CONFIG: 'status_config',
  ROLE_CONFIG: 'role_config',
};

// טעינה
export const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// שמירה
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('localStorage מלא — לא ניתן לשמור נתונים. נסה להקטין גודל תמונות או לנקות נתונים ישנים.');
      // הצג התראה גלובלית
      window.dispatchEvent(new CustomEvent('storage-quota-exceeded', { detail: { key } }));
    } else {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
    return false;
  }
};

// מחיקה
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
    return true;
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
    return false;
  }
};

// מחיקת כל הנתונים של המערכת
export const clearAllStorage = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => localStorage.removeItem(key));
};

// יצוא כל הנתונים (לגיבוי)
export const exportAllData = () => {
  const data = {};
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_PREFIX))
    .forEach(key => {
      const cleanKey = key.replace(STORAGE_PREFIX, '');
      try {
        data[cleanKey] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[cleanKey] = localStorage.getItem(key);
      }
    });
  return data;
};

// יבוא נתונים (משחזור גיבוי)
export const importAllData = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    saveToStorage(key, value);
  });
};

// --- לוגים ---
const LOGS_KEY = STORAGE_PREFIX + 'action_logs';
const MAX_LOGS = 2000;

export const loadLogs = () => {
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const appendLog = (entry) => {
  try {
    const current = loadLogs();
    const updated = [entry, ...current].slice(0, MAX_LOGS);
    localStorage.setItem(LOGS_KEY, JSON.stringify(updated));
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      // נסה לשמור רק לוגים אחרונים כדי לפנות מקום
      try {
        const trimmed = loadLogs().slice(0, 100);
        localStorage.setItem(LOGS_KEY, JSON.stringify([entry, ...trimmed]));
      } catch {
        // אם עדיין נכשל — דלג בשקט
      }
    }
  }
};

export const clearLogs = () => {
  localStorage.removeItem(LOGS_KEY);
};

// חישוב שימוש באחסון לפי מפתח
export const getStorageUsage = () => {
  const usage = {};
  let total = 0;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const size = (localStorage.getItem(key) || '').length * 2; // UTF-16 bytes
      const cleanKey = key.replace(STORAGE_PREFIX, '');
      usage[cleanKey] = size;
      total += size;
    }
  });
  return { usage, total };
};

// מסיר שדות תמונה מ-object (רקורסיבי)
const IMAGE_FIELDS = ['image', 'images', 'photo', 'photos', 'appealEvidence', 'thumbnail'];
export const stripImagesFromObject = (obj) => {
  if (Array.isArray(obj)) return obj.map(stripImagesFromObject);
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (IMAGE_FIELDS.includes(k)) {
        result[k] = Array.isArray(v) ? [] : null;
      } else {
        result[k] = stripImagesFromObject(v);
      }
    }
    return result;
  }
  return obj;
};
