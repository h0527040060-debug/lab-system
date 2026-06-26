import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { storageKeys, loadFromStorage, saveToStorage, appendLog } from './storage';
import { supabase, isSupabaseConfigured, loadAllFromDB, saveKeyToDB, saveAllToDB, STATE_TO_DB_KEY, DB_TO_STATE_KEY } from './supabase';
import {
  SEED_TECHNICIANS, SEED_SUPPLIERS, SEED_WORK_CATALOG,
  SEED_SERVICES, SEED_PARTS, SEED_STOCK_BATCHES, SEED_SETTINGS,
} from '../data/seedData';
import { DEFAULT_STATUS_CONFIG } from '../utils/statusConfig';

export const DEFAULT_ROLE_CONFIG = {
  office: {
    visible_statuses: [
      'red_intake','yellow_diagnosis','yellow_appeal','yellow_waiting_approval',
      'yellow_ready_to_work','in_work','pending_release_docs',
      'pending_payment','paid_waiting_pickup',
    ],
  },
  lab: {
    visible_statuses: ['yellow_ready_to_work','in_work','pending_release_docs'],
  },
};

// ============================================================
// STATE INITIAL
// ============================================================
// מוודא שיצחק הורוביץ הוא תמיד אדמין
const OWNER_EMAIL = 'h0527040060@gmail.com';

const ensureOwnerIsAdmin = (users) => {
  const idx = users.findIndex(u => u.email.toLowerCase() === OWNER_EMAIL);
  if (idx === -1) return users;
  if (users[idx].role === 'admin') return users;
  const updated = [...users];
  updated[idx] = { ...updated[idx], role: 'admin' };
  return updated;
};

const buildInitialState = () => {
  const users = ensureOwnerIsAdmin(loadFromStorage(storageKeys.USERS, []));
  const rawCurrentUser = loadFromStorage(storageKeys.CURRENT_USER, null);
  // סנכרון currentUser עם הנתון המעודכן מ-users
  const currentUser = rawCurrentUser
    ? (users.find(u => u.id === rawCurrentUser.id) || rawCurrentUser)
    : null;
  return {
    customers:        loadFromStorage(storageKeys.CUSTOMERS, []),
    devices:          loadFromStorage(storageKeys.DEVICES, []),
    repairs:          loadFromStorage(storageKeys.REPAIRS, []),
    parts:            loadFromStorage(storageKeys.PARTS, SEED_PARTS),
    stockBatches:     loadFromStorage(storageKeys.STOCK_BATCHES, SEED_STOCK_BATCHES),
    suppliers:        loadFromStorage(storageKeys.SUPPLIERS, SEED_SUPPLIERS),
    purchaseOrders:   loadFromStorage(storageKeys.PURCHASE_ORDERS, []),
    generalExpenses:  loadFromStorage(storageKeys.GENERAL_EXPENSES, []),
    workCatalog:      loadFromStorage(storageKeys.WORK_CATALOG, SEED_WORK_CATALOG),
    services:         loadFromStorage(storageKeys.SERVICES, SEED_SERVICES),
    technicians:      loadFromStorage(storageKeys.TECHNICIANS, SEED_TECHNICIANS),
    warrantyAppeals:  loadFromStorage(storageKeys.WARRANTY_APPEALS, []),
    settings:         loadFromStorage(storageKeys.SETTINGS, SEED_SETTINGS),
    currentUser,
    users,
    statusConfig:     loadFromStorage(storageKeys.STATUS_CONFIG, DEFAULT_STATUS_CONFIG),
    roleConfig:       loadFromStorage(storageKeys.ROLE_CONFIG, DEFAULT_ROLE_CONFIG),
  };
};

// ============================================================
// REDUCER
// ============================================================
const appReducer = (state, action) => {
  switch (action.type) {
    // --- לקוחות ---
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return { ...state, customers: state.customers.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };

    // --- מכשירים ---
    case 'ADD_DEVICE':
      return { ...state, devices: [...state.devices, action.payload] };
    case 'UPDATE_DEVICE':
      return { ...state, devices: state.devices.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };

    // --- תיקונים ---
    case 'ADD_REPAIR':
      return { ...state, repairs: [...state.repairs, action.payload] };
    case 'UPDATE_REPAIR':
      return { ...state, repairs: state.repairs.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_REPAIR':
      return { ...state, repairs: state.repairs.filter(r => r.id !== action.payload) };

    // --- חלקים ---
    case 'ADD_PART':
      return { ...state, parts: [...state.parts, action.payload] };
    case 'UPDATE_PART':
      return { ...state, parts: state.parts.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DELETE_PART':
      return { ...state, parts: state.parts.filter(p => p.id !== action.payload) };

    // --- אצוות מלאי ---
    case 'ADD_STOCK_BATCH':
      return { ...state, stockBatches: [...state.stockBatches, action.payload] };
    case 'UPDATE_STOCK_BATCH':
      return { ...state, stockBatches: state.stockBatches.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'UPDATE_STOCK_BATCHES_BULK':
      return {
        ...state,
        stockBatches: state.stockBatches.map(b => {
          const update = action.payload.find(u => u.id === b.id);
          return update ? { ...b, ...update } : b;
        })
      };

    // --- ספקים ---
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'DELETE_SUPPLIER':
      return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };

    // --- הזמנות רכש ---
    case 'ADD_PURCHASE_ORDER':
      return { ...state, purchaseOrders: [...state.purchaseOrders, action.payload] };
    case 'UPDATE_PURCHASE_ORDER':
      return { ...state, purchaseOrders: state.purchaseOrders.map(po => po.id === action.payload.id ? { ...po, ...action.payload } : po) };

    // --- הוצאות כלליות ---
    case 'ADD_GENERAL_EXPENSE':
      return { ...state, generalExpenses: [...state.generalExpenses, action.payload] };
    case 'UPDATE_GENERAL_EXPENSE':
      return { ...state, generalExpenses: state.generalExpenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case 'DELETE_GENERAL_EXPENSE':
      return { ...state, generalExpenses: state.generalExpenses.filter(e => e.id !== action.payload) };

    // --- קטלוג עבודות ---
    case 'ADD_WORK_ITEM':
      return { ...state, workCatalog: [...state.workCatalog, action.payload] };
    case 'UPDATE_WORK_ITEM':
      return { ...state, workCatalog: state.workCatalog.map(w => w.id === action.payload.id ? { ...w, ...action.payload } : w) };
    case 'DELETE_WORK_ITEM':
      return { ...state, workCatalog: state.workCatalog.filter(w => w.id !== action.payload) };

    // --- שירותים ---
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return { ...state, services: state.services.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };

    // --- טכנאים ---
    case 'ADD_TECHNICIAN':
      return { ...state, technicians: [...state.technicians, action.payload] };
    case 'UPDATE_TECHNICIAN':
      return { ...state, technicians: state.technicians.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };

    // --- ערעורי אחריות ---
    case 'ADD_WARRANTY_APPEAL':
      return { ...state, warrantyAppeals: [...state.warrantyAppeals, action.payload] };
    case 'UPDATE_WARRANTY_APPEAL':
      return { ...state, warrantyAppeals: state.warrantyAppeals.map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a) };

    // --- הגדרות ---
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // --- רשימת משתמשים ---
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER': {
      const updatedUsers = state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u);
      const updatedCurrent = state.currentUser?.id === action.payload.id
        ? { ...state.currentUser, ...action.payload }
        : state.currentUser;
      return { ...state, users: updatedUsers, currentUser: updatedCurrent };
    }

    // --- קונפיגורציית סטטוסים ---
    case 'ADD_STATUS':
      return { ...state, statusConfig: [...state.statusConfig, action.payload] };
    case 'UPDATE_STATUS':
      return { ...state, statusConfig: state.statusConfig.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'DELETE_STATUS':
      return { ...state, statusConfig: state.statusConfig.filter(s => s.id !== action.payload) };

    // --- קונפיגורציית תפקידים ---
    case 'UPDATE_ROLE_CONFIG':
      return { ...state, roleConfig: { ...state.roleConfig, ...action.payload } };

    // --- משתמש נוכחי ---
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };

    // --- עדכון entity בודד מ-Realtime ---
    case 'LOAD_ONE': {
      const stateKey = DB_TO_STATE_KEY[action.payload.key];
      if (!stateKey) return state;
      return { ...state, [stateKey]: action.payload.data };
    }

    // --- טעינה מ-Supabase ---
    case 'LOAD_ALL': {
      const p = action.payload;
      const users = ensureOwnerIsAdmin(p[DB_TO_STATE_KEY.users] ?? state.users);
      const rawCurrentUser = state.currentUser;
      const currentUser = rawCurrentUser
        ? (users.find(u => u.id === rawCurrentUser.id) || rawCurrentUser)
        : null;
      return {
        ...state,
        customers:       p[STATE_TO_DB_KEY.customers]       ?? state.customers,
        devices:         p[STATE_TO_DB_KEY.devices]         ?? state.devices,
        repairs:         p[STATE_TO_DB_KEY.repairs]         ?? state.repairs,
        parts:           p[STATE_TO_DB_KEY.parts]           ?? state.parts,
        stockBatches:    p[STATE_TO_DB_KEY.stockBatches]    ?? state.stockBatches,
        suppliers:       p[STATE_TO_DB_KEY.suppliers]       ?? state.suppliers,
        purchaseOrders:  p[STATE_TO_DB_KEY.purchaseOrders]  ?? state.purchaseOrders,
        generalExpenses: p[STATE_TO_DB_KEY.generalExpenses] ?? state.generalExpenses,
        workCatalog:     p[STATE_TO_DB_KEY.workCatalog]     ?? state.workCatalog,
        services:        p[STATE_TO_DB_KEY.services]        ?? state.services,
        technicians:     p[STATE_TO_DB_KEY.technicians]     ?? state.technicians,
        warrantyAppeals: p[STATE_TO_DB_KEY.warrantyAppeals] ?? state.warrantyAppeals,
        settings:        p[STATE_TO_DB_KEY.settings]        ?? state.settings,
        users,
        statusConfig:    p[STATE_TO_DB_KEY.statusConfig]    ?? state.statusConfig,
        roleConfig:      p[STATE_TO_DB_KEY.roleConfig]      ?? state.roleConfig,
        currentUser,
      };
    }

    default:
      return state;
  }
};

// ============================================================
// AUDIT LOG
// ============================================================
const ACTION_META = {
  ADD_REPAIR:           { entity: 'repair',    desc: (p) => `קלט תיקון חדש: ${p.id}` },
  UPDATE_REPAIR:        { entity: 'repair',    desc: (p) => `עדכן תיקון: ${p.id}` },
  DELETE_REPAIR:        { entity: 'repair',    desc: (p) => `מחק תיקון: ${p}` },
  ADD_CUSTOMER:         { entity: 'customer',  desc: (p) => `הוסיף לקוח: ${p.name}` },
  UPDATE_CUSTOMER:      { entity: 'customer',  desc: (p) => `עדכן לקוח: ${p.id}` },
  DELETE_CUSTOMER:      { entity: 'customer',  desc: (p) => `מחק לקוח: ${p}` },
  ADD_DEVICE:           { entity: 'device',    desc: (p) => `הוסיף מכשיר: ${p.id}` },
  UPDATE_DEVICE:        { entity: 'device',    desc: (p) => `עדכן מכשיר: ${p.id}` },
  ADD_PART:             { entity: 'part',      desc: (p) => `הוסיף חלק: ${p.name || p.id}` },
  UPDATE_PART:          { entity: 'part',      desc: (p) => `עדכן חלק: ${p.id}` },
  DELETE_PART:          { entity: 'part',      desc: (p) => `מחק חלק: ${p}` },
  ADD_STOCK_BATCH:      { entity: 'stock',     desc: (p) => `קלט אצווה: ${p.id}` },
  UPDATE_STOCK_BATCH:   { entity: 'stock',     desc: (p) => `עדכן אצווה: ${p.id}` },
  UPDATE_STOCK_BATCHES_BULK: { entity: 'stock', desc: () => 'עדכון מלאי כמותי' },
  ADD_SUPPLIER:         { entity: 'supplier',  desc: (p) => `הוסיף ספק: ${p.name}` },
  UPDATE_SUPPLIER:      { entity: 'supplier',  desc: (p) => `עדכן ספק: ${p.id}` },
  DELETE_SUPPLIER:      { entity: 'supplier',  desc: (p) => `מחק ספק: ${p}` },
  ADD_PURCHASE_ORDER:   { entity: 'purchase',  desc: (p) => `יצר הזמנת רכש: ${p.id}` },
  UPDATE_PURCHASE_ORDER:{ entity: 'purchase',  desc: (p) => `עדכן הזמנת רכש: ${p.id}` },
  ADD_GENERAL_EXPENSE:  { entity: 'expense',   desc: (p) => `הוסיף הוצאה: ${p.description || p.id}` },
  UPDATE_GENERAL_EXPENSE:{ entity: 'expense',  desc: (p) => `עדכן הוצאה: ${p.id}` },
  DELETE_GENERAL_EXPENSE:{ entity: 'expense',  desc: (p) => `מחק הוצאה: ${p}` },
  ADD_WORK_ITEM:        { entity: 'work',      desc: (p) => `הוסיף עבודה לקטלוג: ${p.name || p.id}` },
  UPDATE_WORK_ITEM:     { entity: 'work',      desc: (p) => `עדכן עבודה בקטלוג: ${p.id}` },
  DELETE_WORK_ITEM:     { entity: 'work',      desc: (p) => `מחק עבודה מהקטלוג: ${p}` },
  ADD_SERVICE:          { entity: 'service',   desc: (p) => `הוסיף שירות: ${p.name || p.id}` },
  UPDATE_SERVICE:       { entity: 'service',   desc: (p) => `עדכן שירות: ${p.id}` },
  ADD_TECHNICIAN:       { entity: 'technician',desc: (p) => `הוסיף טכנאי: ${p.name}` },
  UPDATE_TECHNICIAN:    { entity: 'technician',desc: (p) => `עדכן טכנאי: ${p.id}` },
  ADD_WARRANTY_APPEAL:  { entity: 'appeal',    desc: (p) => `פתח ערעור אחריות: ${p.id}` },
  UPDATE_WARRANTY_APPEAL:{ entity: 'appeal',   desc: (p) => `עדכן ערעור אחריות: ${p.id}` },
  UPDATE_SETTINGS:      { entity: 'settings',  desc: () => 'עדכן הגדרות מערכת' },
  ADD_USER:             { entity: 'user',      desc: (p) => `הוסיף משתמש: ${p.name}` },
  UPDATE_USER:          { entity: 'user',      desc: (p) => `עדכן משתמש: ${p.id}` },
  ADD_STATUS:           { entity: 'status',    desc: (p) => `הוסיף סטטוס: ${p.label}` },
  UPDATE_STATUS:        { entity: 'status',    desc: (p) => `עדכן סטטוס: ${p.id}` },
  DELETE_STATUS:        { entity: 'status',    desc: (p) => `מחק סטטוס: ${p}` },
  SET_CURRENT_USER:     { entity: 'auth',      desc: (p) => `התחבר למערכת: ${p?.name || ''}` },
  LOGOUT:               { entity: 'auth',      desc: () => 'התנתק מהמערכת' },
};

const buildLogEntry = (action, currentUser, state) => {
  const meta = ACTION_META[action.type];
  if (!meta) return null;
  const p = action.payload;
  // חיפוש שם לקוח — מהתיקון (אם יש customer_name) או מרשימת הלקוחות
  let customerName = p?.customer_name || '';
  if (!customerName && p?.customer_id && state?.customers) {
    const c = state.customers.find(c => c.id === p.customer_id);
    if (c) customerName = c.name;
  }
  const actor = action.type === 'SET_CURRENT_USER' ? p : currentUser;
  return {
    id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    user_id: actor?.id || '',
    user_name: actor?.name || 'מערכת',
    action_type: action.type,
    entity_type: meta.entity,
    entity_id: typeof p === 'string' ? p : (p?.id || ''),
    customer_name: customerName,
    description: meta.desc(p),
  };
};

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext(null);

// ============================================================
// PROVIDER
// ============================================================
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, buildInitialState);
  const [dbLoading, setDbLoading] = useState(isSupabaseConfigured());
  const saveTimers = useRef({});
  const initializedRef = useRef(false);
  const pendingSavesRef = useRef(new Set());

  // טעינה ראשונית מ-Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    loadAllFromDB().then(dbData => {
      if (dbData && Object.keys(dbData).length > 0) {
        // Supabase מכיל נתונים — טען אותם
        dispatch({ type: 'LOAD_ALL', payload: dbData });
      } else {
        // ראשון פעם — מגרר נתונים קיימים מ-localStorage ל-Supabase
        const snapshot = {};
        Object.entries(STATE_TO_DB_KEY).forEach(([stateKey, dbKey]) => {
          if (state[stateKey] !== undefined) snapshot[dbKey] = state[stateKey];
        });
        if (Object.values(snapshot).some(v => Array.isArray(v) && v.length > 0)) {
          saveAllToDB(snapshot);
        }
      }
      initializedRef.current = true;
      setDbLoading(false);
    }).catch(() => {
      initializedRef.current = true;
      setDbLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime — עדכון אוטומטי כשמשתמש אחר משנה נתונים
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel('lab_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lab_data' },
        (payload) => {
          if (payload.new?.key && payload.new?.data !== undefined) {
            if (!pendingSavesRef.current.has(payload.new.key)) {
              dispatch({ type: 'LOAD_ONE', payload: { key: payload.new.key, data: payload.new.data } });
            }
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // שמירה אוטומטית עם debounce של 500ms לכל מפתח (localStorage + Supabase)
  const scheduleSave = useCallback((storageKey, value, dbKey) => {
    const timerKey = storageKey;
    if (saveTimers.current[timerKey]) clearTimeout(saveTimers.current[timerKey]);
    saveToStorage(storageKey, value);
    if (dbKey && isSupabaseConfigured() && initializedRef.current) {
      pendingSavesRef.current.add(dbKey);
      saveTimers.current[timerKey] = setTimeout(() => {
        saveKeyToDB(dbKey, value).finally(() => {
          pendingSavesRef.current.delete(dbKey);
        });
      }, 500);
    } else {
      saveTimers.current[timerKey] = setTimeout(() => {}, 0);
    }
  }, []);

  useEffect(() => { scheduleSave(storageKeys.CUSTOMERS, state.customers, STATE_TO_DB_KEY.customers); }, [state.customers, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.DEVICES, state.devices, STATE_TO_DB_KEY.devices); }, [state.devices, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.REPAIRS, state.repairs, STATE_TO_DB_KEY.repairs); }, [state.repairs, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.PARTS, state.parts, STATE_TO_DB_KEY.parts); }, [state.parts, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.STOCK_BATCHES, state.stockBatches, STATE_TO_DB_KEY.stockBatches); }, [state.stockBatches, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.SUPPLIERS, state.suppliers, STATE_TO_DB_KEY.suppliers); }, [state.suppliers, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.PURCHASE_ORDERS, state.purchaseOrders, STATE_TO_DB_KEY.purchaseOrders); }, [state.purchaseOrders, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.GENERAL_EXPENSES, state.generalExpenses, STATE_TO_DB_KEY.generalExpenses); }, [state.generalExpenses, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.WORK_CATALOG, state.workCatalog, STATE_TO_DB_KEY.workCatalog); }, [state.workCatalog, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.SERVICES, state.services, STATE_TO_DB_KEY.services); }, [state.services, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.TECHNICIANS, state.technicians, STATE_TO_DB_KEY.technicians); }, [state.technicians, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.WARRANTY_APPEALS, state.warrantyAppeals, STATE_TO_DB_KEY.warrantyAppeals); }, [state.warrantyAppeals, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.SETTINGS, state.settings, STATE_TO_DB_KEY.settings); }, [state.settings, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.CURRENT_USER, state.currentUser, null); }, [state.currentUser, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.USERS, state.users, STATE_TO_DB_KEY.users); }, [state.users, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.STATUS_CONFIG, state.statusConfig, STATE_TO_DB_KEY.statusConfig); }, [state.statusConfig, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.ROLE_CONFIG, state.roleConfig, STATE_TO_DB_KEY.roleConfig); }, [state.roleConfig, scheduleSave]);

  const loggedDispatch = useCallback((action) => {
    dispatch(action);
    const entry = buildLogEntry(action, state.currentUser, state);
    if (entry) appendLog(entry);
  }, [dispatch, state]);

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">מתחבר למסד הנתונים...</p>
          <p className="text-slate-400 text-sm mt-1">טוען נתונים מהשרת</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch: loggedDispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext חייב להיות בתוך AppProvider');
  return ctx;
};
