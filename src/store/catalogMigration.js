// ============================================================
// מיגרציה חד-פעמית: בונה קטלוג יצרנים/דגמים מנתונים קיימים —
// מכשירים שכבר נקלטו, ומ-compatible_devices של חלקים ועבודות.
// רצה פעם אחת בלבד (מוגנת ע"י settings.catalogMigrated).
// ============================================================
import { generateManufacturerId, generateModelId } from '../utils/idGenerators';
import { getWorkCompatibleDevices } from '../utils/workCatalog';

const norm = (s) => (s || '').trim().toLowerCase();

export const buildCatalogFromExisting = (state) => {
  const manufacturers = [];
  const models = [];
  const mfgByName = new Map();
  const modelByKey = new Map();

  const getOrCreateManufacturer = (name) => {
    const key = norm(name);
    if (!key) return null;
    if (mfgByName.has(key)) return mfgByName.get(key);
    const mfg = { id: generateManufacturerId(manufacturers.map(m => m.id)), name: name.trim() };
    manufacturers.push(mfg);
    mfgByName.set(key, mfg);
    return mfg;
  };

  const getOrCreateModel = (mfg, modelName, deviceType) => {
    if (!mfg || !modelName) return null;
    const key = `${mfg.id}::${norm(modelName)}`;
    if (modelByKey.has(key)) {
      const existing = modelByKey.get(key);
      if (!existing.device_type && deviceType) existing.device_type = deviceType;
      return existing;
    }
    const model = {
      id: generateModelId(models.map(m => m.id)),
      manufacturer_id: mfg.id,
      name: modelName.trim(),
      device_type: deviceType || '',
      images: [],
      main_image_index: 0,
    };
    models.push(model);
    modelByKey.set(key, model);
    return model;
  };

  // 1. ממכשירים קיימים — brand/model/type
  (state.devices || []).forEach(d => {
    if (!d.brand) return;
    const mfg = getOrCreateManufacturer(d.brand);
    if (d.model) getOrCreateModel(mfg, d.model, d.type);
  });

  // 2. מ-compatible_devices של חלקים
  (state.parts || []).forEach(p => {
    (p.compatible_devices || []).forEach(cd => {
      if (!cd?.brand) return;
      const mfg = getOrCreateManufacturer(cd.brand);
      if (cd.model) getOrCreateModel(mfg, cd.model);
    });
  });

  // 3. מ-compatible_devices של עבודות (כולל תאימות לאחור ל-brand/model בודדים)
  (state.workCatalog || []).forEach(w => {
    getWorkCompatibleDevices(w).forEach(cd => {
      if (!cd?.brand) return;
      const mfg = getOrCreateManufacturer(cd.brand);
      if (cd.model) getOrCreateModel(mfg, cd.model);
    });
  });

  return { manufacturers, models };
};
