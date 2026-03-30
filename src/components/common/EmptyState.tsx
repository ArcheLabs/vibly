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
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center border border-default bg-panel p-8 text-center">
      {eyebrow ? (
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-secondary">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover-opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
