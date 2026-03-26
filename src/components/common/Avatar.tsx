import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type AvatarProps = {
  label: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'human' | 'agent' | 'neutral'
  onClick?: () => void
}

const sizeClassMap = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
}

const toneClassMap = {
  human: 'bg-sky text-ink',
  agent: 'bg-pine text-white',
  neutral: 'bg-stone-200 text-stone-600',
}

export function Avatar({ label, size = 'md', tone = 'neutral', onClick }: AvatarProps) {
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-2xl font-semibold shadow-sm transition hover:scale-[1.02]',
        sizeClassMap[size],
        toneClassMap[tone],
        !onClick && 'cursor-default hover:scale-100',
      )}
    >
      {initials || <UserRound className="h-4 w-4" />}
    </button>
  )
}
