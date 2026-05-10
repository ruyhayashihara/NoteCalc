import { X, Trash2, Clock, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useHistory, HistoryEntry } from '../contexts/HistoryContext';

interface HistoryModalProps {
  onRestore: (content: string) => void;
  onClose: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec  = Math.floor(diffMs / 1000);
  const diffMin  = Math.floor(diffSec  / 60);
  const diffHour = Math.floor(diffMin  / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffSec  < 60)  return 'Just now';
  if (diffMin  < 60)  return `${diffMin}m ago`;
  if (diffHour < 24)  return `${diffHour}h ago`;
  if (diffDay  < 7)   return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function HistoryModal({ onRestore, onClose }: HistoryModalProps) {
  const { theme } = useTheme();
  const { history, clearHistory } = useHistory();

  const handleRestore = (entry: HistoryEntry) => {
    onRestore(entry.content);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl flex flex-col"
        style={{ backgroundColor: theme.colors.surface, maxHeight: '72vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: theme.colors.primary }} />
            <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>
              History
            </h3>
            {history.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
              >
                {history.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#ef4444', backgroundColor: '#ef444415' }}
              >
                <Trash2 size={13} />
                Clear all
              </button>
            )}
            <button onClick={onClose} style={{ color: theme.colors.textSecondary }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: theme.colors.textSecondary }}>
              <Clock size={36} className="opacity-20" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs opacity-60">Saved tapes will appear here</p>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-3 rounded-xl gap-3 transition-colors"
                style={{ backgroundColor: theme.colors.keyDefault }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold truncate" style={{ color: theme.colors.text }}>
                      {entry.title || 'Untitled'}
                    </span>
                    <span className="text-xs shrink-0" style={{ color: theme.colors.textSecondary }}>
                      {formatRelativeTime(new Date(entry.timestamp))}
                    </span>
                  </div>
                  <pre
                    className="text-xs leading-relaxed truncate"
                    style={{
                      color: theme.colors.textSecondary,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entry.content.split('\n').slice(0, 2).join(' · ')}
                  </pre>
                  <span
                    className="text-xs font-bold mt-1 block"
                    style={{ color: theme.colors.primary }}
                  >
                    Total: {entry.total.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleRestore(entry)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}
                >
                  <RotateCcw size={13} />
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
