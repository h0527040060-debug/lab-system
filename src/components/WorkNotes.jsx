import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatDateTime } from '../utils/formatters';
import { generateEntryId } from '../constants/quickRepair';
import ConfirmDialog from './ConfirmDialog';
import { MessageSquarePlus, Trash2, Pencil } from 'lucide-react';

// WorkNotes — תיבת עדכונים חופשית: כל מי שעובד על התיקון כותב כאן מה היה.
// כל עדכון נחתם בשם הכותב ובזמן, ונשאר פתוח לעריכה. השמירה אוטומטית ביציאה מהתיבה.

// גובה התיבה מתאים את עצמו לכמות הטקסט — בלי גלילה ובלי ידית שינוי גודל
const autoResizeTextarea = (el) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

// שורת עדכון קיים — state מקומי כדי שההקלדה תהיה חלקה, שמירה ב-onBlur בלבד
function NoteRow({ note, onSave, onDelete }) {
  const [text, setText] = useState(note.text);
  const textAreaRef = useRef(null);

  // סנכרון כשהעדכון משתנה מבחוץ (משתמש אחר / realtime)
  useEffect(() => { setText(note.text); }, [note.text]);
  useEffect(() => { autoResizeTextarea(textAreaRef.current); }, [text]);

  const handleBlur = () => {
    const trimmed = text.trim();
    // תיבה שרוקנה — מחזירים את המקור. מחיקה נעשית רק דרך כפתור המחיקה.
    if (!trimmed) { setText(note.text); return; }
    if (trimmed === note.text) return;
    onSave(trimmed);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 text-xs">
          <span className="font-semibold text-slate-700 truncate">{note.user_name}</span>
          <span className="text-slate-400 shrink-0">{formatDateTime(note.at)}</span>
          {note.edited_at && (
            <span className="flex items-center gap-0.5 text-slate-400 shrink-0" title={`נערך ${formatDateTime(note.edited_at)} · ${note.edited_by_name}`}>
              <Pencil size={10} /> נערך
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(note)}
          aria-label="מחק עדכון"
          className="shrink-0 text-slate-300 hover:text-red-600 p-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        className="w-full text-sm text-slate-700 bg-transparent border border-transparent hover:border-slate-200 focus:border-orange-400 rounded px-1.5 py-1 resize-none overflow-hidden focus:outline-none"
      />
    </div>
  );
}

export default function WorkNotes({ repair }) {
  const { state, dispatch } = useAppContext();
  const notes = repair.work_notes || [];
  const [draft, setDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const draftTextRef = useRef(null);

  useEffect(() => { autoResizeTextarea(draftTextRef.current); }, [draft]);

  // quiet — שמירה אוטומטית ביציאה מהתיבה, בלי טוסט ובלי להציף את יומן הפעולות.
  // התיעוד נשמר ברשומת העדכון עצמה (user_name + at).
  const save = (nextNotes) => {
    dispatch({ type: 'UPDATE_REPAIR', quiet: true, payload: { id: repair.id, work_notes: nextNotes } });
  };

  // יציאה מתיבת הטיוטה מוסיפה עדכון חדש חתום. תיבה ריקה — לא נשמרת.
  const handleDraftBlur = () => {
    const text = draft.trim();
    if (!text) { setDraft(''); return; }
    save([
      ...notes,
      {
        id: generateEntryId('NOTE'),
        at: new Date().toISOString(),
        user_id: state.currentUser?.id || '',
        user_name: state.currentUser?.name || 'מערכת',
        text,
      },
    ]);
    setDraft('');
  };

  const handleNoteSave = (note, text) => {
    save(notes.map(n => n.id === note.id ? {
      ...n,
      text,
      edited_at: new Date().toISOString(),
      edited_by_name: state.currentUser?.name || 'מערכת',
    } : n));
  };

  const handleDelete = () => {
    save(notes.filter(n => n.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquarePlus size={14} className="text-slate-500" />
        <h4 className="text-xs font-bold text-slate-600">עדכוני עבודה</h4>
        {notes.length > 0 && <span className="text-xs text-slate-400">({notes.length})</span>}
      </div>

      <div className="space-y-2">
        {notes.map(note => (
          <NoteRow
            key={note.id}
            note={note}
            onSave={(text) => handleNoteSave(note, text)}
            onDelete={setConfirmDelete}
          />
        ))}

        <textarea
          ref={draftTextRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleDraftBlur}
          rows={2}
          placeholder={notes.length === 0 ? 'מה היה? כתוב כאן עדכון — נשמר אוטומטית ביציאה מהתיבה' : 'הוסף עדכון...'}
          className="w-full text-sm border border-dashed border-slate-300 rounded-lg px-2.5 py-2 resize-none overflow-hidden
            focus:outline-none focus:border-solid focus:border-orange-400 placeholder:text-slate-400"
        />
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        variant="danger"
        title="למחוק את העדכון?"
        message={`העדכון של ${confirmDelete?.user_name} מ-${confirmDelete ? formatDateTime(confirmDelete.at) : ''} יימחק לצמיתות.`}
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
