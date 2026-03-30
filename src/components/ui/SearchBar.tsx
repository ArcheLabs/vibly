import { Search } from 'lucide-react'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-default bg-surface px-4 py-2">
      <Search className="h-4 w-4 text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border-none bg-transparent text-sm text-primary outline-none placeholder:text-muted"
      />
    </label>
  )
}
