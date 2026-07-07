// בודק האם חלק מתאים למכשיר נתון — ריק = תואם לכולם (מקביל ל-isWorkCompatibleWithDevice ב-workCatalog.js)
export const isPartCompatibleWithDevice = (part, device) => {
  const cd = part.compatible_devices;
  if (!cd || cd.length === 0) return true;
  if (!device?.brand || !device?.model) return true;
  return cd.some(
    d => d.brand?.toLowerCase() === device.brand?.toLowerCase() &&
         d.model?.toLowerCase() === device.model?.toLowerCase()
  );
};

// מסנן רשימת חלקים לחלקים התואמים למכשיר נתון (או כלליים)
export const filterPartsForDevice = (parts, device) =>
  parts.filter(p => isPartCompatibleWithDevice(p, device));

// בודק שיוך מפורש בלבד — בניגוד ל-isPartCompatibleWithDevice, ריק = לא משויך (לא "מתאים לכולם").
// משמש בתצוגת "חלקים מתאימים" של מכשיר ספציפי, כדי שחלקים כלליים (המיועדים לאבחון/עבודה בלבד)
// לא יופיעו מאחורי כל מכשיר.
export const isPartAssignedToDevice = (part, device) => {
  const cd = part.compatible_devices;
  if (!cd || cd.length === 0) return false;
  if (!device?.brand || !device?.model) return false;
  return cd.some(
    d => d.brand?.toLowerCase() === device.brand?.toLowerCase() &&
         d.model?.toLowerCase() === device.model?.toLowerCase()
  );
};
