type NoticeCardProps = {
  title: string
  description: string
}

export function NoticeCard({ title, description }: NoticeCardProps) {
  return (
    <div className="rounded-md border border-default bg-muted px-3 py-3 text-sm text-secondary">
      <p className="font-semibold text-primary">{title}</p>
      <p className="mt-1.5">{description}</p>
    </div>
  )
}
