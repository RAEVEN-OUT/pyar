
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function PhotosPage() {
  const photo = PlaceHolderImages[0];
  return (
    <div className="flex h-full items-start justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="relative border-b pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <ImageIcon className="h-8 w-8 text-primary" />
            Our Photo Album
          </CardTitle>
          <Button size="icon" variant="ghost" className="absolute right-4 top-1/2 -translate-y-1/2">
            <Plus className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center mb-4">
            A gallery of our favorite moments. More features coming soon!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="overflow-hidden rounded-lg shadow-md aspect-video">
                <Image
                  src={photo.imageUrl}
                  alt={photo.description}
                  width={800}
                  height={600}
                  data-ai-hint={photo.imageHint}
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
               <div className="overflow-hidden rounded-lg shadow-md aspect-video bg-muted flex items-center justify-center">
                 <p className="text-muted-foreground text-sm">More photos...</p>
               </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
