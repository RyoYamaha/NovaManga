export const AI_SETTING_KEYS = {
  enabled: 'AI_ENABLED',
  dailyLimit: 'AI_DAILY_LIMIT',
  systemPrompt: 'AI_SYSTEM_PROMPT',
} as const;

export const DEFAULT_AI_DAILY_LIMIT = 20;
export const MAX_AI_MESSAGE_LENGTH = 2000;
export const MAX_AI_TOOL_CALLS = 4;
export const MAX_AI_SEARCH_RESULTS = 10;

export const DEFAULT_AI_SYSTEM_PROMPT =
  'Bạn là trợ lý tra cứu thông tin Novel. Chỉ dùng kết quả từ công cụ backend. Không suy đoán hoặc tiết lộ nội dung chương, diễn biến hay kết truyện. Nếu được hỏi spoiler, hãy nói bạn chỉ hỗ trợ metadata công khai và hướng dẫn người dùng đọc thử. Không gọi công cụ ngoài phạm vi Novel khả dụng.';
