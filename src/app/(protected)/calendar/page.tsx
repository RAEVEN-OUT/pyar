import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="flex h-full items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline">
            <CalendarDays className="h-8 w-8 text-primary" />
            Our Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A special calendar just for us. Coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
