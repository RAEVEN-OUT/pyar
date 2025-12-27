
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus, Lock, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';


type Photo = {
  id: string;
  url: string;
  description: string;
  uploader: string;
  isPrivate: boolean;
};

const initialPhotos: Photo[] = PlaceHolderImages.map(p => ({
    id: p.id,
    url: p.imageUrl,
    description: p.description,
    uploader: Math.random() > 0.5 ? 'Raveen' : 'Priya',
    isPrivate: false,
}));

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const SPECIAL_PIN = '2107';

  const displayedPhotos = useMemo(() => {
    if (activeTab === 'shared') {
      return photos.filter(p => !p.isPrivate);
    }
    if (isPrivateAlbumLocked) {
      return [];
    }
    return photos.filter(p => p.isPrivate && p.uploader === user);
  }, [photos, activeTab, user, isPrivateAlbumLocked]);

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

      setPhotos(prev => [newPhoto, ...prev]);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadIsPrivate(false);
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    closeViewer();
  };
  
  const handleTabChange = useCallback((value: string) => {
    if (value === 'private' && isPrivateAlbumLocked) {
      setPasswordDialogOpen(true);
    } else {
      setActiveTab(value);
    }
    if (value !== 'private') {
      setPrivateAlbumLocked(true);
    }
  }, [isPrivateAlbumLocked]);
  
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
    if (passwordInput.length < 4) {
      setPasswordInput((prev) => prev + value);
    }
  }, [passwordInput.length]);

  const handlePinPadBackspace = useCallback(() => {
    setPasswordInput(prev => prev.slice(0, -1));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (!isPasswordDialogOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handlePinPadClick(e.key);
      } else if (e.key === 'Backspace') {
        handlePinPadBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const form = document.querySelector('form[data-form-id="pin-form"]');
        if(form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
  }, [isPasswordDialogOpen, handlePinPadClick, handlePinPadBackspace]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const closeViewer = () => {
    setViewingPhoto(null);
  };

  if (!user) return null;
  
  const pinDisplay = '●'.repeat(passwordInput.length).padEnd(4, '○');
  const isViewingPhotoOwner = viewingPhoto?.uploader === user;

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
       <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent
          className="p-0 bg-transparent border-0 shadow-none w-auto max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        >
          <DialogTitle className="sr-only">
              {viewingPhoto ? `Viewing photo: ${viewingPhoto.description}` : 'Photo viewer'}
          </DialogTitle>
          {viewingPhoto && (
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-card/80 backdrop-blur-sm">
                <Image
                    src={viewingPhoto.url}
                    alt={viewingPhoto.description}
                    width={2000}
                    height={2000}
                    className="object-contain w-auto h-auto max-w-full max-h-full"
                    style={{ maxHeight: '90vh', maxWidth: '90vw' }}
                    priority
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-end justify-between gap-4">
                    <p className="text-sm font-semibold text-white text-left drop-shadow-md">
                      {viewingPhoto.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {isViewingPhotoOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePhoto(viewingPhoto.id)}
                          className="flex-shrink-0 text-white/80 hover:bg-white/20 hover:text-white h-8 w-8 rounded-full"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    
      <Card className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
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
        <CardContent className="pt-6 flex-1 overflow-y-auto">
            <Dialog open={isUploadModalOpen} onOpenChange={setUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload a new photo</DialogTitle>
                        <DialogDescription>Add a description and choose if this photo should be private.</DialogDescription>
                    </DialogHeader>
                    {uploadFile && <Image src={URL.createObjectURL(uploadFile)} alt="Preview" width={400} height={300} className="rounded-md object-contain mx-auto max-h-60" />}
                    <div className="grid gap-4 py-4">
                        <Input 
                            id="upload-description"
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
                  <DialogTitle>Enter PIN</DialogTitle>
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
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                           <Button key={digit} type="button" variant="outline" className="h-14 text-xl" onClick={() => handlePinPadClick(digit)}>
                               {digit}
                           </Button>
                        ))}
                         <div />
                         <Button key="0" type="button" variant="outline" className="h-14 text-xl" onClick={() => handlePinPadClick('0')}>
                           0
                         </Button>
                         <Button type="button" variant="outline" className="h-14 text-xl" onClick={handlePinPadBackspace}>
                           <Trash2 className="h-5 w-5" />
                         </Button>
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-center mt-2">
                    <Button type="submit" className="w-full">Unlock</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          {displayedPhotos.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedPhotos.map((photo) => (
                 <div
                  key={photo.id}
                  onClick={() => setViewingPhoto(photo)}
                  className='overflow-hidden rounded-lg shadow-md aspect-video relative group cursor-pointer'
                >
                  <Image
                    src={photo.url}
                    alt={photo.description}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105 pointer-events-none"
                    priority
                  />
                  {photo.isPrivate && (
                    <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                        <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-xs truncate">
                        {photo.description}
                      </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    