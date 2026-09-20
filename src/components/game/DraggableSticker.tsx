import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { PlacedSticker, PHOTO_STICKERS } from '@/types/photoBooth';

/**
 * Props for the DraggableSticker component
 */
interface DraggableStickerProps {
  /** Sticker placement data */
  sticker: PlacedSticker;
  /** Reference to the container element for position calculations */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Callback when sticker position changes */
  onUpdate: (id: string, updates: Partial<PlacedSticker>) => void;
  /** Callback when removing the sticker */
  onRemove: (id: string) => void;
  /** Whether the photo is being exported (hides delete button) */
  isExporting?: boolean;
}

/**
 * DraggableSticker - Draggable sticker element for photo booth
 *
 * Renders a sticker that can be dragged to reposition within the photo.
 * Supports mouse and touch input. Shows delete button on hover.
 *
 * @example
 * ```tsx
 * <DraggableSticker
 *   sticker={placedSticker}
 *   containerRef={stageRef}
 *   onUpdate={handleUpdate}
 *   onRemove={handleRemove}
 * />
 * ```
 */

export const DraggableSticker: React.FC<DraggableStickerProps> = ({
  sticker,
  containerRef,
  onUpdate,
  onRemove,
  isExporting = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Selected state gives touch users (no hover) a way to reveal the delete button:
  // tapping a sticker without dragging toggles selection.
  const [isSelected, setIsSelected] = useState(false);
  const stickerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const stickerData = PHOTO_STICKERS.find((s) => s.id === sticker.stickerId);
  if (!stickerData) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = ((moveEvent.clientX - startPosRef.current.x) / containerRect.width) * 100;
      const deltaY = ((moveEvent.clientY - startPosRef.current.y) / containerRect.height) * 100;

      const newX = Math.max(0, Math.min(100, sticker.x + deltaX));
      const newY = Math.max(0, Math.min(100, sticker.y + deltaY));

      onUpdate(sticker.id, { x: newX, y: newY });
      startPosRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    movedRef.current = false;
    startPosRef.current = { x: touch.clientX, y: touch.clientY };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!containerRef.current) return;
      const touchMove = moveEvent.touches[0];

      const containerRect = containerRef.current.getBoundingClientRect();
      const deltaX = ((touchMove.clientX - startPosRef.current.x) / containerRect.width) * 100;
      const deltaY = ((touchMove.clientY - startPosRef.current.y) / containerRect.height) * 100;

      // Any meaningful movement counts as a drag, not a tap
      if (Math.abs(deltaX) + Math.abs(deltaY) > 0.5) movedRef.current = true;

      const newX = Math.max(0, Math.min(100, sticker.x + deltaX));
      const newY = Math.max(0, Math.min(100, sticker.y + deltaY));

      onUpdate(sticker.id, { x: newX, y: newY });
      startPosRef.current = { x: touchMove.clientX, y: touchMove.clientY };
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      // A touch with no drag is a tap: toggle selection to reveal/hide the delete button
      if (!movedRef.current) setIsSelected((s) => !s);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div
      ref={stickerRef}
      className="absolute cursor-move select-none"
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
        zIndex: isDragging ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-4xl">{stickerData.emoji}</span>

      {/* Delete button - shown on hover (desktop) or when selected via tap (touch); hidden during export */}
      {(isHovered || isSelected) && !isDragging && !isExporting && (
        <button
          aria-label={`Remove ${stickerData.emoji} sticker`}
          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:scale-110 transition-transform shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(sticker.id);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
