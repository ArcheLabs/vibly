import { useState } from 'react'
import { CircleUserRound, IdCard, PencilLine, ShieldCheck, SlidersHorizontal, Info } from 'lucide-react'
import { ListPanel } from '@/components/layout/ListPanel'
import { MainPanel } from '@/components/layout/MainPanel'
import { PanelTitle } from '@/components/layout/PanelTitle'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { useAppContext } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const meSections = [
  { key: 'profile', label: '个人资料', icon: CircleUserRound },
  { key: 'identity', label: '身份与账号', icon: IdCard },
  { key: 'preferences', label: '偏好设置', icon: SlidersHorizontal },
  { key: 'security', label: '安全设置', icon: ShieldCheck },
  { key: 'about', label: '关于产品', icon: Info },
] as const

export function MePage() {
  const { meSection, setMeSection } = useAppContext()
  const [notice, setNotice] = useState('当前均为本地预览文案。')

  return (
    <>
      <ListPanel
        headerClassName="p-3"
        contentClassName="min-h-0 flex-1 overflow-y-auto"
        header={<PanelTitle icon={CircleUserRound} title="我的" />}
      >
        <div>
          {meSections.map((section) => {
            const Icon = section.icon

            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setMeSection(section.key)}
                className={cn(
                  'flex w-full items-center gap-2 border-b border-default px-3 py-3 text-sm transition',
                  meSection === section.key ? 'bg-muted text-primary' : 'text-muted hover-bg-muted',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </button>
            )
          })}
        </div>
      </ListPanel>
      <MainPanel>
        <div className="p-3">
          {meSection === 'profile' ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                Profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">libingjiang</h2>
              <p className="mt-2 max-w-2xl text-sm text-secondary">
                Building Vibly for the AI era. 当前页面展示个人资料与基础设置骨架。
              </p>
              <Button className="mt-4" variant="accent" onClick={() => setNotice('预览版暂不实现真实编辑流程。')}>
                <PencilLine className="h-4 w-4" />
                编辑资料
              </Button>
            </div>
          ) : meSection === 'identity' ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">身份与账号</h2>
              <div className="p-1">
                <p className="text-sm text-secondary">主账号：5F3sa2TJ...Vibly</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge label="默认身份 libingjiang" variant="default" />
                  <Badge label="Research Assistant" variant="accent" />
                </div>
              </div>
            </div>
          ) : meSection === 'preferences' ? (
            <div>
              <h2 className="text-2xl font-semibold text-primary">偏好设置</h2>
              <p className="mt-2 text-sm text-secondary">通知、主题与语言将在正式实现阶段接入，当前只保留结构。</p>
            </div>
          ) : meSection === 'security' ? (
            <div>
              <h2 className="text-2xl font-semibold text-primary">安全设置</h2>
              <p className="mt-2 text-sm text-secondary">设备管理与权限说明后续补充，当前只确保导航与内容区关系清晰。</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-primary">关于产品</h2>
              <div className="p-1 text-sm text-secondary">
                Vibly Preview 0.1.0
              </div>
              <Divider variant="inset" />
              <div className="p-1 text-sm text-secondary">
                Web 与 Tauri 2 共用同一套 React UI 代码，当前优先验证信息架构与聊天主流程。
              </div>
            </div>
          )}
          <Divider variant="full" className="my-4" />
          <p className="mt-5 text-sm text-muted">{notice}</p>
        </div>
      </MainPanel>
    </>
  )
}
