import { forwardRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

interface EditorProps {
  text: string;
  onTextChange: (text: string) => void;
  isDrawing: boolean;
  canvasRef: any;
  activeTab: string;
}

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(({ text, onTextChange, isDrawing, canvasRef, activeTab }, ref) => {
  return (
    <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
      <textarea
        ref={ref}
        style={{ display: isDrawing ? 'none' : 'block' }}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="flex-1 w-full p-4 bg-transparent resize-none focus:outline-none text-gray-800 font-mono text-lg leading-relaxed overflow-y-auto"
        placeholder="+ 100 rent&#10;+ 50 food"
        inputMode={activeTab === 'ABC' ? 'text' : 'none'}
      />
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
