type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  currentIdentityName: string
  disabled?: boolean
  hint: string
}

export function Composer({
  value,
  onChange,
  onSend,
  currentIdentityName,
  disabled,
  hint,
}: ComposerProps) {
  return (
    <div className="border-t border-stone-200/80 px-6 py-5">
      <div className="rounded-[28px] border border-stone-200 bg-white p-3 shadow-sm">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="以当前身份开始交流"
              disabled={disabled}
              rows={4}
              className="min-h-[104px] w-full resize-none border-none bg-transparent text-sm text-ink outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:text-stone-400"
            />
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || value.trim().length === 0}
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            发送
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-stone-100 px-1 pt-3 text-xs text-stone-500">
          <span>当前以 “{currentIdentityName}” 身份发言</span>
          <span>{hint}</span>
        </div>
      </div>
    </div>
  )
}
