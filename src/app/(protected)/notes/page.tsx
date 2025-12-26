import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotebookText } from 'lucide-react';

export default function NotesPage() {
  return (
    <div className="flex h-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <NotebookText className="h-8 w-8 text-primary" />
            Our Shared Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is where our shared thoughts and memories will live. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
