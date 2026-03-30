type SystemMessageProps = {
  text: string
}

export function SystemMessage({ text }: SystemMessageProps) {
  return (
    <div className="flex justify-center">
      <div className="rounded-sm border border-default bg-muted px-3 py-1.5 text-xs text-muted">{text}</div>
    </div>
  )
}
