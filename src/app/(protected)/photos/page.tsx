
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Lock } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Photo = {
  id: string;
  url: string;
  description: string;
  uploader: string; // In a real app, this would be a user ID
  isPrivate: boolean;
};

const initialPhotos: Photo[] = PlaceHolderImages.map(p => ({
    id: p.id,
    url: p.imageUrl,
    description: p.description,
    uploader: Math.random() > 0.5 ? 'Him' : 'Her',
    isPrivate: false,
}))

function SortablePhoto({ 
  photo,
  onDescriptionChange,
  isOwner,
}: { 
  photo: Photo,
  onDescriptionChange: (id: string, newDescription: string) => void;
  isOwner: boolean;
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
    if (!isOwner) return;
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
  const handleDescriptionBlur = () => {
    setIsEditing(false);
    if (description !== photo.description) {
      onDescriptionChange(photo.id, description);
    }
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
          src={photo.url}
          alt={photo.description}
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
          priority
        />
      </div>
      {photo.isPrivate && (
        <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
            <Lock className="h-4 w-4 text-white" />
        </div>
      )}
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
            maxLength={30}
          />
        ) : (
          <p className={cn("text-xs truncate", isOwner && "cursor-pointer")} onClick={handleDescriptionClick}>
            {photo.description}
          </p>
        )}
      </div>
    </div>
  );
}


export default function PhotosPage() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeTab, setActiveTab] = useState('shared');
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadIsPrivate, setUploadIsPrivate] = useState(false);

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

  const displayedPhotos = useMemo(() => {
    if (activeTab === 'shared') {
      return photos.filter(p => !p.isPrivate);
    }
    return photos.filter(p => p.isPrivate && p.uploader === user);
  }, [photos, activeTab, user]);
  
  const [orderedPhotos, setOrderedPhotos] = useState(displayedPhotos);

  useEffect(() => {
    setOrderedPhotos(displayedPhotos);
  }, [displayedPhotos]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedPhotos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadDescription(file.name.split('.').slice(0, -1).join('.'));
      setUploadModalOpen(true);
      event.target.value = '';
    }
  };

  const handleUpload = () => {
    if (!uploadFile || !user) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newPhoto: Photo = {
        id: new Date().toISOString(),
        url: imageUrl,
        description: uploadDescription,
        uploader: user,
        isPrivate: uploadIsPrivate,
      };

      setPhotos(prev => [...prev, newPhoto]);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadIsPrivate(false);
    };
    reader.readAsDataURL(uploadFile);
  };


  const handleDescriptionChange = (id: string, newDescription: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, description: newDescription } : p));
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-6xl">
        <CardHeader className="relative border-b pb-4 flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <ImageIcon className="h-8 w-8 text-primary" />
            Photos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="shared">Shared Album</TabsTrigger>
                    <TabsTrigger value="private">My Eyes Only</TabsTrigger>
                </TabsList>
            </Tabs>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </CardHeader>
        <CardContent className="pt-6">
            <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload a new photo</DialogTitle>
                        <DialogDescription>Add a description and choose if this photo should be private.</DialogDescription>
                    </DialogHeader>
                    {uploadFile && <Image src={URL.createObjectURL(uploadFile)} alt="Preview" width={400} height={300} className="rounded-md object-contain mx-auto max-h-60" />}
                    <div className="grid gap-4 py-4">
                        <Input 
                            placeholder="Description"
                            value={uploadDescription}
                            onChange={e => setUploadDescription(e.target.value)}
                        />
                        <div className="flex items-center space-x-2">
                           <input type="checkbox" id="is-private" checked={uploadIsPrivate} onChange={e => setUploadIsPrivate(e.target.checked)} />
                           <label htmlFor="is-private" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Add to "My Eyes Only"
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!uploadDescription}>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          {orderedPhotos.length === 0 ? (
            <p className="text-muted-foreground text-center mb-4">
              This album is empty. Click the '+' to add a memory!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToParentElement]}
            >
              <SortableContext items={orderedPhotos.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {orderedPhotos.map((photo) => (
                    <SortablePhoto 
                      key={photo.id} 
                      photo={photo}
                      onDescriptionChange={handleDescriptionChange}
                      isOwner={photo.uploader === user}
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
