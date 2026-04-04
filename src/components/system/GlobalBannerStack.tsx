import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/utils'
import type { GlobalBanner } from '@/modules/notifications/types'

const toneClassMap: Record<GlobalBanner['tone'], string> = {
  info: 'border-sky-300/60 bg-sky-500/10 text-sky-100',
  warning: 'border-amber-300/60 bg-amber-500/10 text-amber-50',
  error: 'border-rose-300/60 bg-rose-500/10 text-rose-50',
}

const toneIconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}

export function GlobalBannerStack({
  banners,
  onDismiss,
}: {
  banners: GlobalBanner[]
  onDismiss: (bannerId: string) => void
}) {
  if (banners.length === 0) return null

  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-40 space-y-2 lg:left-24 lg:right-24">
      {banners.map((banner) => {
        const Icon = toneIconMap[banner.tone]

        return (
          <div
            key={banner.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur',
              toneClassMap[banner.tone],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{banner.title}</p>
              <p className="mt-1 text-xs opacity-90">{banner.message}</p>
            </div>
            <IconButton
              className="h-7 w-7 shrink-0 border-white/20 bg-white/5 text-current hover:bg-white/10"
              aria-label={`Close ${banner.title}`}
              onClick={() => onDismiss(banner.id)}
            >
              <X className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}
