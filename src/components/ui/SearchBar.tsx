import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rightSlot?: ReactNode
}

export function SearchBar({ value, onChange, placeholder, rightSlot }: SearchBarProps) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-default bg-surface px-3 py-2">
      <Search className="h-4 w-4 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm text-primary outline-none placeholder:text-muted"
      />
      {rightSlot ? <div className="flex items-center gap-1">{rightSlot}</div> : null}
    </label>
  )
}
