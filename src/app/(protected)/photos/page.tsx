
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
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { Input } from '@/components/ui/input';

function SortablePhoto({ 
  photo,
  onDescriptionChange,
}: { 
  photo: ImagePlaceholder,
  onDescriptionChange: (id: string, newDescription: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(photo.description);
  const inputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const handleDescriptionClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
  const handleDescriptionBlur = () => {
    setIsEditing(false);
    onDescriptionChange(photo.id, description);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDescriptionBlur();
    } else if (e.key === 'Escape') {
      setDescription(photo.description);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'overflow-hidden rounded-lg shadow-md aspect-video relative group',
        isDragging && 'opacity-75'
      )}
    >
      <div {...attributes} {...listeners} className="h-full w-full cursor-grab">
        <Image
          src={photo.imageUrl}
          alt={photo.description}
          width={800}
          height={600}
          data-ai-hint={photo.imageHint}
          className="h-full w-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
          priority
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
        {isEditing ? (
          <Input
            ref={inputRef}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-auto p-0 m-0 bg-transparent border-0 text-xs text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            maxLength={25}
          />
        ) : (
          <p className="text-xs truncate cursor-pointer" onClick={handleDescriptionClick}>
            {photo.description}
          </p>
        )}
      </div>
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

  const handleDescriptionChange = (id: string, newDescription: string) => {
    setPhotos(photos => photos.map(photo => 
      photo.id === id ? { ...photo, description: newDescription } : photo
    ));
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
              modifiers={[restrictToParentElement]}
            >
              <SortableContext items={photos} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <SortablePhoto 
                      key={photo.id} 
                      photo={photo}
                      onDescriptionChange={handleDescriptionChange}
                    />
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
