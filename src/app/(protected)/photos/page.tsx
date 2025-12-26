
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { useState, useRef } from 'react';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<ImagePlaceholder[]>(PlaceHolderImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <Card className="w-full max-w-4xl">
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
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-lg shadow-md aspect-video"
                >
                  <Image
                    src={photo.imageUrl}
                    alt={photo.description}
                    width={800}
                    height={600}
                    data-ai-hint={photo.imageHint}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
