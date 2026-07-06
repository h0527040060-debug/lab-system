// ערכי "כללי" ישנים (לפני compatible_devices) — לתאימות לאחור
const WILDCARD_VALUES = ['כל היצרנים', 'כל הדגמים', 'חופשי', '(חופשי)'];

// ממיר עבודה למערך מכשירים תואמים אחיד — תומך גם בעבודות ישנות עם brand/model בודדים
export const getWorkCompatibleDevices = (work) => {
  if (Array.isArray(work.compatible_devices)) return work.compatible_devices;
  const brandIsWildcard = !work.brand || WILDCARD_VALUES.includes(work.brand);
  if (brandIsWildcard) return [];
  const modelIsWildcard = !work.model || WILDCARD_VALUES.includes(work.model);
  return [{ brand: work.brand, model: modelIsWildcard ? '' : work.model }];
};

// עבודה כללית = ריקה ממכשירים תואמים (מתאימה לכולם)
export const isWorkGeneral = (work) => getWorkCompatibleDevices(work).length === 0;

// תווית תצוגה קצרה למכשירים התואמים של העבודה
export const getWorkDeviceLabel = (work) => {
  const cd = getWorkCompatibleDevices(work);
  if (cd.length === 0) return 'כל המכשירים';
  if (cd.length === 1) return cd[0].model ? `${cd[0].brand} ${cd[0].model}` : `${cd[0].brand} (כל הדגמים)`;
  return `${cd.length} דגמים`;
};

// בודק האם עבודה מתאימה למכשיר נתון — ריק = תואם לכולם, model ריק בפריט = כל הדגמים של אותו יצרן
export const isWorkCompatibleWithDevice = (work, device) => {
  const cd = getWorkCompatibleDevices(work);
  if (cd.length === 0) return true;
  if (!device?.brand || !device?.model) return true;
  return cd.some(
    d => d.brand?.toLowerCase() === device.brand?.toLowerCase() &&
         (!d.model || d.model?.toLowerCase() === device.model?.toLowerCase())
  );
};

// מסנן קטלוג עבודות לפי יצרן ודגם של מכשיר.
export const filterWorkCatalogForDevice = (workCatalog, device) => {
  if (!device) return workCatalog;
  return workCatalog.filter(work => isWorkCompatibleWithDevice(work, device));
};

// מחשב ממוצע שעות היסטורי לקוד עבודה מתוך תיקונים שהושלמו.
export const calculateAvgHoursForWork = (workCode, repairs) => {
  const relevantRepairs = repairs.filter(r =>
    r.diagnosed_work_codes?.includes(workCode) && r.actual_hours
  );
  if (relevantRepairs.length === 0) return null;

  const totalHours = relevantRepairs.reduce((sum, r) => sum + (r.actual_hours || 0), 0);
  return {
    avg_hours: totalHours / relevantRepairs.length,
    count: relevantRepairs.length,
  };
};
