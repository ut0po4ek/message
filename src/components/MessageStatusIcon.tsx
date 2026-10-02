import type { MessageStatus } from '../domain/types'
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './icons'

const LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

interface MessageStatusIconProps {
  status: MessageStatus
  className?: string
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
  const icon = {
    pending: <ClockIcon size={14} />,
    sent: <CheckIcon width={14} height={10} />,
    delivered: <DoubleCheckIcon width={18} height={10} />,
    read: <DoubleCheckIcon width={18} height={10} />,
    failed: <AlertIcon size={15} />,
  }[status]

  return (
    <span
      className={className}
      data-status={status}
      role="img"
      aria-label={LABELS[status]}
      title={LABELS[status]}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      {icon}
    </span>
  )
}
