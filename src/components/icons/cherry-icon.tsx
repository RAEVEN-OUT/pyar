
import { cn } from '@/lib/utils';
import React from 'react';

export function CherryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
    >
      <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-5s-5 2.24-5 5Z" />
      <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-5s-5 2.24-5 5Z" />
      <path d="M7 12c0-6 4-6 4-6s4 0 4 6" />
      <path d="m22 2-2 2" />
      <path d="m14 8 2-2" />
    </svg>
  );
}
