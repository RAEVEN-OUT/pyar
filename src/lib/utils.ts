import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(name: string) {
  return `https://api.dicebear.com/8.x/lorelei/svg?seed=${name}`
}
