import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { storageKeys, loadFromStorage, saveToStorage, appendLog } from './storage';
import { supabase, isSupabaseConfigured, loadAllFromDB, saveAllToDB, STATE_TO_DB_KEY, DB_TO_STATE_KEY, GRANULAR_ENTITIES, PREFIX_TO_STATE_KEY } from './supabase';
import {
  SEED_TECHNICIANS, SEED_SUPPLIERS, SEED_WORK_CATALOG,
  SEED_SERVICES, SEED_PARTS, SEED_STOCK_BATCHES, SEED_SETTINGS, DEFAULT_FIELD_LISTS,
} from '../data/seedData';
import { DEFAULT_STATUS_CONFIG } from '../utils/statusConfig';
import { useToast } from './ToastContext';
import OfflineBanner from '../components/OfflineBanner';
import { enqueueSync, dequeueSync, getSyncQueue, hasPendingSync, syncQueueSize } from './syncQueue';
import { hasPendingBase64, migratePendingImages } from './imageMigration';

export const DEFAULT_ROLE_CONFIG = {
  office: {
    visible_statuses: [
      'red_intake','yellow_diagnosis','yellow_appeal','yellow_waiting_approval',
      'yellow_ready_to_work','in_work','pending_release_docs',
      'pending_payment','paid_waiting_pickup',
    ],
    visible_tabs: [
      'kanban','dashboard','intake','intake-internal','approval','appeals',
      'payment','pickup','repairs','customers','devices','parts',
      'work-catalog','general-expenses','reports','settings','users',
    ],
  },
  lab: {
    visible_statuses: ['yellow_ready_to_work','in_work','pending_release_docs'],
    visible_tabs: ['kanban','lab-dashboard','search','history'],
  },
};

// ============================================================
// STATE INITIAL
// ============================================================
const OWNER_EMAIL = 'h0527040060@gmail.com';

// משתמש הבעלים — קבוע בקוד, לא ניתן למחיקה לעולם
const OWNER_USER = {
  id: 'USR-OWNER',
  name: 'יצחק הורוביץ',
  email: OWNER_EMAIL,
  password: '364646',
  role: 'admin',
  created_date: '2024-01-01T00:00:00.000Z',
};

// מוודא שהבעלים תמיד קיים ברשימת המשתמשים עם הרשאת אדמין
const ensureOwnerExists = (users) => {
  const idx = users.findIndex(u => u.email.toLowerCase() === OWNER_EMAIL);
  if (idx === -1) return [OWNER_USER, ...users];
  const existing = users[idx];
  if (existing.role === 'admin' && existing.id === OWNER_USER.id) return users;
  const updated = [...users];
  updated[idx] = { ...OWNER_USER, ...existing, role: 'admin', id: OWNER_USER.id };
  return updated;
};

const buildInitialState = () => {
  const rawCurrentUser = loadFromStorage(storageKeys.CURRENT_USER, null);
  const storedUsers = loadFromStorage(storageKeys.USERS, []);
  // אם מערך המשתמשים ריק אבל יש משתמש מחובר — הוסף אותו אוטומטית
  const usersWithCurrent = (storedUsers.length === 0 && rawCurrentUser)
    ? [rawCurrentUser]
    : storedUsers;
  const users = ensureOwnerExists(usersWithCurrent);
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
    settings:         (() => {
      const s = loadFromStorage(storageKeys.SETTINGS, SEED_SETTINGS);
      // הבטח שfieldLists קיים גם למשתמשים קיימים עם settings ישן
      if (!s.fieldLists) return { ...s, fieldLists: DEFAULT_FIELD_LISTS };
      // נקה ערכים שהם prefix של ערך אחר (אשפה מהקלדה חלקית)
      const cleanedLists = {};
      for (const [key, list] of Object.entries(s.fieldLists)) {
        if (Array.isArray(list)) {
          cleanedLists[key] = list.filter(v =>
            !list.some(other => other !== v && other.startsWith(v))
          );
        } else {
          cleanedLists[key] = list;
        }
      }
      return { ...s, fieldLists: cleanedLists };
    })(),
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
      if (state.repairs.some(r => r.id === action.payload.id)) return state;
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

    // --- ניהול שדות (field lists) ---
    case 'ADD_FIELD_VALUE': {
      const { field, value } = action.payload;
      const lists = state.settings.fieldLists || {};
      const current = lists[field] || [];
      if (current.includes(value)) return state;
      return { ...state, settings: { ...state.settings, fieldLists: { ...lists, [field]: [...current, value] } } };
    }
    case 'RENAME_FIELD_VALUE': {
      const { field, oldValue, newValue } = action.payload;
      const lists = state.settings.fieldLists || {};
      const current = lists[field] || [];
      const updatedList = current.map(v => v === oldValue ? newValue : v);
      // עדכון היסטוריה במכשירים
      const updatedDevices = field === 'deviceTypes'
        ? state.devices.map(d => d.type === oldValue ? { ...d, type: newValue } : d)
        : state.devices;
      return {
        ...state,
        devices: updatedDevices,
        settings: { ...state.settings, fieldLists: { ...lists, [field]: updatedList } },
      };
    }
    case 'DELETE_FIELD_VALUE': {
      const { field, value } = action.payload;
      const lists = state.settings.fieldLists || {};
      const current = lists[field] || [];
      return { ...state, settings: { ...state.settings, fieldLists: { ...lists, [field]: current.filter(v => v !== value) } } };
    }

    // --- רשימת משתמשים ---
    case 'ADD_USER':
      if (action.payload.email?.toLowerCase() === OWNER_EMAIL) return state;
      return { ...state, users: [...state.users, action.payload] };
    case 'DELETE_USER':
      if (action.payload === OWNER_USER.id || action.payload?.toLowerCase?.() === OWNER_EMAIL) return state;
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
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

    // --- עדכון entity בודד מ-Realtime (הוספה/עדכון) ---
    case 'LOAD_ONE': {
      const { key, data } = action.payload;
      // ישות גרנולרית (prefix__id)
      const prefixEntry = Object.entries(PREFIX_TO_STATE_KEY)
        .find(([prefix]) => key.startsWith(prefix));
      if (prefixEntry) {
        const [, stateKey] = prefixEntry;
        const arr = state[stateKey] || [];
        const idx = arr.findIndex(item => item?.id === data?.id);
        const newArr = idx >= 0
          ? arr.map((item, i) => i === idx ? data : item)
          : [...arr, data];
        return { ...state, [stateKey]: newArr };
      }
      // ישות scalar (settings, users, statusConfig, roleConfig)
      const scalarStateKey = DB_TO_STATE_KEY[key];
      if (!scalarStateKey) return state;
      return { ...state, [scalarStateKey]: data };
    }

    // --- מחיקת entity בודד מ-Realtime ---
    case 'LOAD_ONE_DELETED': {
      const { key } = action.payload;
      const prefixEntry = Object.entries(PREFIX_TO_STATE_KEY)
        .find(([prefix]) => key.startsWith(prefix));
      if (!prefixEntry) return state;
      const [prefix, stateKey] = prefixEntry;
      const itemId = key.slice(prefix.length);
      return {
        ...state,
        [stateKey]: (state[stateKey] || []).filter(item => item?.id !== itemId),
      };
    }

    // --- טעינה מ-Supabase (payload ממופה לפי stateKey) ---
    case 'LOAD_ALL': {
      const p = action.payload;
      const users = ensureOwnerExists(p.users ?? state.users);
      const rawCurrentUser = state.currentUser;
      const currentUser = rawCurrentUser
        ? (users.find(u => u.id === rawCurrentUser.id) || rawCurrentUser)
        : null;
      return {
        ...state,
        customers:       p.customers       ?? state.customers,
        devices:         p.devices         ?? state.devices,
        repairs:         p.repairs         ?? state.repairs,
        parts:           p.parts           ?? state.parts,
        stockBatches:    p.stockBatches    ?? state.stockBatches,
        suppliers:       p.suppliers       ?? state.suppliers,
        purchaseOrders:  p.purchaseOrders  ?? state.purchaseOrders,
        generalExpenses: p.generalExpenses ?? state.generalExpenses,
        workCatalog:     p.workCatalog     ?? state.workCatalog,
        services:        p.services        ?? state.services,
        technicians:     p.technicians     ?? state.technicians,
        warrantyAppeals: p.warrantyAppeals ?? state.warrantyAppeals,
        settings:        p.settings        ?? state.settings,
        users,
        statusConfig:    p.statusConfig    ?? state.statusConfig,
        roleConfig:      p.roleConfig      ?? state.roleConfig,
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
// TOAST MESSAGES — הודעת פידבק לכל פעולה
// ============================================================
const TOAST_MESSAGES = {
  ADD_REPAIR:              (p) => ({ msg: `קריאה ${p.id} נקלטה בהצלחה`, type: 'success' }),
  UPDATE_REPAIR:           ()  => ({ msg: 'תיקון עודכן בהצלחה', type: 'success' }),
  DELETE_REPAIR:           ()  => ({ msg: 'קריאה נמחקה', type: 'success' }),
  ADD_CUSTOMER:            (p) => ({ msg: `לקוח "${p.name}" נוסף בהצלחה`, type: 'success' }),
  UPDATE_CUSTOMER:         ()  => ({ msg: 'פרטי לקוח עודכנו', type: 'success' }),
  DELETE_CUSTOMER:         ()  => ({ msg: 'לקוח נמחק', type: 'success' }),
  ADD_DEVICE:              (p) => ({ msg: `מכשיר ${p.id} נרשם בהצלחה`, type: 'success' }),
  UPDATE_DEVICE:           ()  => ({ msg: 'פרטי מכשיר עודכנו', type: 'success' }),
  ADD_PART:                (p) => ({ msg: `חלק "${p.name || p.id}" נוסף למלאי`, type: 'success' }),
  UPDATE_PART:             ()  => ({ msg: 'חלק עודכן בהצלחה', type: 'success' }),
  DELETE_PART:             ()  => ({ msg: 'חלק נמחק', type: 'success' }),
  ADD_STOCK_BATCH:         (p) => ({ msg: `אצווה ${p.id} נקלטה בהצלחה`, type: 'success' }),
  UPDATE_STOCK_BATCH:      ()  => ({ msg: 'אצווה עודכנה', type: 'success' }),
  UPDATE_STOCK_BATCHES_BULK: () => ({ msg: 'מלאי עודכן בהצלחה', type: 'success' }),
  ADD_SUPPLIER:            (p) => ({ msg: `ספק "${p.name}" נוסף`, type: 'success' }),
  UPDATE_SUPPLIER:         ()  => ({ msg: 'ספק עודכן', type: 'success' }),
  DELETE_SUPPLIER:         ()  => ({ msg: 'ספק נמחק', type: 'success' }),
  ADD_PURCHASE_ORDER:      (p) => ({ msg: `הזמנת רכש ${p.id} נוצרה`, type: 'success' }),
  UPDATE_PURCHASE_ORDER:   ()  => ({ msg: 'הזמנת רכש עודכנה', type: 'success' }),
  ADD_GENERAL_EXPENSE:     ()  => ({ msg: 'הוצאה נרשמה בהצלחה', type: 'success' }),
  UPDATE_GENERAL_EXPENSE:  ()  => ({ msg: 'הוצאה עודכנה', type: 'success' }),
  DELETE_GENERAL_EXPENSE:  ()  => ({ msg: 'הוצאה נמחקה', type: 'success' }),
  ADD_WORK_ITEM:           (p) => ({ msg: `עבודה "${p.name || p.id}" נוספה לקטלוג`, type: 'success' }),
  UPDATE_WORK_ITEM:        ()  => ({ msg: 'עבודה עודכנה בקטלוג', type: 'success' }),
  DELETE_WORK_ITEM:        ()  => ({ msg: 'עבודה נמחקה מהקטלוג', type: 'success' }),
  ADD_SERVICE:             (p) => ({ msg: `שירות "${p.name || p.id}" נוסף`, type: 'success' }),
  UPDATE_SERVICE:          ()  => ({ msg: 'שירות עודכן', type: 'success' }),
  ADD_TECHNICIAN:          (p) => ({ msg: `טכנאי "${p.name}" נוסף`, type: 'success' }),
  UPDATE_TECHNICIAN:       ()  => ({ msg: 'טכנאי עודכן', type: 'success' }),
  ADD_WARRANTY_APPEAL:     ()  => ({ msg: 'ערעור אחריות נפתח', type: 'success' }),
  UPDATE_WARRANTY_APPEAL:  ()  => ({ msg: 'ערעור אחריות עודכן', type: 'success' }),
  UPDATE_SETTINGS:         ()  => ({ msg: 'הגדרות נשמרו בהצלחה', type: 'success' }),
  ADD_USER:                (p) => ({ msg: `משתמש "${p.name}" נוסף`, type: 'success' }),
  UPDATE_USER:             ()  => ({ msg: 'פרטי משתמש עודכנו', type: 'success' }),
  DELETE_USER:             ()  => ({ msg: 'משתמש נמחק', type: 'success' }),
  ADD_STATUS:              (p) => ({ msg: `סטטוס "${p.label}" נוסף`, type: 'success' }),
  UPDATE_STATUS:           ()  => ({ msg: 'סטטוס עודכן', type: 'success' }),
  DELETE_STATUS:           ()  => ({ msg: 'סטטוס נמחק', type: 'success' }),
  SET_CURRENT_USER:        (p) => ({ msg: `ברוך הבא, ${p?.name || ''}`, type: 'success' }),
  LOGOUT:                  ()  => ({ msg: 'התנתקת מהמערכת', type: 'info' }),
};

// מיפוי: action → מפתח ה-storage שנשמר אחריו (לאימות שמירה אמיתי)
const ACTION_TO_STORAGE_KEY = {
  ADD_REPAIR: storageKeys.REPAIRS,              UPDATE_REPAIR: storageKeys.REPAIRS,
  DELETE_REPAIR: storageKeys.REPAIRS,           ADD_CUSTOMER: storageKeys.CUSTOMERS,
  UPDATE_CUSTOMER: storageKeys.CUSTOMERS,       DELETE_CUSTOMER: storageKeys.CUSTOMERS,
  ADD_DEVICE: storageKeys.DEVICES,              UPDATE_DEVICE: storageKeys.DEVICES,
  ADD_PART: storageKeys.PARTS,                  UPDATE_PART: storageKeys.PARTS,
  DELETE_PART: storageKeys.PARTS,               ADD_STOCK_BATCH: storageKeys.STOCK_BATCHES,
  UPDATE_STOCK_BATCH: storageKeys.STOCK_BATCHES, UPDATE_STOCK_BATCHES_BULK: storageKeys.STOCK_BATCHES,
  ADD_SUPPLIER: storageKeys.SUPPLIERS,          UPDATE_SUPPLIER: storageKeys.SUPPLIERS,
  DELETE_SUPPLIER: storageKeys.SUPPLIERS,       ADD_PURCHASE_ORDER: storageKeys.PURCHASE_ORDERS,
  UPDATE_PURCHASE_ORDER: storageKeys.PURCHASE_ORDERS, ADD_GENERAL_EXPENSE: storageKeys.GENERAL_EXPENSES,
  UPDATE_GENERAL_EXPENSE: storageKeys.GENERAL_EXPENSES, DELETE_GENERAL_EXPENSE: storageKeys.GENERAL_EXPENSES,
  ADD_WORK_ITEM: storageKeys.WORK_CATALOG,      UPDATE_WORK_ITEM: storageKeys.WORK_CATALOG,
  DELETE_WORK_ITEM: storageKeys.WORK_CATALOG,   ADD_SERVICE: storageKeys.SERVICES,
  UPDATE_SERVICE: storageKeys.SERVICES,         ADD_TECHNICIAN: storageKeys.TECHNICIANS,
  UPDATE_TECHNICIAN: storageKeys.TECHNICIANS,   ADD_WARRANTY_APPEAL: storageKeys.WARRANTY_APPEALS,
  UPDATE_WARRANTY_APPEAL: storageKeys.WARRANTY_APPEALS, UPDATE_SETTINGS: storageKeys.SETTINGS,
  ADD_USER: storageKeys.USERS,                  UPDATE_USER: storageKeys.USERS,
  DELETE_USER: storageKeys.USERS,               ADD_STATUS: storageKeys.STATUS_CONFIG,
  UPDATE_STATUS: storageKeys.STATUS_CONFIG,     DELETE_STATUS: storageKeys.STATUS_CONFIG,
  SET_CURRENT_USER: storageKeys.CURRENT_USER,
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
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const initializedRef = useRef(false);
  const pendingSavesRef = useRef(new Set());
  const pendingToastRef = useRef(null); // { storageKey, message, type, duration }
  // עוקב אחרי הערך הקודם של כל ישות גרנולרית — לחישוב ה-diff לפני שמירה
  const prevGranularRef = useRef({});
  const flushTimerRef = useRef(null);
  const flushingRef = useRef(false);
  // עוקב אחרי ה-state העדכני — לשימוש בג'וב רקע (מיגרציית תמונות) בלי ליצור תלות ב-state
  const stateRef = useRef(state);
  stateRef.current = state;
  const migratingImagesRef = useRef(false);
  const { showToast } = useToast();

  // רענון ספירת הפריטים הממתינים לסנכרון (לחיווי בהדר)
  const refreshPending = useCallback(() => setPendingSyncCount(syncQueueSize()), []);

  // ניסיון חוזר להעלאת תמונות שנתקעו כ-base64 מקומי (ראה imageMigration.js)
  const runImageMigration = useCallback(async () => {
    if (!isSupabaseConfigured() || migratingImagesRef.current) return;
    if (!hasPendingBase64(stateRef.current)) return;
    migratingImagesRef.current = true;
    try {
      await migratePendingImages(stateRef.current, dispatch);
    } catch (e) {
      console.error('Image migration error:', e);
    } finally {
      migratingImagesRef.current = false;
    }
  }, [dispatch]);

  // כתיבה בודדת לענן (upsert/delete). מחזיר true אם הצליחה.
  const attemptWrite = useCallback(async (dbKey, entry) => {
    if (!supabase) return false;
    pendingSavesRef.current.add(dbKey);
    try {
      let error;
      if (entry.op === 'delete') {
        ({ error } = await supabase.from('lab_data').delete().eq('key', dbKey));
      } else {
        ({ error } = await supabase.from('lab_data').upsert(
          { key: dbKey, data: entry.data, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ));
      }
      if (error) { console.error(`Sync write error [${dbKey}]:`, error); setIsOffline(true); return false; }
      return true;
    } catch (e) {
      console.error(`Sync write exception [${dbKey}]:`, e);
      setIsOffline(true);
      return false;
    } finally {
      // השאר את המפתח ב-pendingSaves עוד רגע כדי להתעלם מה-echo של הכתיבה שלנו עצמנו
      setTimeout(() => pendingSavesRef.current.delete(dbKey), 1200);
    }
  }, []);

  // מרוקן את התור — מנסה לכתוב כל פריט ממתין; מסיר רק מה שהצליח
  const flushQueue = useCallback(async () => {
    if (!supabase || flushingRef.current) return;
    const q = getSyncQueue();
    const keys = Object.keys(q);
    if (keys.length === 0) return;
    flushingRef.current = true;
    let allOk = true;
    try {
      for (const dbKey of keys) {
        const entry = q[dbKey];
        const ok = await attemptWrite(dbKey, entry);
        if (ok) dequeueSync(dbKey, entry.ts);
        else allOk = false;
        refreshPending();
      }
    } finally {
      flushingRef.current = false;
    }
    refreshPending();
    if (allOk && syncQueueSize() === 0) setIsOffline(false);
  }, [attemptWrite, refreshPending]);

  // רישום שינוי לתור (סינכרוני, עמיד) + תזמון flush עם debounce
  const scheduleFlush = useCallback(() => {
    refreshPending();
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => { flushQueue(); }, 500);
  }, [flushQueue, refreshPending]);

  // טעינה ראשונית מ-Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    loadAllFromDB().then(dbData => {
      if (dbData && Object.keys(dbData).length > 0) {
        // שלב את התור המקומי מעל נתוני הענן — שינוי שממתין לסנכרון לא יידרס ע"י גרסה ישנה מהענן
        const queue = getSyncQueue();
        const queuedKeys = Object.keys(queue);
        if (queuedKeys.length > 0) {
          Object.entries(GRANULAR_ENTITIES).forEach(([stateKey, prefix]) => {
            let arr = Array.isArray(dbData[stateKey]) ? [...dbData[stateKey]] : [];
            queuedKeys.filter(k => k.startsWith(prefix)).forEach(k => {
              const { op, data } = queue[k];
              const id = k.slice(prefix.length);
              arr = arr.filter(item => String(item?.id) !== id);
              if (op !== 'delete' && data) arr.push(data);
            });
            dbData[stateKey] = arr;
          });
          Object.entries(STATE_TO_DB_KEY).forEach(([stateKey, dbKey]) => {
            if (queue[dbKey] && queue[dbKey].op !== 'delete') dbData[stateKey] = queue[dbKey].data;
          });
        }
        // Supabase מכיל נתונים — טען אותם ואתחל את prevGranularRef
        Object.keys(GRANULAR_ENTITIES).forEach(stateKey => {
          if (dbData[stateKey]) prevGranularRef.current[stateKey] = dbData[stateKey];
        });
        dispatch({ type: 'LOAD_ALL', payload: dbData });
        // דחוף את מה שנשאר בתור (שינויים שלא סונכרנו) לענן
        if (queuedKeys.length > 0) setTimeout(() => flushQueue(), 100);
      } else {
        // ראשון פעם — מגרר נתונים קיימים מ-localStorage ל-Supabase
        const snapshot = {};
        Object.keys(GRANULAR_ENTITIES).forEach(stateKey => {
          if (Array.isArray(state[stateKey])) snapshot[stateKey] = state[stateKey];
        });
        Object.entries(STATE_TO_DB_KEY).forEach(([stateKey]) => {
          if (state[stateKey] !== undefined) snapshot[stateKey] = state[stateKey];
        });
        // אתחל prevGranularRef עם הנתונים הנוכחיים כדי שהdiff הראשון יהיה נקי
        Object.keys(GRANULAR_ENTITIES).forEach(stateKey => {
          prevGranularRef.current[stateKey] = state[stateKey] || [];
        });
        if (Object.keys(snapshot).length > 0) saveAllToDB(snapshot);
      }
      initializedRef.current = true;
      setDbLoading(false);
      // נסה להעלות מחדש תמונות שנתקעו מקומית (רק אחרי שהטעינה הראשונית הסתיימה)
      setTimeout(() => runImageMigration(), 2000);
    }).catch(() => {
      // אין חיבור לשרת בטעינה — נשארים עם הנתונים המקומיים (גיבוי localStorage) ומסמנים אופליין
      setIsOffline(true);
      initializedRef.current = true;
      setDbLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ניטור חיבור + ניסיונות חוזרים — כל עוד יש פריטים בתור, נסה לדחוף אותם לענן
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false && syncQueueSize() > 0) setIsOffline(true);
    const handleOnline = () => { flushQueue(); runImageMigration(); };
    const handleOffline = () => { if (syncQueueSize() > 0) setIsOffline(true); };
    // בהסתרת/סגירת הטאב (נעילת מסך, מעבר אפליקציה) — נסה לדחוף מיד את מה שבתור
    const handleHide = () => { if (document.visibilityState === 'hidden') flushQueue(); };
    // ניסיון חוזר תקופתי כל עוד יש פריטים בתור
    const retry = setInterval(() => { if (syncQueueSize() > 0) flushQueue(); }, 15000);
    // ניסיון חוזר תקופתי (איטי יותר) להעלאת תמונות שנתקעו מקומית
    const imageRetry = setInterval(() => runImageMigration(), 60000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleHide);
    window.addEventListener('pagehide', handleHide);
    return () => {
      clearInterval(retry);
      clearInterval(imageRetry);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleHide);
      window.removeEventListener('pagehide', handleHide);
    };
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
          if (payload.eventType === 'DELETE') {
            const key = payload.old?.key;
            // התעלם אם זו הכתיבה שלנו, או אם יש לנו שינוי מקומי שממתין לסנכרון עבור מפתח זה
            if (key && !pendingSavesRef.current.has(key) && !hasPendingSync(key)) {
              dispatch({ type: 'LOAD_ONE_DELETED', payload: { key } });
            }
            return;
          }
          if (payload.new?.key && payload.new?.data !== undefined) {
            if (!pendingSavesRef.current.has(payload.new.key) && !hasPendingSync(payload.new.key)) {
              dispatch({ type: 'LOAD_ONE', payload: { key: payload.new.key, data: payload.new.data } });
            }
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // שמירה גרנולרית — מחשב diff ורושם כל שינוי לתור העמיד *מיד* (סינכרוני),
  // כך שגם אם הטאב יושהה/הרשת תיפול — הנתון כבר שמור וייכתב לענן בניסיון הבא.
  const scheduleGranularSave = useCallback((stateKey, newItems) => {
    if (!isSupabaseConfigured() || !initializedRef.current) return;
    const prefix = GRANULAR_ENTITIES[stateKey];
    if (!prefix) return;

    const prevItems = prevGranularRef.current[stateKey] || [];
    prevGranularRef.current[stateKey] = newItems; // עדכן מיד לdiff הבא

    const prevMap = new Map((prevItems || []).filter(i => i?.id != null).map(i => [String(i.id), i]));
    const newMap = new Map((newItems || []).filter(i => i?.id != null).map(i => [String(i.id), i]));

    let changed = false;
    // פריטים שנוספו או שונו → רישום upsert לתור
    for (const [id, item] of newMap) {
      const prev = prevMap.get(id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
        enqueueSync(`${prefix}${id}`, item, 'upsert');
        changed = true;
      }
    }
    // פריטים שנמחקו → רישום delete לתור
    for (const [id] of prevMap) {
      if (!newMap.has(id)) {
        enqueueSync(`${prefix}${id}`, null, 'delete');
        changed = true;
      }
    }
    if (changed) scheduleFlush();
  }, [scheduleFlush]);

  // שמירה: localStorage מיידי (רשת ביטחון) + רישום scalar לתור העמיד לענן
  const scheduleSave = useCallback((storageKey, value, dbKey) => {
    // תמיד שומרים ב-localStorage — כך נתונים שורדים גם אם השרת לא זמין.
    const saved = saveToStorage(storageKey, value);

    // הצג טוסט אם זו השמירה הרלוונטית לפעולה האחרונה
    const pending = pendingToastRef.current;
    if (pending && pending.storageKey === storageKey) {
      pendingToastRef.current = null;
      if (saved) {
        showToast(pending.message, pending.type, pending.duration || 2000);
      } else {
        showToast('שגיאה: הנתונים לא נשמרו — נסה שנית', 'error', 4000);
      }
    }

    if (dbKey && isSupabaseConfigured() && initializedRef.current) {
      enqueueSync(dbKey, value, 'upsert');
      scheduleFlush();
    }
  }, [showToast, scheduleFlush]);

  // ישויות גרנולריות — localStorage + שמירה גרנולרית לSupabase
  useEffect(() => { scheduleSave(storageKeys.CUSTOMERS, state.customers, null); scheduleGranularSave('customers', state.customers); }, [state.customers, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.DEVICES, state.devices, null); scheduleGranularSave('devices', state.devices); }, [state.devices, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.REPAIRS, state.repairs, null); scheduleGranularSave('repairs', state.repairs); }, [state.repairs, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.PARTS, state.parts, null); scheduleGranularSave('parts', state.parts); }, [state.parts, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.STOCK_BATCHES, state.stockBatches, null); scheduleGranularSave('stockBatches', state.stockBatches); }, [state.stockBatches, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.SUPPLIERS, state.suppliers, null); scheduleGranularSave('suppliers', state.suppliers); }, [state.suppliers, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.PURCHASE_ORDERS, state.purchaseOrders, null); scheduleGranularSave('purchaseOrders', state.purchaseOrders); }, [state.purchaseOrders, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.GENERAL_EXPENSES, state.generalExpenses, null); scheduleGranularSave('generalExpenses', state.generalExpenses); }, [state.generalExpenses, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.WORK_CATALOG, state.workCatalog, null); scheduleGranularSave('workCatalog', state.workCatalog); }, [state.workCatalog, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.SERVICES, state.services, null); scheduleGranularSave('services', state.services); }, [state.services, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.TECHNICIANS, state.technicians, null); scheduleGranularSave('technicians', state.technicians); }, [state.technicians, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.WARRANTY_APPEALS, state.warrantyAppeals, null); scheduleGranularSave('warrantyAppeals', state.warrantyAppeals); }, [state.warrantyAppeals, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.SETTINGS, state.settings, STATE_TO_DB_KEY.settings); }, [state.settings, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.CURRENT_USER, state.currentUser, null); }, [state.currentUser, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.USERS, state.users, null); scheduleGranularSave('users', state.users); }, [state.users, scheduleSave, scheduleGranularSave]);
  useEffect(() => { scheduleSave(storageKeys.STATUS_CONFIG, state.statusConfig, STATE_TO_DB_KEY.statusConfig); }, [state.statusConfig, scheduleSave]);
  useEffect(() => { scheduleSave(storageKeys.ROLE_CONFIG, state.roleConfig, STATE_TO_DB_KEY.roleConfig); }, [state.roleConfig, scheduleSave]);

  const loggedDispatch = useCallback((action) => {
    dispatch(action);
    const entry = buildLogEntry(action, state.currentUser, state);
    if (entry) appendLog(entry);

    // הכן טוסט — יופיע לאחר אימות שמירה ב-localStorage
    const toastFn = TOAST_MESSAGES[action.type];
    if (toastFn) {
      const { msg, type } = toastFn(action.payload);
      const storageKey = ACTION_TO_STORAGE_KEY[action.type];
      if (storageKey) {
        // המתן לאישור שמירה ב-scheduleSave
        pendingToastRef.current = { storageKey, message: msg, type };
      } else {
        // פעולות ללא storage (LOGOUT) — הצג מיד
        showToast(msg, type);
      }
    }
  }, [dispatch, state, showToast]);

  if (dbLoading) {
    return (
      <div className="h-screen bg-slate-50 flex overflow-hidden" dir="rtl">
        {/* סיידבר skeleton */}
        <div className="hidden lg:flex w-56 shrink-0 bg-slate-900 flex-col p-4 gap-3">
          <div className="skeleton rounded-lg h-9 w-full opacity-30 mb-2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton rounded-lg h-8 w-full opacity-20" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        {/* תוכן skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <div className="skeleton rounded-lg h-8 w-8" />
            <div className="skeleton rounded-lg h-8 w-24" />
            <div className="flex-1" />
            <div className="skeleton rounded-lg h-8 w-8" />
            <div className="skeleton rounded-lg h-8 w-8" />
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton rounded-xl h-24" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className="skeleton rounded-xl h-64 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton rounded-lg h-12 w-full" style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          </div>
        </div>
        {/* אינדיקטור טעינה */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span>טוען נתונים...</span>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch: loggedDispatch, isOffline, pendingSyncCount }}>
      {isOffline && <OfflineBanner />}
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
