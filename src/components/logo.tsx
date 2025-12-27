import { cn } from '@/lib/utils';

export function Logo({ className, text = "Only Mine" }: { className?: string, text?: string }) {
  return (
    <h1 className={cn('font-headline text-5xl text-primary drop-shadow-sm', className)}>
      {text}
    </h1>
  );
}
