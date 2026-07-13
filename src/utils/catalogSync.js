import { generateManufacturerId, generateModelId } from './idGenerators';

const norm = (s) => (s || '').trim().toLowerCase();

// מוצא-או-יוצר יצרן+דגם עבור מכשיר בודד (brand/model/type) — בלי לדרוס קטלוג קיים.
// שימוש כפול: (1) בתוך ADD_DEVICE/UPDATE_DEVICE — סנכרון תמידי לכל מכשיר עתידי,
// (2) ב-SYNC_DEVICE_CATALOG_BACKFILL — השלמה חד-פעמית ממכשירים קיימים.
// התאמת שם יצרן/דגם אינה רגישה לרישיות, כדי שלא ליצור כפילות ("robot coupe" מול "Robot Coupe").
// device_type מאומץ כקטגוריה רק אם הוא ברשימת deviceTypes תקנית ושונה משם הדגם —
// אחרת נוצרת כפילות מטרידה בתצוגה (קטגוריה = שם הדגם), בדיוק כמו ב-catalogMigration.js.
export function mergeDeviceIntoCatalog(manufacturers, models, deviceTypes, { brand, model, type } = {}) {
  const b = (brand || '').trim();
  const m = (model || '').trim();
  if (!b || !m) return { manufacturers, models, changed: false };

  let changed = false;
  let mfg = manufacturers.find(x => norm(x.name) === norm(b));
  let nextManufacturers = manufacturers;
  if (!mfg) {
    mfg = { id: generateManufacturerId(manufacturers.map(x => x.id)), name: b };
    nextManufacturers = [...manufacturers, mfg];
    changed = true;
  }

  let nextModels = models;
  const existing = models.find(x => x.manufacturer_id === mfg.id && norm(x.name) === norm(m));
  if (!existing) {
    const cleanTypes = (deviceTypes || []).map(t => t.trim());
    const rawType = (type || '').trim();
    const cleanType = cleanTypes.includes(rawType) && norm(rawType) !== norm(m) ? rawType : '';
    nextModels = [...models, {
      id: generateModelId(models.map(x => x.id)),
      manufacturer_id: mfg.id,
      name: m,
      device_type: cleanType,
      images: [],
      main_image_index: 0,
    }];
    changed = true;
  }

  return { manufacturers: nextManufacturers, models: nextModels, changed };
}
