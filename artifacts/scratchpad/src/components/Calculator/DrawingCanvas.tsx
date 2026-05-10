import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface DrawPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface DrawingCanvasHandle {
  exportPaths: () => DrawPath[];
  loadPaths: (paths: DrawPath[]) => void;
  undo: () => void;
  clear: () => void;
}

interface DrawingCanvasProps {
  theme: any;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ theme }, ref) => {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const paths = useRef<DrawPath[]>([]);
    const isPointerDown = useRef(false);
    const currentPath = useRef<DrawPath | null>(null);

    const redraw = () => {
      const canvas = canvasEl.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const path of paths.current) {
        if (path.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
    };

    useImperativeHandle(ref, () => ({
      exportPaths: () => paths.current,
      loadPaths: (loaded: DrawPath[]) => {
        paths.current = loaded;
        redraw();
      },
      undo: () => {
        paths.current = paths.current.slice(0, -1);
        redraw();
      },
      clear: () => {
        paths.current = [];
        redraw();
      },
    }));

    useEffect(() => {
      const canvas = canvasEl.current;
      if (!canvas) return;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        redraw();
      };

      const observer = new ResizeObserver(resize);
      observer.observe(canvas);
      resize();

      const getPos = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };

      const onDown = (e: PointerEvent) => {
        isPointerDown.current = true;
        canvas.setPointerCapture(e.pointerId);
        const pos = getPos(e);
        currentPath.current = {
          points: [pos],
          color: theme.colors.text || '#1a1a1a',
          width: 2,
        };
      };

      const onMove = (e: PointerEvent) => {
        if (!isPointerDown.current || !currentPath.current) return;
        const pos = getPos(e);
        currentPath.current.points.push(pos);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pts = currentPath.current.points;
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = currentPath.current.color;
        ctx.lineWidth = currentPath.current.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      };

      const onUp = () => {
        if (!isPointerDown.current || !currentPath.current) return;
        isPointerDown.current = false;
        if (currentPath.current.points.length > 1) {
          paths.current = [...paths.current, currentPath.current];
        }
        currentPath.current = null;
      };

      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);

      return () => {
        observer.disconnect();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
      };
    }, [theme]);

    return (
      <canvas
        ref={canvasEl}
        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        style={{ backgroundColor: theme.colors.surface }}
      />
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';
