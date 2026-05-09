import { forwardRef, useEffect } from 'react';

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
  isDrawing: boolean;
  canvasRef: any;
  activeTab: string;
  lineResults: any[];
  onEnter: () => void;
  theme: any;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ text, onTextChange, isDrawing, canvasRef, activeTab, lineResults, onEnter, theme }, ref) => {
    useEffect(() => {
      if (isDrawing && canvasRef.current && activeTab === 'DRAW') {
        canvasRef.current.init();
      }
    }, [isDrawing, canvasRef, activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <div className="relative flex-1 overflow-hidden">
        {!isDrawing ? (
          <>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="absolute inset-0 w-full h-full p-4 resize-none bg-transparent outline-none font-mono text-base leading-relaxed whitespace-pre"
              style={{ 
                color: theme.colors.text,
                caretColor: theme.colors.primary,
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
            <div className="absolute inset-0 pointer-events-none p-4 font-mono text-base leading-relaxed whitespace-pre overflow-hidden" aria-hidden="true">
              {lineResults.map((res, i) => (
                <div key={i} className="flex">
                  <span style={{ color: res.isError ? '#ef4444' : theme.colors.text }}>{res.formattedLine}</span>
                  {res.result !== null && (
                    <span className="ml-2 font-bold" style={{ color: theme.colors.accent }}>→ {res.formattedResult}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            style={{ backgroundColor: theme.colors.surface }}
          />
        )}
      </div>
    );
  }
);

Editor.displayName = 'Editor';
