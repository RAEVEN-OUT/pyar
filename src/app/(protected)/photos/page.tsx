
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Lock, Trash2, X, Delete } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
    uploader: Math.random() > 0.5 ? 'Raveen' : 'Priya',
    isPrivate: false,
}))

function SortablePhoto({ 
  photo,
  onDescriptionChange,
  isOwner,
  onPhotoClick,
}: { 
  photo: Photo,
  onDescriptionChange: (id: string, newDescription: string) => void;
  isOwner: boolean;
  onPhotoClick: (photo: Photo) => void;
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
      <div {...attributes} {...listeners} onClick={() => onPhotoClick(photo)} className="h-full w-full cursor-pointer">
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
  
  const [isPrivateAlbumLocked, setPrivateAlbumLocked] = useState(true);
  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  const SPECIAL_PIN = '2107';

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
    // For 'private' tab, only show if unlocked
    if (isPrivateAlbumLocked) {
      return [];
    }
    return photos.filter(p => p.isPrivate && p.uploader === user);
  }, [photos, activeTab, user, isPrivateAlbumLocked]);
  
  const [orderedPhotos, setOrderedPhotos] = useState(displayedPhotos);

  useEffect(() => {
    setOrderedPhotos(displayedPhotos);
  }, [displayedPhotos]);

  useEffect(() => {
    if (activeTab !== 'private') {
      setPrivateAlbumLocked(true);
    }
  }, [activeTab]);

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

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    setViewingPhoto(null);
  };
  
  const handleTabChange = (value: string) => {
     if (value === 'private' && isPrivateAlbumLocked) {
      setPasswordDialogOpen(true);
    } else {
      setActiveTab(value);
    }
     if (value !== 'private') {
      setPrivateAlbumLocked(true);
    }
  };

  const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SPECIAL_PIN) {
      setPrivateAlbumLocked(false);
      setPasswordDialogOpen(false);
      setPasswordError('');
      setPasswordInput('');
      setActiveTab('private');
    } else {
      setPasswordError('Incorrect PIN. Please try again.');
      setPasswordInput('');
    }
  }, [passwordInput]);

  const handlePinPadClick = useCallback((value: string) => {
    setPasswordError('');
    if (passwordInput.length < 4) {
      setPasswordInput(prev => prev + value);
    }
  }, [passwordInput.length]);

  const handlePinPadBackspace = useCallback(() => {
    setPasswordError('');
    setPasswordInput(prev => prev.slice(0, -1));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPasswordDialogOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handlePinPadClick(e.key);
      } else if (e.key === 'Backspace') {
        handlePinPadBackspace();
      } else if (e.key === 'Enter') {
        const form = document.querySelector('form[data-form-id="pin-form"]');
        if(form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPasswordDialogOpen, handlePinPadClick, handlePinPadBackspace]);


  if (!user) return null;

  const pinDisplay = '●'.repeat(passwordInput.length).padEnd(4, '○');

  const isViewingPhotoOwner = viewingPhoto?.uploader === user;

  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-6xl">
        <CardHeader className="relative border-b pb-4 flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <ImageIcon className="h-8 w-8 text-primary" />
            Photos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
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
            <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
              <DialogContent 
                className="bg-transparent border-0 shadow-none p-0 max-w-none w-full h-full"
                onClick={() => setViewingPhoto(null)}
              >
                 {viewingPhoto && (
                  <>
                  <DialogHeader className="sr-only">
                    <DialogTitle>{viewingPhoto.description}</DialogTitle>
                    <DialogDescription>A photo uploaded by {viewingPhoto.uploader}.</DialogDescription>
                  </DialogHeader>
                  <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingPhoto(null)}
                  >
                    <div 
                      className="relative w-full h-auto bg-card rounded-lg shadow-xl flex flex-col overflow-hidden max-w-4xl max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative aspect-video flex-1">
                         <Image
                            src={viewingPhoto.url}
                            alt={viewingPhoto.description}
                            fill
                            className="object-contain"
                         />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-card/80 backdrop-blur-sm border-t">
                          <p className="font-semibold text-card-foreground text-sm truncate pr-4">{viewingPhoto.description}</p>
                          {isViewingPhotoOwner && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeletePhoto(viewingPhoto!.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
                                  <Trash2 className="h-5 w-5" />
                              </Button>
                          )}
                       </div>
                    </div>
                  </div>
                  </>
                 )}
              </DialogContent>
            </Dialog>

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
                            <Checkbox id="is-private" checked={uploadIsPrivate} onCheckedChange={(checked) => setUploadIsPrivate(!!checked)} />
                           <Label htmlFor="is-private" className="text-sm font-medium leading-none">
                                Add to "My Eyes Only"
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!uploadDescription}>Upload</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle className="text-center">Enter PIN</DialogTitle>
                  <DialogDescription className="text-center">
                    This album is locked.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordSubmit} data-form-id="pin-form">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex h-10 items-center justify-center gap-3 text-2xl tracking-widest text-muted-foreground">
                      {pinDisplay.split('').map((char, i) => <span key={i}>{char}</span>)}
                    </div>
                    {passwordError && <p className="text-sm text-destructive text-center">{passwordError}</p>}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        {[ '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                           <Button key={digit} type="button" variant="outline" className="h-14 text-xl" onClick={() => handlePinPadClick(digit)}>
                               {digit}
                           </Button>
                        ))}
                         <div />
                         <Button type="button" variant="outline" className="h-14 text-xl" onClick={() => handlePinPadClick('0')}>
                           0
                         </Button>
                         <Button type="button" variant="outline" size="icon" className="h-14" onClick={handlePinPadBackspace}>
                           <Delete className="h-6 w-6" />
                         </Button>
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-center">
                    <Button type="submit" className="w-full">Unlock</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          {orderedPhotos.length === 0 ? (
            <div className="text-muted-foreground text-center mb-4">
              {activeTab === 'private' && isPrivateAlbumLocked ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                  <p>This album is locked.</p>
                  <Button onClick={() => setPasswordDialogOpen(true)}>Unlock "My Eyes Only"</Button>
                </div>
              ) : (
                <p>This album is empty. Click the '+' to add a memory!</p>
              )}
            </div>
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
                      onPhotoClick={setViewingPhoto}
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
 

    