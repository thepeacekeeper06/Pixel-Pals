
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PlayerInfo, Point, DrawData, BrushStyle, CursorMovePayload } from '../types';
import { GameEvent } from '../types';
import { syncService } from '../services/syncService';

interface DrawingCanvasProps {
  player: PlayerInfo;
  color: string;
  lineWidth: number;
  brushStyle: BrushStyle;
  setDrawHandler: (handler: (data: DrawData) => void) => void;
  setClearHandler: (handler: () => void) => void;
  setTemplateHandler: (handler: (url: string | null) => void) => void;
  setCursorHandler: (handler: (data: CursorMovePayload | null) => void) => void;
}

const BRUSH_STYLE_MAP = {
    solid: [],
    dashed: [30, 15],
    dotted: [5, 10],
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ player, color, lineWidth, brushStyle, setDrawHandler, setClearHandler, setTemplateHandler, setCursorHandler }) => {
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState<Point | null>(null);
    const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);

    const getContext = (canvas: HTMLCanvasElement | null) => canvas?.getContext('2d');
    
    const redrawCanvas = useCallback(() => {
        const canvas = mainCanvasRef.current;
        const ctx = getContext(canvas);
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (templateImage) {
            ctx.globalAlpha = 0.5; // Make template semi-transparent
            ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        }
    }, [templateImage]);
    
    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        const cursorCanvas = cursorCanvasRef.current;
        const container = mainCanvas?.parentElement;

        if (!mainCanvas || !cursorCanvas || !container) return;
        
        const resizeCanvas = () => {
            mainCanvas.width = cursorCanvas.width = container.clientWidth;
            mainCanvas.height = cursorCanvas.height = container.clientHeight;
            redrawCanvas();
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        setDrawHandler((data: DrawData) => drawLine(data.start, data.end, data.color, data.lineWidth, data.brushStyle));
        setClearHandler(() => redrawCanvas());
        setTemplateHandler((url: string | null) => {
            if (url) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = url;
                img.onload = () => {
                    setTemplateImage(img);
                    redrawCanvas();
                };
            } else {
                setTemplateImage(null);
                redrawCanvas();
            }
        });
        setCursorHandler((data: CursorMovePayload | null) => drawRemoteCursor(data));

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [redrawCanvas, setClearHandler, setCursorHandler, setDrawHandler, setTemplateHandler]);

    const drawRemoteCursor = (data: CursorMovePayload | null) => {
        const canvas = cursorCanvasRef.current;
        const ctx = getContext(canvas);
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data) {
            const { point, player: remotePlayer } = data;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = remotePlayer.id === 'Player1' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            ctx.fill();
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#000';
            ctx.fillText(remotePlayer.name, point.x + 15, point.y + 5);
        }
    };
    
    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = mainCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const drawLine = (start: Point, end: Point, drawColor: string, drawLineWidth: number, drawBrushStyle: BrushStyle) => {
        const ctx = getContext(mainCanvasRef.current);
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash(BRUSH_STYLE_MAP[drawBrushStyle] || []);
        ctx.stroke();
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        setLastPoint(getPoint(e));
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const currentPoint = getPoint(e);
        syncService.sendEvent({ type: GameEvent.CURSOR_MOVE, payload: { player, point: currentPoint } });
        
        if (!isDrawing || !lastPoint) return;
        
        const drawData: DrawData = { start: lastPoint, end: currentPoint, color, lineWidth, brushStyle };
        drawLine(drawData.start, drawData.end, drawData.color, drawData.lineWidth, drawData.brushStyle);
        syncService.sendEvent({ type: GameEvent.DRAW, payload: drawData });
        
        setLastPoint(currentPoint);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        setLastPoint(null);
        syncService.sendEvent({ type: GameEvent.CURSOR_MOVE, payload: null });
        const ctx = getContext(mainCanvasRef.current);
        if(ctx) ctx.setLineDash([]); // Reset line dash
    };

    return (
        <div className="w-full h-full relative cursor-crosshair">
            <canvas
                ref={mainCanvasRef}
                className="absolute top-0 left-0 w-full h-full bg-white rounded-lg shadow-inner border-2 border-base-300"
            />
             <canvas
                ref={cursorCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute top-0 left-0 w-full h-full"
            />
        </div>
    );
};
