import { forwardRef, useRef, useEffect } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { LineResult, formatLineResult } from '../../lib/math';

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
  isDrawing: boolean;
  canvasRef: any;
  activeTab: string;
  lineResults?: LineResult[];
  onEnter?: () => void;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ text, onTextChange, isDrawing, canvasRef, activeTab, lineResults = [] }, ref) => {
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and results overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Handle physical Enter key for auto-formatting
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 bg-white">
      <div className="flex-1 relative flex min-h-0">
        <textarea
          ref={ref}
          style={{ display: isDrawing ? 'none' : 'block' }}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none text-gray-800 font-mono text-lg leading-7 overflow-y-auto z-10"
          placeholder="+ 100 rent&#10;+ 50 food"
          inputMode={activeTab === 'ABC' ? 'text' : 'none'}
          spellCheck={false}
        />

        
        {/* Results Overlay */}
        {!isDrawing && (
          <div 
            ref={resultsRef}
            className="absolute inset-0 pointer-events-none p-4 font-mono text-lg leading-7 overflow-hidden text-right pr-4 select-none"
          >
            {lineResults.map((result, idx) => (
              <div key={idx} className="h-7 flex items-center justify-end">
                {result.type === 'percentage' && result.value !== null && (
                  <span className="text-slate-400 opacity-80">
                    | {formatLineResult(result.value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {isDrawing && (
        <div className="flex-1 relative">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={3}
            strokeColor="black"
            canvasColor="transparent"
            className="absolute inset-0"
          />
        </div>
      )}
    </div>
  );
});


Editor.displayName = 'Editor';
