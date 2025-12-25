import request from "../../utils/request";
import useUserStore from "../../store/modules/user";

/**
 * AI聊天服务API
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 发送消息到AI并接收流式响应（使用Fetch API模拟SSE，支持自定义Header）
 * @param memoryId 会话ID，用于维持对话上下文
 * @param message 用户消息内容
 * @param onMessage 消息接收回调函数
 * @param onError 错误处理回调函数
 * @param onComplete 完成回调函数
 * @returns 取消流的函数
 */
export const sseChat = async (
  memoryId: string | number,
  message: string,
  onMessage: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<() => void> => {
  // 获取用户token
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  // 构建查询参数
  const params = new URLSearchParams({
    memoryId: String(memoryId),
    message: message
  });

  // 用于取消请求的控制器
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    // 发起Fetch请求，接收流式响应
    const response = await fetch(`/api/chat/sse?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream', // 声明接收SSE格式
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      signal: signal
    });

    // 检查请求是否成功
    if (!response.ok) {
      throw new Error(`SSE连接失败，状态码：${response.status}，信息：${response.statusText}`);
    }

    // 获取流读取器
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应流读取器，不支持流式响应");
    }

    // 文本解码器，用于解析二进制流
    const textDecoder = new TextDecoder('UTF-8');
    // 缓存未完整解析的内容
    let remainingData = '';

    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read();

      // 流读取完成
      if (done) {
        break;
      }

      // 解码二进制数据为字符串，并拼接剩余数据
      const chunkStr = remainingData + textDecoder.decode(value, { stream: true });
      // 按行分割（SSE格式每行以\n分隔）
      const lines = chunkStr.split(/\r?\n/);
      // 最后一行可能不完整，缓存起来
      remainingData = lines.pop() || '';

      // 解析每一行的SSE数据
      for (const line of lines) {
        if (!line) continue;

        // SSE标准格式：data: 内容\n\n
        if (line.startsWith('data:')) {
          try {
            // 截取"data: "后面的内容并去除首尾空格
            const dataContent = line.slice(5).trim();
            if (!dataContent) continue;

            // 解析后端返回的JSON数据
            const apiResponse = JSON.parse(dataContent);
            // 正常返回消息内容
            if (apiResponse.success && apiResponse.data) {
              onMessage(apiResponse.data);
            }
            // 对话完成标识（可根据后端实际返回调整）
            else if (apiResponse.event === 'complete' || apiResponse.message === '对话完成') {
              onComplete();
            }
          } catch (parseError) {
            // 非JSON格式的纯文本（直接作为消息内容）
            const pureText = line.slice(5).trim();
            if (pureText) {
              onMessage(pureText);
            }
          }
        }
        // SSE错误事件
        else if (line.startsWith('error:')) {
          const errorMsg = line.slice(6).trim();
          throw new Error(errorMsg || 'SSE流式传输错误');
        }
      }
    }

    // 流读取完成后执行回调
    onComplete();
  } catch (error) {
    // 排除主动取消的错误
    if ((error as Error).name !== 'AbortError') {
      onError(error as Error);
      onComplete();
    }
  }

  // 返回取消流式请求的函数
  return () => {
    abortController.abort();
  };
};