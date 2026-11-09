export interface AppNotification {
  id: string
  userId: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export function getNotificationDisplayMessage(message: string) {
  return message.replace(/\s*\[contentId:[0-9a-f-]+\]/i, '')
}
