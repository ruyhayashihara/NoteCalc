import { X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeName } from '../contexts/ThemeContext';

const THEME_PREVIEWS: Record<ThemeName, { bg: string; key: string; accent: string; label: string }> = {
  light:    { bg: '#f2f3f5', key: '#b6c7d5', accent: '#2563eb', label: 'Light' },
  dark:     { bg: '#1a1a2e', key: '#4b5563', accent: '#60a5fa', label: 'Dark' },
  midnight: { bg: '#0d1117', key: '#30363d', accent: '#58a6ff', label: 'Midnight' },
  ocean:    { bg: '#0a1628', key: '#1e3a5f', accent: '#38bdf8', label: 'Ocean' },
  forest:   { bg: '#1a2e1a', key: '#2d4a2d', accent: '#4ade80', label: 'Forest' },
  sunset:   { bg: '#2d1b0e', key: '#4a2c1a', accent: '#fb923c', label: 'Sunset' },
  minimal:  { bg: '#fafafa', key: '#e5e7eb', accent: '#111827', label: 'Minimal' },
  retro:    { bg: '#2c1810', key: '#6b4226', accent: '#daa520', label: 'Retro' },
};

interface ThemeModalProps {
  onClose: () => void;
}

export function ThemeModal({ onClose }: ThemeModalProps) {
  const { theme, themeName, setTheme, availableThemes } = useTheme();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-5 pb-10"
        style={{ backgroundColor: theme.colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: theme.colors.text }}>
            Choose Theme
          </h3>
          <button onClick={onClose} style={{ color: theme.colors.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-4 gap-3">
          {availableThemes.map((t) => {
            const preview = THEME_PREVIEWS[t];
            const isActive = t === themeName;
            return (
              <button
                key={t}
                onClick={() => { setTheme(t); }}
                className="flex flex-col items-center gap-2 group"
              >
                {/* Mini calculator preview */}
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden relative transition-transform group-active:scale-95"
                  style={{
                    backgroundColor: preview.bg,
                    border: isActive ? `2px solid ${preview.accent}` : `2px solid transparent`,
                    boxShadow: isActive ? `0 0 0 2px ${preview.accent}40` : 'none',
                  }}
                >
                  {/* Mock key rows */}
                  <div className="absolute inset-2 flex flex-col gap-1">
                    {[0, 1, 2].map(row => (
                      <div key={row} className="flex gap-1 flex-1">
                        {[0, 1, 2].map(col => (
                          <div
                            key={col}
                            className="flex-1 rounded-sm"
                            style={{
                              backgroundColor: col === 2 && row === 2
                                ? preview.accent
                                : preview.key,
                              opacity: 0.8,
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  {/* Active checkmark */}
                  {isActive && (
                    <div
                      className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: preview.accent }}
                    >
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: isActive ? theme.colors.primary : theme.colors.textSecondary }}
                >
                  {preview.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
