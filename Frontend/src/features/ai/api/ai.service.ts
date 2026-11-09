import { api } from '@/lib/api'
import type {
  AiChatResponse,
  AiChatSession,
  AiManagedUser,
  AiSessionDetail,
  AiSettings,
  AiStatus,
  AiUsageStats,
} from '@/features/ai/types/ai'

export const aiService = {
  getStatus: () => api.get<AiStatus>('/ai/status'),
  listSessions: () => api.get<AiChatSession[]>('/ai/sessions'),
  getSession: (sessionId: string) =>
    api.get<AiSessionDetail>(`/ai/sessions/${sessionId}`),
  deleteSession: (sessionId: string) => api.delete(`/ai/sessions/${sessionId}`),
  sendMessage: (input: { sessionId?: string; novelId?: string; message: string }) =>
    api.post<AiChatResponse>('/ai/chat', input),
  getSettings: () => api.get<AiSettings>('/admin/ai/settings'),
  updateSettings: (settings: Partial<AiSettings>) =>
    api.patch<AiSettings>('/admin/ai/settings', settings),
  getUsageStats: () => api.get<AiUsageStats>('/admin/ai/usage'),
  listUsers: (search?: string) =>
    api.get<AiManagedUser[]>('/admin/ai/users', { params: search ? { search } : undefined }),
  blockUser: (userId: string) => api.patch(`/admin/ai/users/${userId}/block`),
  unblockUser: (userId: string) => api.patch(`/admin/ai/users/${userId}/unblock`),
}
