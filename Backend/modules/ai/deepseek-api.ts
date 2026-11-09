import type { Logger } from '@nestjs/common';

// Mô tả một yêu cầu gọi function mà DeepSeek trả về cho Backend.
export interface DeepSeekToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// Mô tả một tin nhắn trong request/response của DeepSeek.
export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: DeepSeekToolCall[];
  tool_call_id?: string;
  reasoning_content?: string;
}

// Mô tả phần response mà Backend cần dùng sau khi DeepSeek hoàn tất.
export interface DeepSeekChatCompletion {
  choices: Array<{
    message: DeepSeekMessage;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

// Mô tả danh sách function mà Backend cho phép DeepSeek yêu cầu gọi.
export interface DeepSeekTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

// Mô tả dữ liệu Backend gửi lên endpoint chat completions.
export interface DeepSeekChatRequest {
  model: string;
  messages: DeepSeekMessage[];
  tools?: DeepSeekTool[];
  tool_choice?: 'auto';
  response_format?: { type: 'json_object' };
  thinking: { type: 'disabled' };
}

// Lỗi riêng của lớp gọi DeepSeek, có thể kèm HTTP status để nơi gọi phân loại.
export class DeepSeekApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'DeepSeekApiError';
  }
}

const DEEPSEEK_CHAT_COMPLETIONS_URL = 'https://api.deepseek.com/chat/completions';
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1_000;

// Gửi request đến DeepSeek, xử lý lỗi tạm thời và chuẩn hóa response trước khi trả về.
export async function requestDeepSeekChatCompletion( apiKey: string, request: DeepSeekChatRequest, logger: Logger,): Promise<DeepSeekChatCompletion> {
  // BƯỚC 1: Thử gửi request tối đa 3 lần nếu gặp lỗi mạng hoặc lỗi tạm thời.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let response: Response;
    try {
      // BƯỚC 2: Gửi model, tin nhắn và công cụ trong request đến API.
      response = await fetch(DEEPSEEK_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    } catch (error) {
      // BƯỚC 3: Chỉ xử lý TypeError như lỗi mạng; các loại lỗi khác được đẩy lên nơi gọi.
      if (!(error instanceof TypeError)) throw error;

      const networkCode = getNetworkErrorCode(error);
      if (attempt < MAX_ATTEMPTS - 1) {
        // Nếu còn lượt thử, chờ tăng dần 1s, 2s rồi gửi lại.
        const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
        logger.warn(
          `DeepSeek network request failed (${networkCode}); retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS}).`,
        );
        await delay(delayMs);
        continue;
      }

      logger.warn(`DeepSeek network request failed after ${MAX_ATTEMPTS} attempts: ${networkCode}`);
      throw new DeepSeekApiError(
        'Backend không kết nối được tới DeepSeek API. Kiểm tra DNS, mạng Internet, firewall hoặc cấu hình proxy của máy chạy Backend.',
      );
    }

    // BƯỚC 4: Đọc response thành text rồi thử phân tích JSON.
    const responseText = await response.text();
    const responseBody = parseResponseBody(responseText);
    if (!response.ok) {
      // DeepSeek trả HTTP lỗi: lấy thông báo để log và xác định có nên thử lại không.
      const providerMessage = getProviderErrorMessage(responseBody, responseText);
      const temporaryFailure = response.status === 429 || response.status >= 500;
      if (temporaryFailure && attempt < MAX_ATTEMPTS - 1) {
        // Chỉ retry các lỗi giới hạn yêu cầu (429) hoặc lỗi máy chủ (5xx).
        const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** attempt;
        logger.warn(
          `DeepSeek temporary failure HTTP ${response.status}: ${providerMessage}; retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS}).`,
        );
        await delay(delayMs);
        continue;
      }

      if (temporaryFailure) {
        logger.warn(
          `DeepSeek temporary failure after ${MAX_ATTEMPTS} attempts, HTTP ${response.status}: ${providerMessage}`,
        );
      }
      throw new DeepSeekApiError(providerMessage, response.status);
    }

    // BƯỚC 5: HTTP thành công; kiểm tra cấu trúc response rồi trả dữ liệu đã chuẩn hóa.
    return parseCompletion(responseBody);
  }

  // Phòng trường hợp vòng lặp kết thúc mà không trả kết quả hoặc ném lỗi cụ thể.
  throw new DeepSeekApiError('DeepSeek đang tạm thời không khả dụng. Vui lòng thử lại sau.');
}

// Chuyển text JSON thành dữ liệu; nếu body không phải JSON thì trả null để bước kiểm tra báo lỗi.
function parseResponseBody(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

// Kiểm tra các trường Backend cần dùng trong response và chỉ tạo ra dữ liệu hợp lệ.
function parseCompletion(value: unknown): DeepSeekChatCompletion {
  // BƯỚC 1: Đảm bảo response có ít nhất một lựa chọn (choice).
  if (!isRecord(value) || !Array.isArray(value.choices) || !value.choices.length) {
    throw new DeepSeekApiError('DeepSeek trả về response không đúng định dạng.');
  }

  // BƯỚC 2: Lấy message đầu tiên và kiểm tra nó có đúng cấu trúc không.
  const firstChoice = value.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new DeepSeekApiError('DeepSeek không trả về message hợp lệ.');
  }

  // BƯỚC 3: Chỉ nhận message do assistant tạo, với content là chuỗi hoặc null.
  const message = firstChoice.message;
  if (message.role !== 'assistant') {
    throw new DeepSeekApiError('DeepSeek trả về nội dung message không hợp lệ.');
  }
  const content = message.content === null
    ? null
    : typeof message.content === 'string'
      ? message.content
      : undefined;
  if (content === undefined) {
    throw new DeepSeekApiError('DeepSeek trả về nội dung message không hợp lệ.');
  }

  // BƯỚC 4: Nếu có tool calls, xác thực từng lệnh trước khi chuyển cho provider xử lý.
  let toolCalls: DeepSeekToolCall[] | undefined;
  if (message.tool_calls !== undefined) {
    if (!Array.isArray(message.tool_calls)) {
      throw new DeepSeekApiError('DeepSeek trả về danh sách công cụ không hợp lệ.');
    }
    toolCalls = message.tool_calls.map((toolCall) => {
      if (
        !isRecord(toolCall) ||
        typeof toolCall.id !== 'string' ||
        toolCall.type !== 'function' ||
        !isRecord(toolCall.function) ||
        typeof toolCall.function.name !== 'string' ||
        typeof toolCall.function.arguments !== 'string'
      ) {
        throw new DeepSeekApiError('DeepSeek trả về lệnh công cụ không hợp lệ.');
      }
      return {
        id: toolCall.id,
        type: 'function',
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      };
    });
  }

  // BƯỚC 5: Lấy số token nếu API có gửi và dựng response chuẩn hóa để trả về.
  const usage = isRecord(value.usage) ? value.usage : undefined;
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content,
          ...(toolCalls ? { tool_calls: toolCalls } : {}),
          ...(typeof message.reasoning_content === 'string'
            ? { reasoning_content: message.reasoning_content }
            : {}),
        },
      },
    ],
    ...(usage
      ? {
          usage: {
            ...(typeof usage.prompt_tokens === 'number'
              ? { prompt_tokens: usage.prompt_tokens }
              : {}),
            ...(typeof usage.completion_tokens === 'number'
              ? { completion_tokens: usage.completion_tokens }
              : {}),
          },
        }
      : {}),
  };
}

// Ưu tiên lấy thông báo lỗi có cấu trúc từ DeepSeek; nếu không có thì dùng response text.
function getProviderErrorMessage(value: unknown, responseText: string): string {
  if (isRecord(value) && isRecord(value.error) && typeof value.error.message === 'string') {
    return value.error.message.slice(0, 500);
  }
  return responseText.slice(0, 500) || 'DeepSeek API từ chối yêu cầu.';
}

// Lấy mã/tên lỗi mạng từ cause để log, không làm lộ toàn bộ đối tượng lỗi.
function getNetworkErrorCode(error: TypeError): string {
  if (!('cause' in error) || !isRecord(error.cause)) return 'unknown network error';
  if ('code' in error.cause && typeof error.cause.code === 'string') return error.cause.code;
  if ('name' in error.cause && typeof error.cause.name === 'string') return error.cause.name;
  return 'unknown network error';
}

// Kiểm tra giá trị có phải object thường để an toàn khi đọc các trường từ JSON không tin cậy.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Tạm dừng một khoảng thời gian trước lần thử request tiếp theo.
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
