// מסנן קטלוג עבודות לפי יצרן ודגם של מכשיר.
// מחזיר עבודות גלובליות, עבודות ליצרן ספציפי, ועבודות לדגם ספציפי.
export const filterWorkCatalogForDevice = (workCatalog, device) => {
  if (!device) return workCatalog;

  return workCatalog.filter(work => {
    if (work.brand === 'כל היצרנים' || work.brand === 'חופשי' || work.brand === '(חופשי)') {
      return true;
    }
    if (work.brand !== device.brand) return false;
    if (work.model === 'כל הדגמים' || work.model === 'חופשי' || work.model === '(חופשי)') {
      return true;
    }
    return work.model === device.model;
  });
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
