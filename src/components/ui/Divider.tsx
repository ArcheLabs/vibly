import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type DividerProps = HTMLAttributes<HTMLHRElement>

export function Divider({ className, ...props }: DividerProps) {
  return <hr className={cn('border-0 border-t border-default', className)} {...props} />
}
