import { useState } from 'react'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const meSections = [
  { key: 'profile', label: '个人资料' },
  { key: 'identity', label: '身份与账号' },
  { key: 'preferences', label: '偏好设置' },
  { key: 'security', label: '安全设置' },
  { key: 'about', label: '关于产品' },
] as const

export function MePage() {
  const { meSection, setMeSection } = useAppContext()
  const [notice, setNotice] = useState('当前均为本地预览文案。')

  return (
    <>
      <ListPanel>
        <div className="space-y-3">
          {meSections.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setMeSection(section.key)}
              className={cn(
                'w-full rounded-[24px] px-4 py-4 text-left text-sm font-medium transition',
                meSection === section.key ? 'bg-stone-900 text-white' : 'bg-white/80 text-ink hover:bg-white',
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </ListPanel>
      <MainPanel>
        <div className="glass rounded-[32px] border border-white/70 p-6 shadow-panel">
          {meSection === 'profile' ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                Profile
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-ink">libingjiang</h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Building Vibly for the AI era. 当前页面展示个人资料与基础设置骨架。
              </p>
              <button
                type="button"
                onClick={() => setNotice('预览版暂不实现真实编辑流程。')}
                className="mt-6 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white"
              >
                编辑资料
              </button>
            </div>
          ) : meSection === 'identity' ? (
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold text-ink">身份与账号</h2>
              <div className="rounded-[24px] bg-white p-4">
                <p className="text-sm text-stone-600">主账号：5F3sa2TJ...Vibly</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label="默认身份 libingjiang" variant="human" />
                  <Badge label="Research Assistant" variant="agent" />
                </div>
              </div>
            </div>
          ) : meSection === 'preferences' ? (
            <EmptyState
              eyebrow="Preferences"
              title="偏好设置占位"
              description="通知、主题与语言将在正式实现阶段接入，当前只保留结构。"
            />
          ) : meSection === 'security' ? (
            <EmptyState
              eyebrow="Security"
              title="安全设置占位"
              description="设备管理与权限说明后续补充，当前只确保导航与内容区关系清晰。"
            />
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-semibold text-ink">关于产品</h2>
              <div className="rounded-[24px] bg-white p-4 text-sm text-stone-600">
                Vibly Preview 0.1.0
              </div>
              <div className="rounded-[24px] bg-white p-4 text-sm text-stone-600">
                Web 与 Tauri 2 共用同一套 React UI 代码，当前优先验证信息架构与聊天主流程。
              </div>
            </div>
          )}
          <p className="mt-6 text-sm text-stone-500">{notice}</p>
        </div>
      </MainPanel>
    </>
  )
}
