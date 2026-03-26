type EmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-white/60 p-10 text-center shadow-panel">
      {eyebrow ? (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-3 max-w-md text-sm text-stone-600">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
