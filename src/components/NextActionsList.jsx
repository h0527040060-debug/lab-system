import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatDate, formatDateTime, toDateInputValue } from '../utils/formatters';
import { generateEntryId } from '../constants/quickRepair';
import ConfirmDialog from './ConfirmDialog';
import { ListChecks, Check, Trash2, RotateCcw } from 'lucide-react';

// NextActionsList — שרשרת "הפעולה הבאה": טקסט חופשי + תאריך לביצוע.
// לחיצה על "בוצעה" חותמת את השורה ופותחת מיד שורה חדשה מתחתיה.
// כל השדות נשארים פתוחים לעריכה גם אחרי הביצוע, עם שמירה אוטומטית ביציאה מהתיבה.

// האם תאריך היעד עבר ועדיין לא בוצע
const isOverdue = (action) =>
  !action.done && !!action.due_date && action.due_date < toDateInputValue();

// גובה התיבה מתאים את עצמו לכמות הטקסט — בלי גלילה ובלי ידית שינוי גודל
const autoResizeTextarea = (el) => {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

// שורת פעולה קיימת — state מקומי לטקסט כדי שההקלדה תהיה חלקה
function ActionRow({ action, onPatch, onToggleDone, onDelete }) {
  const [text, setText] = useState(action.text);
  const [note, setNote] = useState(action.done_note || '');
  const textAreaRef = useRef(null);

  useEffect(() => { setText(action.text); }, [action.text]);
  useEffect(() => { setNote(action.done_note || ''); }, [action.done_note]);
  useEffect(() => { autoResizeTextarea(textAreaRef.current); }, [text]);

  const overdue = isOverdue(action);

  const handleTextBlur = () => {
    const trimmed = text.trim();
    // תיבה שרוקנה — מחזירים את המקור. מחיקה נעשית רק דרך כפתור המחיקה.
    if (!trimmed) { setText(action.text); return; }
    if (trimmed !== action.text) onPatch({ text: trimmed });
  };

  const handleNoteBlur = () => {
    if (note.trim() !== (action.done_note || '')) onPatch({ done_note: note.trim() });
  };

  return (
    <div className={`rounded-lg border p-2.5 ${
      action.done ? 'bg-slate-50 border-slate-200'
        : overdue ? 'bg-red-50 border-red-200'
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggleDone(action)}
          title={action.done ? 'בטל סימון בוצעה' : 'סמן כבוצעה'}
          aria-label={action.done ? 'בטל סימון בוצעה' : 'סמן כבוצעה'}
          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors ${
            action.done
              ? 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
              : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
          }`}
        >
          {action.done ? <RotateCcw size={12} /> : <Check size={12} />}
          {action.done ? 'בטל' : 'בוצעה'}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleTextBlur}
            rows={1}
            className={`w-full text-sm bg-transparent border border-transparent hover:border-slate-200
              focus:border-orange-400 rounded px-1.5 py-1 resize-none overflow-hidden focus:outline-none
              ${action.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}
          />

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1 text-xs text-slate-500">
              לביצוע עד:
              <input
                type="date"
                value={action.due_date || ''}
                onChange={e => onPatch({ due_date: e.target.value })}
                className={`border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-orange-400
                  ${overdue ? 'border-red-300 text-red-700 font-semibold' : 'border-slate-300 text-slate-600'}`}
              />
            </label>
            {overdue && <span className="text-xs font-bold text-red-600">באיחור</span>}
            {action.done && action.done_at && (
              <span className="text-xs text-slate-400">
                בוצע {formatDateTime(action.done_at)} · {action.done_by_name}
              </span>
            )}
          </div>

          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="הערה..."
            className="w-full text-xs text-slate-600 bg-transparent border border-transparent hover:border-slate-200
              focus:border-orange-400 rounded px-1.5 py-1 focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={() => onDelete(action)}
          aria-label="מחק פעולה"
          className="shrink-0 text-slate-300 hover:text-red-600 p-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function NextActionsList({ repair }) {
  const { state, dispatch } = useAppContext();
  const actions = repair.next_actions || [];
  const [draft, setDraft] = useState({ text: '', due_date: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const draftTextRef = useRef(null);

  useEffect(() => { autoResizeTextarea(draftTextRef.current); }, [draft.text]);

  // quiet — שמירה אוטומטית ביציאה מהתיבה, בלי טוסט ובלי להציף את יומן הפעולות.
  // התיעוד נשמר ברשומת הפעולה עצמה (created_by_name / done_by_name + חותמות זמן).
  const save = (nextActions) => {
    dispatch({ type: 'UPDATE_REPAIR', quiet: true, payload: { id: repair.id, next_actions: nextActions } });
  };

  // שמירת הטיוטה כשהמיקוד יוצא מכל שורת הטיוטה (ולא במעבר בין הטקסט לתאריך)
  const handleDraftBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    const text = draft.text.trim();
    if (!text) { setDraft({ text: '', due_date: '' }); return; }
    save([
      ...actions,
      {
        id: generateEntryId('ACT'),
        text,
        due_date: draft.due_date || '',
        done: false,
        done_at: '',
        done_by_name: '',
        done_note: '',
        created_at: new Date().toISOString(),
        created_by_name: state.currentUser?.name || 'מערכת',
      },
    ]);
    setDraft({ text: '', due_date: '' });
  };

  const patchAction = (action, patch) => {
    save(actions.map(a => a.id === action.id ? { ...a, ...patch } : a));
  };

  // סימון בוצעה חותם מי ומתי, ומיד פותח את השורה הבאה בשרשרת
  const toggleDone = (action) => {
    const nowDone = !action.done;
    save(actions.map(a => a.id === action.id ? {
      ...a,
      done: nowDone,
      done_at: nowDone ? new Date().toISOString() : '',
      done_by_name: nowDone ? (state.currentUser?.name || 'מערכת') : '',
    } : a));
    if (nowDone) {
      // הפוקוס לתיבת הפעולה הבאה — אחרי הרינדור מחדש
      setTimeout(() => draftTextRef.current?.focus(), 0);
    }
  };

  const handleDelete = () => {
    save(actions.filter(a => a.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const openCount = actions.filter(a => !a.done).length;
  const overdueCount = actions.filter(isOverdue).length;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <ListChecks size={14} className="text-slate-500" />
        <h4 className="text-xs font-bold text-slate-600">רשימת פעולות</h4>
        {openCount > 0 && <span className="text-xs text-slate-400">({openCount} פתוחות)</span>}
        {overdueCount > 0 && (
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
            {overdueCount} באיחור
          </span>
        )}
      </div>

      <div className="space-y-2">
        {actions.map(action => (
          <ActionRow
            key={action.id}
            action={action}
            onPatch={(patch) => patchAction(action, patch)}
            onToggleDone={toggleDone}
            onDelete={setConfirmDelete}
          />
        ))}

        {/* שורת הפעולה הבאה — תמיד פתוחה בתחתית השרשרת */}
        <div
          onBlur={handleDraftBlur}
          className="rounded-lg border border-dashed border-slate-300 p-2.5 focus-within:border-solid focus-within:border-orange-400"
        >
          <textarea
            ref={draftTextRef}
            value={draft.text}
            onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
            rows={1}
            placeholder="הפעולה הבאה..."
            className="w-full text-sm bg-transparent border-0 px-1.5 py-1 resize-none overflow-hidden focus:outline-none placeholder:text-slate-400"
          />
          <label className="flex items-center gap-1 text-xs text-slate-500">
            לביצוע עד:
            <input
              type="date"
              value={draft.due_date}
              onChange={e => setDraft(d => ({ ...d, due_date: e.target.value }))}
              className="border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-600 focus:outline-none focus:border-orange-400"
            />
          </label>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        variant="danger"
        title="למחוק את הפעולה?"
        message={`"${confirmDelete?.text}" תימחק לצמיתות.`}
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// תצוגת סיכום לשורת התיקון ברשימה: הפעולה הפתוחה עם תאריך היעד הקרוב ביותר
export function NextActionSummary({ repair }) {
  const actions = (repair.next_actions || []).filter(a => !a.done);
  if (actions.length === 0) return null;

  // תאריך היעד הקרוב ביותר; פעולות ללא תאריך נדחקות לסוף
  const next = [...actions].sort((a, b) =>
    (a.due_date || '9999-99-99').localeCompare(b.due_date || '9999-99-99')
  )[0];
  const overdue = isOverdue(next);

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
      <ListChecks size={12} className="shrink-0" />
      <span className="truncate">הפעולה הבאה: {next.text}</span>
      {next.due_date && <span className="shrink-0">· עד {formatDate(next.due_date)}</span>}
    </span>
  );
}
