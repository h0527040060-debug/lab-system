import { supabase } from './supabase';

const BUCKET = 'lab-images';

function base64ToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadToStorage(base64DataUrl, folder = 'misc') {
  if (!supabase || !base64DataUrl?.startsWith('data:')) return base64DataUrl;
  try {
    const blob = base64ToBlob(base64DataUrl);
    const ext = blob.type.includes('png') ? 'png' : 'jpg';
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
    if (error) { console.error('Storage upload error:', error); return base64DataUrl; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('Storage upload exception:', e);
    return base64DataUrl;
  }
}

export async function deleteFromStorage(url) {
  if (!supabase || !url?.includes(`/${BUCKET}/`)) return;
  try {
    const path = url.split(`/${BUCKET}/`)[1];
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  } catch (e) {
    console.error('Storage delete exception:', e);
  }
}
