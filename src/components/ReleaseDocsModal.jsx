import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { uploadToStorage } from '../store/supabaseStorage';
import { REPAIR_STATUSES } from '../constants/statuses';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { Camera, Video, Upload, X, Check, AlertTriangle } from 'lucide-react';

export default function ReleaseDocsModal({ repair, onClose }) {
  const { state, dispatch } = useAppContext();
  const customer = state.customers.find(c => c.id === repair.customer_id);
  const device = state.devices.find(d => d.id === repair.device_id);

  const [media, setMedia] = useState([]);
  const [notes, setNotes] = useState('');
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState(null);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) return;

      if (file.size > 10 * 1024 * 1024) {
        alert(`קובץ "${file.name}" גדול מדי (מקס׳ 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const data = isVideo ? reader.result : await uploadToStorage(reader.result, 'release');
        setMedia(prev => [...prev, {
          type: isVideo ? 'video' : 'image',
          data,
          name: file.name,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (idx) => {
    setMedia(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    dispatch({
      type: 'UPDATE_REPAIR',
      payload: {
        id: repair.id,
        status: REPAIR_STATUSES.PENDING_PAYMENT,
        release_media: media,
        release_notes: notes,
        release_docs_at: new Date().toISOString(),
      }
    });
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`תיעוד תקינות - ${repair.id}`}
      subtitle={`${customer?.name} • ${device?.brand} ${device?.model}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={media.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Check size={18} />
            סיים תיעוד והעבר לגביה
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="text-blue-600 mt-0.5 shrink-0" size={18} />
          <div className="text-sm text-blue-900">
            <p className="font-bold">תיעוד תקינות חובה!</p>
            <p>העלה לפחות תמונה אחת או וידאו של המכשיר עובד תקין. זה הוכחה לפני שחרור ללקוח.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <Upload className="inline ml-1" size={16} />
            העלאת תמונה / וידאו *
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-sm px-4 py-2 rounded-lg border border-green-200">
              📁 בחר קבצים
              <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
            </label>
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1">
              📷 צלם
              <input type="file" accept="image/*" capture="environment" onChange={handleMediaUpload} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1">תמונות או וידאו עד 10MB לקובץ</p>
        </div>

        {media.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">קבצים שהועלו ({media.length}):</p>
            <div className="grid grid-cols-2 gap-2">
              {media.map((m, idx) => (
                <div key={idx} className="relative group">
                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                    {m.type === 'image' ? (
                      <img src={m.data} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={m.data} controls className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="absolute top-1 right-1 bg-white/90 rounded px-2 py-0.5 text-xs flex items-center gap-1">
                    {m.type === 'image' ? <Camera size={12} /> : <Video size={12} />}
                    {m.type === 'image' ? 'תמונה' : 'וידאו'}
                  </div>
                  <button
                    onClick={() => setConfirmDeleteMedia(idx)}
                    className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">הערות (אופציונלי)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="הערות לתיעוד..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteMedia !== null}
        title="אישור מחיקה"
        message="האם אתה בטוח שאתה רוצה למחוק את הקובץ?"
        confirmLabel="מחק"
        variant="danger"
        onConfirm={() => { removeMedia(confirmDeleteMedia); setConfirmDeleteMedia(null); }}
        onCancel={() => setConfirmDeleteMedia(null)}
      />
    </Modal>
  );
}
