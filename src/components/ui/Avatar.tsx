import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type AvatarProps = {
  label: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'human' | 'agent' | 'neutral'
  onClick?: () => void
}

const sizeClassMap = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
}

const toneClassMap = {
  human: 'text-[var(--avatar-human-fg)] bg-[var(--avatar-human-bg)]',
  agent: 'text-[var(--avatar-agent-fg)] bg-[var(--avatar-agent-bg)]',
  neutral: 'bg-muted text-secondary',
}

export function Avatar({ label, size = 'md', tone = 'neutral', onClick }: AvatarProps) {
  const initials = label
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition hover:opacity-90',
          sizeClassMap[size],
          toneClassMap[tone],
        )}
      >
        {initials || <UserRound className="h-3.5 w-3.5" />}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold',
        sizeClassMap[size],
        toneClassMap[tone],
      )}
    >
      {initials || <UserRound className="h-3.5 w-3.5" />}
    </div>
  )
}
