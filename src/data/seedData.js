import { REPAIR_STATUSES } from '../constants/statuses';
import { WARRANTY_TYPES } from '../constants/warranty';

// טכנאים (קבועים בשלב זה)
export const SEED_TECHNICIANS = [
  { id: 1, name: 'דוד תנעמי', hourly_cost: 100, phone: '050-0000001', is_active: true },
  { id: 2, name: 'משה פלשניסקי', hourly_cost: 120, phone: '050-0000002', is_active: true },
];

// ספקים לדוגמה
export const SEED_SUPPLIERS = [
  { id: 1, name: 'אלקטרו-חלפים בע״מ', phone: '03-1111111', contact_person: 'יוסי', email: 'yossi@electro.co.il' },
  { id: 2, name: 'יבואני ציוד מטבח', phone: '03-2222222', contact_person: 'דני', email: 'dani@import.co.il' },
  { id: 3, name: 'חלפי קירור הראל', phone: '03-3333333', contact_person: 'אבי', email: 'avi@herel.co.il' },
];

// קטלוג עבודות לדוגמה
export const SEED_WORK_CATALOG = [
  { id: 'W-001', work_name: 'החלפת מייסבים', brand: 'Dito', model: 'קוצץ ירקות', price: 1000, estimated_hours_default: 2.5, notes: '' },
  { id: 'W-002', work_name: 'החלפת מייסבים', brand: 'Dynamic', model: 'MX91', price: 500, estimated_hours_default: 1.5, notes: '' },
  { id: 'W-003', work_name: 'החלפת פחמים', brand: 'Robot Coupe', model: 'כל הדגמים', price: 180, estimated_hours_default: 0.5, notes: '' },
  { id: 'W-004', work_name: 'החלפת פחמים', brand: 'Dynamic', model: '225', price: 350, estimated_hours_default: 1.0, notes: '' },
  { id: 'W-005', work_name: 'תיקון לא מוגדר', brand: 'כל היצרנים', model: 'כל הדגמים', price: 0, estimated_hours_default: 1.0, notes: 'מחיר נקבע פר תיקון' },
];

// שירותים גנריים
export const SEED_SERVICES = [
  { id: 1, name: 'בדיקה ואבחון', base_price: 150, description: 'בדיקה כללית של מכשיר' },
  { id: 2, name: 'ניקוי מקצועי', base_price: 350, description: 'ניקוי כולל פנימי' },
  { id: 3, name: 'כיול טמפרטורה', base_price: 200, description: 'כיול חיישנים' },
];

// חלקים לדוגמה
export const SEED_PARTS = [
  {
    id: 1, name: 'NTC Thermistor 5K', manufacturer: 'Ozti', manufacturer_sku: 'NTC-5K',
    internal_barcode: 'BR-SENS-001', category: 'sensor',
    shelf: 'A3', bin: 'B2', zone: 'אלקטרוניקה',
    suppliers: [
      { supplier_id: 1, supplier_name: 'אלקטרו-חלפים בע״מ', supplier_sku: 'EL-NTC-5K', price: 150, lead_time_days: 2, is_default: true },
    ],
    min_stock: 3,
    selling_markup_percent: 50,
    images: ['🔌'],
  },
  {
    id: 2, name: 'Heating Element 3000W', manufacturer: 'Ozti', manufacturer_sku: 'HE-3000',
    internal_barcode: 'BR-HEAT-001', category: 'heating',
    shelf: 'B1', bin: 'A4', zone: 'גופי חימום',
    suppliers: [
      { supplier_id: 2, supplier_name: 'יבואני ציוד מטבח', supplier_sku: 'YCM-HE3000', price: 280, lead_time_days: 5, is_default: true },
    ],
    min_stock: 4,
    selling_markup_percent: 60,
    images: ['🔥'],
  },
];

// אצוות מלאי לדוגמה (FIFO)
export const SEED_STOCK_BATCHES = [
  { id: 'BATCH-0001', part_id: 1, received_date: '2026-04-01T10:00:00', quantity: 5, quantity_remaining: 5, supplier_name: 'אלקטרו-חלפים בע״מ', unit_cost: 150, purchase_order_id: null },
  { id: 'BATCH-0002', part_id: 2, received_date: '2026-04-15T10:00:00', quantity: 2, quantity_remaining: 2, supplier_name: 'יבואני ציוד מטבח', unit_cost: 280, purchase_order_id: null },
];

// הגדרות ברירת מחדל
export const DEFAULT_FIELD_LISTS = {
  deviceTypes: [
    'מקרר מסחרי', 'מקפיא מסחרי', 'תנור תעשייתי', 'תנור עגלה', 'מדיח כלים',
    'משטח בישול', 'גריל', 'פריטוזה', 'במרה', 'מכונת קפה', 'מיקסר', 'מעבד מזון', 'אחר',
  ],
};

export const SEED_SETTINGS = {
  business_name: 'הורוביץ - ציוד למטבחים מוסדיים',
  business_address: 'שלמה המלך 18, בני ברק',
  business_phone: '03-553-5303',
  vat_percent_display: 17, // לתצוגה בלבד במסך גביה
  alert_stuck_repair_days: 7,
  diagnostic_fee: 180,
  fieldLists: DEFAULT_FIELD_LISTS,
};

// ייצוא ריק של ה-imports כדי למנוע אזהרות
void REPAIR_STATUSES;
void WARRANTY_TYPES;
