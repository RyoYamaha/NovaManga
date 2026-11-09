export interface AiStatus {
  enabled: boolean
  available: boolean
  blocked: boolean
  limitReached: boolean
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface AiChatSession {
  id: string
  novelId: string | null
  createdAt: string
  updatedAt: string
  novel: { title: string } | null
  messages: Array<Pick<AiChatMessage, 'role' | 'content' | 'createdAt'>>
}

export interface AiSessionDetail extends Omit<AiChatSession, 'messages'> {
  messages: AiChatMessage[]
}

export interface AiChatResponse {
  sessionId: string
  answer: AiChatMessage
}

export interface AiSettings {
  enabled: boolean
  dailyLimit: number
  systemPrompt: string
}

export interface AiUsageStats {
  totalRequests: number
  failedRequests: number
  promptTokens: number
  completionTokens: number
  estimatedCostUsd: number | null
}

export interface AiManagedUser {
  id: string
  username: string
  email: string
  role: string
  aiBlocked: boolean
}
