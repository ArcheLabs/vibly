type SystemMessageProps = {
  text: string
}

export function SystemMessage({ text }: SystemMessageProps) {
  return (
    <div className="flex justify-center">
      <div className="rounded-full bg-stone-200/80 px-4 py-2 text-xs text-stone-600">{text}</div>
    </div>
  )
}
