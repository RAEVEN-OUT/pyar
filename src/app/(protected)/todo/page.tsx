import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

export default function TodoPage() {
  return (
    <div className="flex h-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <ListChecks className="h-8 w-8 text-primary" />
            Our To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Let's get things done, together. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
