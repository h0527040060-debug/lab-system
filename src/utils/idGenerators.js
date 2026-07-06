// יוצר ID לפי הסכמה של האפיון
// פורמטים:
// CUST-XXXX (לקוח)
// DEV-XXXX (מכשיר - קבוע!)
// QR_YYYYMMDD_XXX (תיקון - לכל ביקור)
// PO-XXX (הזמנת רכש)
// BR-CAT-XXX (ברקוד פנימי חלק)
// W-XXX (קוד עבודה)
// BATCH-XXX (אצווה)

export const generateCustomerId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('CUST-'))
    .map(id => parseInt(id.replace('CUST-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `CUST-${String(next).padStart(4, '0')}`;
};

export const generateDeviceId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('DEV-'))
    .map(id => parseInt(id.replace('DEV-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `DEV-${String(next).padStart(4, '0')}`;
};

export const generateRepairId = (existingIds = []) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todaysIds = existingIds
    .filter(id => id?.startsWith(`QR_${dateStr}_`))
    .map(id => parseInt(id.split('_')[2]))
    .filter(n => !isNaN(n));
  let next = todaysIds.length > 0 ? Math.max(...todaysIds) + 1 : 1;
  // ערובה לייחודיות — דלג על IDים תפוסים
  const existingSet = new Set(existingIds);
  while (existingSet.has(`QR_${dateStr}_${String(next).padStart(3, '0')}`)) next++;
  return `QR_${dateStr}_${String(next).padStart(3, '0')}`;
};

export const generatePurchaseOrderId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('PO-'))
    .map(id => parseInt(id.replace('PO-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `PO-${String(next).padStart(3, '0')}`;
};

export const generateInternalBarcode = (category, existingBarcodes = []) => {
  // category לדוגמה: 'sensor', 'heating'
  const prefix = `BR-${category.toUpperCase().slice(0, 4)}-`;
  const numbers = existingBarcodes
    .filter(bc => bc?.startsWith(prefix))
    .map(bc => parseInt(bc.replace(prefix, '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

export const generateWorkCodeId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('W-'))
    .map(id => parseInt(id.replace('W-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `W-${String(next).padStart(3, '0')}`;
};

export const generateBatchId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('BATCH-'))
    .map(id => parseInt(id.replace('BATCH-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `BATCH-${String(next).padStart(4, '0')}`;
};

export const generateManufacturerId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('MFG-'))
    .map(id => parseInt(id.replace('MFG-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `MFG-${String(next).padStart(4, '0')}`;
};

export const generateModelId = (existingIds = []) => {
  const numbers = existingIds
    .filter(id => id?.startsWith('MDL-'))
    .map(id => parseInt(id.replace('MDL-', '')))
    .filter(n => !isNaN(n));
  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `MDL-${String(next).padStart(4, '0')}`;
};

// מציע מספר קצר (עד 4 ספרות) לחריטה על המכשיר — ייחודי מול המספרים הקיימים
export const generateEngravingNumber = (existingDevices = []) => {
  const existingSerials = new Set(
    existingDevices.map(d => d.manufacturer_serial).filter(Boolean)
  );
  let candidate;
  do {
    candidate = String(Math.floor(Math.random() * 10000));
  } while (existingSerials.has(candidate));
  return candidate;
};
