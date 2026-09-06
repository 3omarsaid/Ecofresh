import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { revalidatePath } from "next/cache";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    // Ignore static store invariant when executed outside Next.js request context
  }
}
