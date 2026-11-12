import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { MAX_AI_TOOL_CALLS } from './ai.constants';
import { AiNovelToolsService } from './ai-novel-tools.service';
import type { AiSettings } from './ai-settings.service';
import {
  DeepSeekApiError,
  requestDeepSeekChatCompletion,
  type DeepSeekMessage,
  type DeepSeekTool,
} from './deepseek-api';

export interface AiHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiGenerationResult {
  answer: string;
  promptTokens: number | null;
  completionTokens: number | null;
}
//danh sách mô tả công cụ deepseek được sử dụng 
//generate answer sẽ gửi deepseek cùng promt ở AiProviderService
//deepseek đọc danh sách này và có thiêu yêu cầu công cụ 
const FUNCTION_DECLARATIONS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'getNovelInfo',
      description: 'Lấy metadata công khai của một Novel khả dụng theo ID.',
      parameters: {
        type: 'object',
        properties: {
          novelId: { type: 'string', description: 'ID của Novel.' },
        },
        required: ['novelId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'searchNovels',
      description: 'Tìm Novel công khai theo thể loại, tag, tình trạng và cách sắp xếp.',
      parameters: {
        type: 'object',
        properties: {
          genre: { type: 'string', description: 'Tên thể loại.' },
          tag: { type: 'string', description: 'Tên tag.' },
          storyStatus: {
            type: 'string',
            enum: ['Ongoing', 'Completed', 'Hiatus'],
          },
          sortBy: {
            type: 'string',
            enum: ['rating', 'newest', 'chapters'],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSimilarNovels',
      description: 'Tìm Novel khả dụng có thể loại hoặc tag tương tự một Novel.',
      parameters: {
        type: 'object',
        properties: {
          novelId: { type: 'string', description: 'ID Novel nguồn.' },
        },
        required: ['novelId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getPlatformRules',
      description: 'Trả lời câu hỏi chung về quy tắc sử dụng và loại nội dung trên nền tảng.',
    },
  },
];


//Kiểm tra API Key DeepSeek.
// Kiểm tra chế độ hoạt động của AI.
// Xây dựng danh sách tin nhắn gửi đến DeepSeek.
// Gửi request đến API.
// Xử lý các lỗi nếu DeepSeek trả về.
@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  constructor(private readonly novelTools: AiNovelToolsService) {}

  async generateAnswer( message: string, history: AiHistoryMessage[], settings: AiSettings, currentNovelId?: string | null,): Promise<AiGenerationResult> {
    //BƯỚC 1: Lấy API Key và kiểm tra chế độ hoạt động
    const apiKey = process.env.DEEPSEEK_API_KEY;
    //kiểm tra chế độ hoạt động
    const isolatedMode = process.env.AI_ASSISTANT_ISOLATED_MODE?.trim().toLowerCase() === 'true'; 
    

    if (!apiKey) {
      throw new ServiceUnavailableException('DEEPSEEK_API_KEY chưa được cấu hình');
    }

    const modelName = process.env.DEEPSEEK_MODEL_ASSISTANT || 'deepseek-flash';

    //BƯỚC 2: DỰNG MESSAGE ĐỂ GỬI ĐẾN CHO DEEPSEEK
    
    //tác dụng: chỉ dẫn hệ thống cách trả lời quy tắc nội dung và truyện hiện tại (nếu có)
    //lịch sử chat gần đây
    //câu hỏi hiện tịa với vai trò user 
    
    //Nếu isolatedMode = true: Sử dụng nội dung system dành cho kiểm tra kết nối.
    // Nếu isolatedMode = false: Sử dụng systemPrompt và các hướng dẫn liên quan đến Novel.

    const messages: DeepSeekMessage[] = [ //khai bán biến messgaes có kiểu dữ liệu là mảng 
      //mảng này có kiểu dữ liệu là deepseekmeessage 
      // (vd: interface DeepSeekMessage {
      // role: 'system' | 'user' | 'assistant';
      //content: string;
      //  })
      //mảng sẽ lưu các object, obejt đầu tiên là {role: system , stsstemprompt: trả lời vv}
      //object tiếp theo trong mảng {role: user, content: xin chào} lấy từ lịch sử
      {
        role: 'system',
        content: isolatedMode
          ? 'Trả lời ngắn gọn, hữu ích bằng tiếng Việt. Đây là chế độ kiểm tra kết nối, không có dữ liệu hoặc ngữ cảnh Novel.'
          : [
              settings.systemPrompt,
              'Chỉ dữ liệu metadata do các công cụ trả về được xem là sự thật về truyện.',
              'purchaseCostCoins là giá toàn bộ truyện khi purchaseMode="whole", hoặc giá mỗi gói 10 chương khi purchaseMode="chapter_pack"; không gọi giá gói là tổng giá toàn truyện.',
              'Không tiết lộ, tóm tắt hoặc suy đoán nội dung chương, nhân vật, diễn biến hay kết truyện.',
              'Không yêu cầu hoặc sử dụng nội dung chapter.',
              currentNovelId ? `Novel hiện tại có ID: ${currentNovelId}.` : '',
            ].filter(Boolean).join('\n'), //loại bỏ các giá trị falsy trong mảng 
      },
      //thêm lịch sủ hội thoại  (sử dụng toán tử 3 ngôi)
      //nếu isolatemode true thì bằng rỗng
      //false thì bằng lịch sử hội thoại 
      //dấu ... đưa phần tử của mảng vào mảng messages bên ngoài 
      ...(isolatedMode ? [] : this.toChatHistory(history)),
      { role: 'user', content: message },
    ];

    //hàm nội bổ gửi http request đến deepseek, xử lý lỗi mạng 
    // , api và một số lỗi khác

    let requestNumber = 0;
    //BƯỚC 3: GỬI REQUEST ĐẾN CHO DEEPSEEK
    //Hàm con sendGenerationRequest() đóng gói model, messages và các 
    // công cụ được phép dùng, rồi gọi DeepSeek qua requestDeepSeekChatCompletion() 
    // trong deepseek-api.ts
    const sendGenerationRequest = async () => {
      requestNumber += 1;
      this.logger.log(
        `Submitting DeepSeek request #${requestNumber}: model=${modelName}, isolatedMode=${isolatedMode}, historyMessages=${messages.length - 2}, messageChars=${message.length}.`,
      );
      try {
        return await requestDeepSeekChatCompletion(
          apiKey,
          {
            model: modelName,
            messages,
            thinking: { type: 'disabled' },
            ...(isolatedMode
              ? {}
              : { tools: FUNCTION_DECLARATIONS, tool_choice: 'auto' as const }),
          },
          this.logger,
        );
      } catch (error) {
        if (!(error instanceof DeepSeekApiError)) throw error;

        this.logger.warn(
          `DeepSeek request failed: model=${modelName}, HTTP ${error.status ?? 'network'}, provider=${error.message}`,
        );
        if (error.status === 401 || error.status === 403) {
          throw new ServiceUnavailableException('DEEPSEEK_API_KEY không hợp lệ hoặc chưa được cấp quyền');
        }
        if (error.status === 404) {
          throw new ServiceUnavailableException(
            `DeepSeek không tìm thấy model "${modelName}" hoặc model không khả dụng cho API key.`,
          );
        }
        if (error.status === 429) {
          throw new ServiceUnavailableException(
            'DeepSeek tiếp tục giới hạn yêu cầu hoặc hết quota sau 3 lần thử. Vui lòng kiểm tra quota API và thử lại sau.',
          );
        }
        if (error.status !== undefined && error.status >= 500) {
          throw new ServiceUnavailableException(
            `DeepSeek tạm thời không khả dụng (HTTP ${error.status}) sau 3 lần thử. Vui lòng thử lại sau.`,
          );
        }
        if (error.status === 400) {
          throw new ServiceUnavailableException(
            'DeepSeek từ chối định dạng hoặc tham số yêu cầu. Kiểm tra log backend để xem chi tiết lỗi từ nhà cung cấp.',
          );
        }
        throw new ServiceUnavailableException(error.message);
      }
    };
    //BƯỚC 5 KIỂM TRA PHẢN HỒI CỦA DEEPSEEK
    //Trong vòng lặp, provider kiểm tra phản hồi:
    //Có câu trả lời cuối: lấy nội dung, cộng dồn số token rồi trả kết quả.
    // Có yêu cầu gọi tool: phân tích tham số, chạy executeTool(), thêm kết quả tra cứu vào messages, rồi gọi lại sendGenerationRequest() để DeepSeek viết câu trả lời dựa trên dữ liệu đó.
    // Ví dụ: DeepSeek có thể yêu cầu searchNovels; backend chạy tool tra cứu truyện, đưa kết quả về lại cho DeepSeek, rồi nhận câu trả lời dạng dễ đọc.
    let result = await sendGenerationRequest();
    let promptTokens = 0;
    let completionTokens = 0;

    let executedToolCalls = 0;
    while (true) {
      const completion = result.choices[0]; //lấy phần tử đầu tiên trong mảng choices
      //của object result, Ai nó trả nhiều phương án trả lời, mình lấy cái đầu thôi 
      promptTokens += result.usage?.prompt_tokens ?? 0;
      completionTokens += result.usage?.completion_tokens ?? 0;

      const calls = completion.message.tool_calls ?? []; 
      //Lấy danh sách các tool mà AI muốn gọi từ completion.message.tool_calls
      //không thì bằng rỗng 


      //nếu AI không yêu cầu tools nào thì chả theo dòng if
      if (!calls.length) {
        const answer = completion.message.content?.trim() ?? '';
        if (!answer) {
          throw new ServiceUnavailableException('AI không trả về nội dung phản hồi');
        }
        return {
          answer,
          promptTokens: promptTokens || null,
          completionTokens: completionTokens || null,
        };
      }
      if (isolatedMode) {
        throw new ServiceUnavailableException(
          'DeepSeek yêu cầu công cụ trong khi chế độ kiểm tra cô lập đang bật',
        );
      }
      if (executedToolCalls + calls.length > MAX_AI_TOOL_CALLS) {
        throw new ServiceUnavailableException('AI vượt quá số lượt tra cứu cho một câu hỏi');
      }
      executedToolCalls += calls.length;

      //  DeepSeek yêu cầu backend gọi một công cụ tra cứu thay vì trả lời ngay. 
      messages.push(completion.message);
      for (const call of calls) { //DeepSeek có thể yêu cầu một hoặc nhiều tool; vòng lặp xử lý từng yêu cầu.
        const args = this.parseToolArguments(call.function.arguments);
        //chuyển chuỗi tham số do json của deepseek thành dạn objeect
        const toolResponse = await this.executeTool(call.function.name, args);
        //dựa vaoteen tool rồi gọi hàm tương ứng 
        messages.push({ //đưa kết quả tra cứu vào lịch sử reqquest của deepseek
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toolResponse),
        });
      }

        //gửi toàn bộ messehes hiện có cho deepseek
        
      result = await sendGenerationRequest();
    }
  }
  //hàm chuẩn hóa history được gửi vào thành dạng DeepseekMEssage[] thông qua map , để có thể gửi cho deepseek 
  private toChatHistory(history: AiHistoryMessage[]): DeepSeekMessage[] {
    //deepseekmessage nó là kiểu dữ liệu đầu ra, phải theo khuôn đó 

    const recent = history.slice(-2); //lấy 2 tin nhắn cuối trong 
    //lịch sử cũ làm ngữ cảnh, chỉ lấy tin nhắn của người dùng  
    if (recent[0]?.role === 'assistant') recent.shift(); 
    //bỏ câu trả lời của Ai nếu lấy 

    //tạo mảng mới chỉ gồm của role và content ,
    // đúng cấu trúc message mà deepseek nhận 
    return recent.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }));
  }

  private parseToolArguments(value: string): Record<string, unknown> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      throw new ServiceUnavailableException('DeepSeek trả về tham số công cụ không phải JSON hợp lệ');
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new ServiceUnavailableException('DeepSeek trả về tham số công cụ không hợp lệ');
    }
    if (!isRecord(parsed)) {
      throw new ServiceUnavailableException('DeepSeek trả về tham số công cụ không hợp lệ');
    }
    return parsed;
  }

  private async executeTool(name: string, input: Record<string, unknown>): Promise<object> {
    //name: tên tool deepseek yêu cầu 
    //input: tham số tool gửi gửi kèm
    //promise<object> hàm bất đồng bộ , trả về một object kết quả 
    switch (name) {  //name: tên tool deepseek yêu cầu  
      //kiểm tra novelId có phải chuỗi , rồi gọi lấy thông tin 
      case 'getNovelInfo':
        return typeof input.novelId === 'string'
          ? this.novelTools.getNovelInfo(input.novelId)
          : { found: false };
      case 'searchNovels':
        //trường hợp 
        return this.novelTools.searchNovels({
          genre: this.asText(input.genre),
          tag: this.asText(input.tag),
          storyStatus: this.asStoryStatus(input.storyStatus),
          sortBy: this.asNovelSort(input.sortBy),
        });
      case 'getSimilarNovels':
        return typeof input.novelId === 'string'
          ? this.novelTools.getSimilarNovels(input.novelId)
          : { found: false, items: [] };
      case 'getPlatformRules':
        return {
          rules: [
            'Coin là đơn vị dùng để mua nội dung trả phí trên nền tảng.',
            'Số chương đọc thử và giá coin được hiển thị trên trang thông tin truyện.',
            'Licensed là truyện có bản quyền chính thức; Original là tác phẩm gốc; Fan Translation là bản dịch cộng đồng.',
            'Trợ lý AI mức A chỉ cung cấp metadata công khai của Novel, không truy cập nội dung chương.',
          ],
        };
      default:
        return { error: 'Công cụ không được hỗ trợ.' };
    }
  }
//chỉ nhận chuỗi không rỗng , bỏ khoảng trắng, tối đa 1000 kí tự
  private asText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : undefined;
  }
  //chỉ nhận 1 trong 3 trạng thái ongoing , completed, hiatus
  private asStoryStatus(value: unknown): NovelSearchFilters['storyStatus'] {
    return value === 'Ongoing' || value === 'Completed' || value === 'Hiatus'
      ? value
      : undefined;
  }
  //chỉ nhận 1 trong 2 cách sắp xếp 
  private asNovelSort(value: unknown): NovelSearchFilters['sortBy'] {
    return value === 'rating' || value === 'newest' || value === 'chapters'
      ? value
      : undefined;
  }
}

interface NovelSearchFilters {
  storyStatus?: 'Ongoing' | 'Completed' | 'Hiatus';
  sortBy?: 'rating' | 'newest' | 'chapters';
}

//kiểm tra 1 giá trị bất kì có phải dạng object, và phải dạng key value không 
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


