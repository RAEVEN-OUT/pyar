import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <h1 className={cn('font-headline text-5xl text-primary drop-shadow-sm', className)}>
      Pyar
    </h1>
  );
}
