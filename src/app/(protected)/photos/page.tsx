
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

function SortablePhoto({ photo }: { photo: ImagePlaceholder }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'overflow-hidden rounded-lg shadow-md aspect-video relative',
        isDragging && 'opacity-75'
      )}
    >
      <Image
        src={photo.imageUrl}
        alt={photo.description}
        width={800}
        height={600}
        data-ai-hint={photo.imageHint}
        className="h-full w-full object-cover transition-transform hover:scale-105"
        priority
      />
    </div>
  );
}


export default function PhotosPage() {
  const [photos, setPhotos] = useState<ImagePlaceholder[]>(PlaceHolderImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: ImagePlaceholder = {
          id: `local-${Date.now()}`,
          description: file.name,
          imageUrl: e.target?.result as string,
          imageHint: 'custom upload',
        };
        setPhotos((prevPhotos) => [newPhoto, ...prevPhotos]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-6xl">
        <CardHeader className="relative border-b pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <ImageIcon className="h-8 w-8 text-primary" />
            Our Photo Album
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={handleAddPhotoClick}
          >
            <Plus className="h-6 w-6" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </CardHeader>
        <CardContent className="pt-6">
          {photos.length === 0 ? (
            <p className="text-muted-foreground text-center mb-4">
              Your photo album is empty. Click the '+' to add your first memory!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={photos} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <SortablePhoto key={photo.id} photo={photo} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
