// ============================================================
// ניסיון חוזר להעלאת תמונות שנתקעו כ-base64 מקומי (כי ההעלאה לענן
// נכשלה בזמנו — רשת מהבהבת/ניתוק). ברגע שההעלאה מצליחה, השדה
// מתעדכן לקישור URL קצר במקום התמונה המלאה, מה שמקטין משמעותית
// את הנפח בגיבוי המקומי (localStorage).
// ============================================================
import { uploadToStorage } from './supabaseStorage';

const isBase64Image = (v) => typeof v === 'string' && v.startsWith('data:image/');

// סריקה זולה וסינכרונית — לבדוק אם יש בכלל מה לנסות, בלי async
export const hasPendingBase64 = (state) => {
  if ((state.devices || []).some(d => (d.images || []).some(isBase64Image))) return true;
  if ((state.repairs || []).some(r =>
    (r.intake_photos || []).some(isBase64Image) ||
    (r.release_media || []).some(m => m.type === 'image' && isBase64Image(m.data)) ||
    (r.warranty_appeal?.evidence_photos || []).some(isBase64Image)
  )) return true;
  if ((state.parts || []).some(p =>
    (p.images || []).some(isBase64Image) ||
    (p.assembly_instructions?.images || []).some(isBase64Image)
  )) return true;
  return false;
};

// מנסה להעלות מחדש מערך תמונות; מחזיר { changed, images } — images מוחלף רק בפריטים שהצליחו
const migrateImageArray = async (images, folder) => {
  if (!images || !images.some(isBase64Image)) return { changed: false, images };
  let changed = false;
  const next = await Promise.all(images.map(async (img) => {
    if (!isBase64Image(img)) return img;
    const url = await uploadToStorage(img, folder);
    if (url !== img) changed = true;
    return url;
  }));
  return { changed, images: next };
};

export const migratePendingImages = async (state, dispatch) => {
  // מכשירים
  for (const device of state.devices || []) {
    const { changed, images } = await migrateImageArray(device.images, 'devices');
    if (changed) dispatch({ type: 'UPDATE_DEVICE', payload: { id: device.id, images } });
  }

  // תיקונים — תמונות קליטה, תיעוד תקינות (תמונות בלבד, וידאו לא מועלה), ותמונות ערעור
  for (const repair of state.repairs || []) {
    const updates = {};

    const intake = await migrateImageArray(repair.intake_photos, 'intake');
    if (intake.changed) updates.intake_photos = intake.images;

    if ((repair.release_media || []).some(m => m.type === 'image' && isBase64Image(m.data))) {
      let mediaChanged = false;
      const nextMedia = await Promise.all((repair.release_media || []).map(async (m) => {
        if (m.type !== 'image' || !isBase64Image(m.data)) return m;
        const url = await uploadToStorage(m.data, 'release');
        if (url !== m.data) mediaChanged = true;
        return { ...m, data: url };
      }));
      if (mediaChanged) updates.release_media = nextMedia;
    }

    if (repair.warranty_appeal?.evidence_photos?.some(isBase64Image)) {
      const evidence = await migrateImageArray(repair.warranty_appeal.evidence_photos, 'appeals');
      if (evidence.changed) {
        updates.warranty_appeal = { ...repair.warranty_appeal, evidence_photos: evidence.images };
      }
    }

    if (Object.keys(updates).length > 0) {
      dispatch({ type: 'UPDATE_REPAIR', payload: { id: repair.id, ...updates } });
    }
  }

  // חלקים — תמונות מוצר + תמונות הוראות הרכבה
  for (const part of state.parts || []) {
    const updates = {};

    const main = await migrateImageArray(part.images, 'parts');
    if (main.changed) updates.images = main.images;

    if (part.assembly_instructions?.images?.some(isBase64Image)) {
      const assembly = await migrateImageArray(part.assembly_instructions.images, 'parts');
      if (assembly.changed) {
        updates.assembly_instructions = { ...part.assembly_instructions, images: assembly.images };
      }
    }

    if (Object.keys(updates).length > 0) {
      dispatch({ type: 'UPDATE_PART', payload: { id: part.id, ...updates } });
    }
  }
};
