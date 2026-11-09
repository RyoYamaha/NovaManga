import { useState, useEffect, useRef, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiService } from '@/features/ai/api/ai.service'
import { contentService } from '@/services/content.service'
import { useAuthStore } from '@/stores/auth-store'
import type { AiChatMessage } from '@/features/ai/types/ai'

export function getAiErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(', ')
    if (message) return message
  }
  return 'Không thể kết nối trợ lý AI. Vui lòng thử lại sau.'
}

interface UseAiChatOptions {
  initialContentId?: string
  initialSessionId?: string
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const { initialContentId, initialSessionId } = options
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

    const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialSessionId)
  const [activeNovelId, setActiveNovelId] = useState<string | undefined>(initialContentId)
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [input, setInput] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Trạng thái AI toàn cục của user
  const statusQuery = useQuery({
    queryKey: ['ai', 'status', user?.id],
    queryFn: async () => (await aiService.getStatus()).data,
    enabled: !!user,
  })

  // 2. Danh sách các phiên trò chuyện
  const sessionsQuery = useQuery({
    queryKey: ['ai', 'sessions'],
    queryFn: async () => (await aiService.listSessions()).data,
    enabled: statusQuery.data?.available === true,
  })

  // 3. Lịch sử của phiên hiện tại
  const historyQuery = useQuery({
    queryKey: ['ai', 'session', activeSessionId],
    queryFn: async () => (await aiService.getSession(activeSessionId!)).data,
    enabled: !!activeSessionId,
  })

  // 4. Thông tin Novel ngữ cảnh (nếu có)
  const currentNovelId = activeNovelId || historyQuery.data?.novelId || undefined
  const novelQuery = useQuery({
    queryKey: ['content', currentNovelId],
    queryFn: async () => (await contentService.getDetail(currentNovelId!)).data,
    enabled: !!currentNovelId,
  })

  // Đồng bộ tin nhắn khi đổi phiên
  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data.messages)
      if (historyQuery.data.novelId) {
        setActiveNovelId(historyQuery.data.novelId)
      }
    }
  }, [historyQuery.data])

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, historyQuery.isFetching])

  // Mutation gửi câu hỏi
  const sendMutation = useMutation({
    mutationFn: (messageText: string) =>
      aiService.sendMessage({
        sessionId: activeSessionId,
        novelId: activeSessionId ? undefined : activeNovelId,
        message: messageText,
      }),
    onSuccess: async ({ data }) => {
      setActiveSessionId(data.sessionId)
      setMessages((prev) => [...prev, data.answer])
      setErrorMessage(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ai', 'sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['ai', 'status'] }),
        queryClient.invalidateQueries({ queryKey: ['ai', 'session', data.sessionId] }),
      ])
    },
    onError: (err) => {
      setErrorMessage(getAiErrorMessage(err))
    },
  })

  // Mutation xóa phiên
  const deleteMutation = useMutation({
    mutationFn: aiService.deleteSession,
    onSuccess: async (_result, deletedSessionId) => {
      if (activeSessionId === deletedSessionId) {
        setActiveSessionId(undefined)
        setMessages([])
      }
      await queryClient.invalidateQueries({ queryKey: ['ai', 'sessions'] })
    },
    onError: (err) => {
      setErrorMessage(getAiErrorMessage(err))
    },
  })

  const sendMessage = useCallback((customText?: string) => {
    const text = (customText ?? input).trim()
    if (!text || sendMutation.isPending || statusQuery.data?.limitReached) return

    setErrorMessage(null)
    setMessages((prev) => [
      ...prev,
      {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      },
    ])
    setInput('')
    sendMutation.mutate(text)
  }, [input, sendMutation, statusQuery.data?.limitReached])

  const startNewChat = useCallback((novelIdForNewChat?: string) => {
    setActiveSessionId(undefined)
    setActiveNovelId(novelIdForNewChat)
    setMessages([])
    setErrorMessage(null)
    sendMutation.reset()
  }, [sendMutation])

  const chooseSession = useCallback((sessionId: string) => {
    setMessages([])
    setActiveSessionId(sessionId)
    setErrorMessage(null)
    sendMutation.reset()
  }, [sendMutation])

  const clearNovelContext = useCallback(() => {
    setActiveNovelId(undefined)
  }, [])

  return {
    user,
    messages,
    input,
    setInput,
    activeSessionId,
    activeNovelId,
    currentNovel: novelQuery.data,
    status: statusQuery.data,
    sessions: sessionsQuery.data,
    isStatusLoading: statusQuery.isLoading,
    isHistoryLoading: historyQuery.isLoading,
    isSending: sendMutation.isPending,
    isDeleting: deleteMutation.isPending,
    errorMessage,
    messagesEndRef,
    sendMessage,
    startNewChat,
    chooseSession,
    clearNovelContext,
    deleteSession: (id: string) => deleteMutation.mutate(id),
    refetchStatus: () => statusQuery.refetch(),
  }
}
