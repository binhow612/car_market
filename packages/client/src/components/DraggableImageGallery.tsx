import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, Star } from 'lucide-react';

interface ImageItem {
  id: string;
  src: string;
  file?: File;
  isExisting?: boolean;
}

interface DraggableImageGalleryProps {
  images: ImageItem[];
  onReorder: (reorderedImages: ImageItem[]) => void;
  onRemove: (imageId: string) => void;
  className?: string;
}

interface SortableImageItemProps {
  image: ImageItem;
  onRemove: (imageId: string) => void;
}

function SortableImageItem({ image, onRemove }: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
        <img
          src={image.src}
          alt={`Car image`}
          className="w-full h-full object-cover"
        />
        
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-black/50 text-white rounded p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Primary Image Badge */}
        {image.id === '0' && (
          <div
            className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Star className="w-3 h-3 fill-current" />
            Primary Image
          </div>
        )}

        {/* Tooltip */}
        {showTooltip && image.id === '0' && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 max-w-xs">
            <div className="text-center">
              This is the primary image that will be displayed on the home page and listing preview. Choose an attractive photo that best showcases your vehicle.
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DraggableImageGallery({ 
  images, 
  onReorder, 
  onRemove, 
  className = "" 
}: DraggableImageGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((image) => image.id === active.id);
      const newIndex = images.findIndex((image) => image.id === over?.id);

      const reorderedImages = arrayMove(images, oldIndex, newIndex);
      
      // Update IDs to reflect new order (first image should have id '0')
      const updatedImages = reorderedImages.map((image, index) => ({
        ...image,
        id: index.toString(),
      }));

      onReorder(updatedImages);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
          {images.map((image) => (
            <SortableImageItem
              key={image.id}
              image={image}
              onRemove={onRemove}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
