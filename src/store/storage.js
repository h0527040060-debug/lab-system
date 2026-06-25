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
  SETTINGS: 'settings',
  CURRENT_USER: 'current_user',
  USERS: 'users',
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
    console.error(`Failed to save ${key} to localStorage:`, error);
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
