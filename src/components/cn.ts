import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Registers the custom --text-* theme sizes so text-body etc. merge as font sizes, not text colors
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['body', 'lead', 'label', 'eyebrow', 'title'],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
