import { MessageBubble as UiMessageBubble } from '@/components/ui/MessageBubble'
import type { Message } from '@/types'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return <UiMessageBubble text={message.text} time={message.time} isMe={message.senderSide === 'me'} />
}
