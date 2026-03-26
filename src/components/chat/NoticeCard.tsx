type NoticeCardProps = {
  title: string
  description: string
}

export function NoticeCard({ title, description }: NoticeCardProps) {
  return (
    <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-amber-800">{description}</p>
    </div>
  )
}
