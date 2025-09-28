
import React from 'react';
import { COLORS, BRUSH_SIZES, BRUSH_STYLES } from '../constants';
import type { BrushStyle } from '../types';
import { Icon } from './Icon';

interface ToolbarProps {
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  brushStyle: BrushStyle;
  setBrushStyle: (style: BrushStyle) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ color, setColor, lineWidth, setLineWidth, brushStyle, setBrushStyle }) => {
  return (
    <div className="absolute top-4 transform -translate-x-1/2 left-1/2 flex items-center gap-2 md:gap-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg z-10 flex-wrap justify-center">
      <div className="flex items-center gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
      <div className="w-px h-8 bg-base-300 hidden md:block"></div>
      <div className="flex items-center gap-2 md:gap-3">
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setLineWidth(size)}
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-colors ${lineWidth === size ? 'bg-primary text-white' : 'bg-base-200 hover:bg-base-300'}`}
            aria-label={`Select brush size ${size}`}
          >
            <div
              className="bg-black rounded-full"
              style={{ width: `${size/2}px`, height: `${size/2}px` }}
            ></div>
          </button>
        ))}
      </div>
       <div className="w-px h-8 bg-base-300 hidden md:block"></div>
      <div className="flex items-center gap-2 md:gap-3">
        {BRUSH_STYLES.map((style) => (
          <button
            key={style}
            onClick={() => setBrushStyle(style)}
            className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-colors ${brushStyle === style ? 'bg-primary text-white' : 'bg-base-200 hover:bg-base-300'}`}
            aria-label={`Select brush style ${style}`}
          >
            <Icon name={style as 'solid' | 'dashed' | 'dotted'} className="w-6 h-6"/>
          </button>
        ))}
      </div>
    </div>
  );
};
