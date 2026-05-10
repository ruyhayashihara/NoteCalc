import { useState, useEffect } from 'react';
import { Pencil, X, Plus } from 'lucide-react';

export interface ProgrammableButton {
  id: string;
  label: string;
  value: string;
}

const DEFAULT_BUTTONS: ProgrammableButton[] = [
  { id: '1', label: '+10%', value: '+ 10%' },
  { id: '2', label: '-10%', value: '- 10%' },
  { id: '3', label: '+IVA', value: '+ 8%' },
  { id: '4', label: 'x1.1', value: 'x 1.1' },
  { id: '5', label: '÷2',   value: '÷ 2' },
  { id: '6', label: '---',  value: '---' },
];

const STORAGE_KEY = 'notecalc-prog-buttons';

interface ProgrammableKeysProps {
  onKeyPress: (val: string) => void;
  theme: any;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  btn,
  onSave,
  onClose,
  theme,
}: {
  btn: ProgrammableButton;
  onSave: (b: ProgrammableButton) => void;
  onClose: () => void;
  theme: any;
}) {
  const [label, setLabel] = useState(btn.label);
  const [value, setValue] = useState(btn.value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-6 pb-10 space-y-4"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>
            Edit Button
          </h3>
          <button onClick={onClose} style={{ color: theme.colors.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: theme.colors.textSecondary }}>
              LABEL (shown on button)
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
              style={{
                backgroundColor: theme.colors.keyDefault,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
              placeholder="+TAX"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: theme.colors.textSecondary }}>
              VALUE (inserted into tape)
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border font-mono"
              style={{
                backgroundColor: theme.colors.keyDefault,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }}
              placeholder="+ 10%"
            />
            <p className="text-xs mt-1" style={{ color: theme.colors.textSecondary }}>
              Examples: <code>+ 10%</code> · <code>- 5%</code> · <code>x 1.08</code> · <code>---</code> · <code>Taxa = 15</code>
            </p>
          </div>
        </div>

        <button
          onClick={() => onSave({ ...btn, label: label.trim() || btn.label, value: value.trim() || btn.value })}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProgrammableKeys = ({ onKeyPress, theme }: ProgrammableKeysProps) => {
  const [buttons, setButtons] = useState<ProgrammableButton[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BUTTONS;
    } catch {
      return DEFAULT_BUTTONS;
    }
  });

  const [editing, setEditing] = useState<ProgrammableButton | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buttons));
  }, [buttons]);

  const handlePointerDown = (btn: ProgrammableButton) => {
    const timer = setTimeout(() => setEditing(btn), 600);
    setLongPressTimer(timer);
  };

  const handlePointerUp = (btn: ProgrammableButton) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = (btn: ProgrammableButton) => {
    onKeyPress(btn.value);
  };

  const handleSave = (updated: ProgrammableButton) => {
    setButtons((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditing(null);
  };

  const addButton = () => {
    if (buttons.length >= 12) return;
    const newBtn: ProgrammableButton = {
      id: Date.now().toString(),
      label: 'New',
      value: '',
    };
    setButtons((prev) => [...prev, newBtn]);
    setEditing(newBtn);
  };

  const removeButton = (id: string) => {
    setButtons((prev) => prev.filter((b) => b.id !== id));
    setEditing(null);
  };

  return (
    <>
      <div
        className="grid grid-cols-3 select-none gap-0"
        style={{ backgroundColor: theme.colors.keypadBg }}
      >
        {buttons.map((btn) => (
          <button
            key={btn.id}
            onPointerDown={(e) => { e.preventDefault(); handlePointerDown(btn); }}
            onPointerUp={() => handlePointerUp(btn)}
            onPointerLeave={() => { if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); } }}
            onClick={() => handleClick(btn)}
            className="relative flex flex-col items-center justify-center border-r border-b h-14 transition-opacity active:opacity-60"
            style={{
              backgroundColor: theme.colors.keyOperator,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          >
            <span className="text-sm font-bold font-mono">{btn.label}</span>
            <span className="absolute top-1 right-1 opacity-20">
              <Pencil size={9} />
            </span>
          </button>
        ))}

        {buttons.length < 12 && (
          <button
            onClick={addButton}
            className="flex items-center justify-center border-r border-b h-14 transition-opacity active:opacity-60"
            style={{
              backgroundColor: theme.colors.keyDefault,
              borderColor: theme.colors.border,
              color: theme.colors.textSecondary,
            }}
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {editing && (
        <EditModal
          btn={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          theme={theme}
        />
      )}
    </>
  );
};
