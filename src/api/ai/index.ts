// chat.ts - 聊天相关API整合
import request from "../../utils/request";
import useUserStore from "../../store/modules/user";

// ==================== 类型定义 ====================

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 会话信息接口
 */
export interface SessionInfo {
  sessionId: string;
  isValid: boolean;
  userId: string;
  title: string;
  createdAt: string;
  lastAccessed: string;
  messageCount: number;
  expiryTime: string;
  hasPermission: boolean;
}

/**
 * 会话列表项接口
 */
export interface SessionItem {
  sessionId: string;
  title: string;
  userId: string;
  createdAt: string;
  lastAccessed: string;
  messageCount: number;
  expiryTime: string;
  isValid: boolean;
}

/**
 * 会话列表响应接口
 */
export interface SessionsResponse {
  userId: string;
  total: number;
  validCount: number;
  sessions: SessionItem[];
}

/**
 * 会话消息项接口
 */
export interface SessionMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sessionId: string;
}

/**
 * 会话消息响应接口
 */
export interface SessionMessagesResponse {
  sessionId: string;
  messages: SessionMessageItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ==================== 会话管理API ====================

/**
 * 创建新会话
 */
export const createNewSession = async ()=> {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  console.log('开始创建会话，Token:', token);
  
  try {
    const response = await request.post('/chat/session/new', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('创建会话响应:', response);

    
    // 检查数据结构
    if (response && typeof response === 'object') {
      console.log('sessionId:', response.sessionId);
      console.log('userId:', response.userId);
      console.log('createdAt:', response.createdAt);
      console.log('userId类型:', typeof response.userId);
    }
    
    return response;
  } catch (error) {
    console.error('创建会话API错误:', error);
    throw error;
  }
};

/**
 * 删除会话
 */
export const deleteSession = async (sessionId: string): Promise<{
  sessionId: string;
  userId: number;
  deletedAt: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.delete(`/chat/session/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

/**
 * 获取会话详情
 */
export const getSessionInfo = async (sessionId: string): Promise<SessionInfo> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.get(`/chat/session/${sessionId}/info`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

/**
 * 获取用户所有历史会话
 */
export const getUserSessions = async ()=> {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.get('/chat/sessions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response;
};

/**
 * 获取会话消息
 */
export const getSessionMessages = async (
  sessionId: string, 
) => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.get(`/chat/session/${sessionId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log("api res:",response);
  return response;
};

/**
 * 更新会话标题
 */
export const updateSessionTitle = async (sessionId: string, title: string): Promise<{
  sessionId: string;
  userId: number;
  title: string;
  updatedAt: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.put(`/chat/session/${sessionId}/title`, 
    { title },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};

/**
 * 清理过期会话
 */
export const cleanupExpiredSessions = async (): Promise<{
  userId: number;
  cleanupTime: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.post('/chat/sessions/cleanup', {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

/**
 * 获取会话统计信息
 */
export const getSessionStats = async (): Promise<{
  userId: number;
  userSessionCount: number;
  totalSessions: number;
  currentTime: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.get('/chat/sessions/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// ==================== AI聊天API ====================

/**
 * SSE事件类型
 */
export interface SSEEvent {
  type: 'message' | 'complete' | 'error';
  data?: any;
  message?: string;
}

/**
 * 发送消息到AI并接收流式响应
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
  
  if (!token) {
    onError(new Error('用户未登录，请先登录'));
    onComplete();
    return () => {};
  }
  
  // 构建查询参数
  const params = new URLSearchParams({
    memoryId: String(memoryId),
    message: message
  });

  // 用于取消请求的控制器
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    console.log("开始SSE请求，URL:", `/api/chat/sse?${params.toString()}`);
    
    // 发起Fetch请求，接收流式响应
    const response = await fetch(`/api/chat/sse?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      signal: signal
    });
    
    console.log("SSE响应状态:", response.status, response.ok);
    console.log("SSE响应头:", Object.fromEntries(response.headers.entries()));
    
    // 检查请求是否成功
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SSE错误响应:", errorText);
      throw new Error(`SSE连接失败 (${response.status}): ${errorText || response.statusText}`);
    }

    // 检查响应类型
    const contentType = response.headers.get('content-type');
    console.log("响应Content-Type:", contentType);
    
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.warn("警告：响应不是SSE流，Content-Type:", contentType);
      // 不抛出错误，尝试继续处理
    }

    // 获取流读取器
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error("无法获取响应流读取器");
    }

    // 文本解码器，用于解析二进制流
    const textDecoder = new TextDecoder('utf-8');
    let buffer = '';
    
    const readStream = async () => {
      try {
        let chunkCount = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("流读取完成，总共收到", chunkCount, "个chunk");
            onComplete();
            break;
          }

          chunkCount++;
          
          // 解码数据并追加到缓冲区
          const chunkText = textDecoder.decode(value, { stream: true });
          console.log(`chunk ${chunkCount} 原始数据:`, JSON.stringify(chunkText));
          console.log(`chunk ${chunkCount} 长度:`, chunkText.length);
          
          buffer += chunkText;
          
          // 处理完整的SSE事件
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留不完整的行

          console.log(`chunk ${chunkCount} 分割为 ${lines.length} 行，buffer剩余: ${buffer.length}`);
          
       for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          console.log(`行 ${i}: ${JSON.stringify(line)}`);
          
          if (line.trim() === '') {
            console.log(`行 ${i}: 空行，跳过`);
            continue;
          }

          if (line.startsWith('data:')) {
            const dataContent = line.slice(5).trim();
            console.log(`行 ${i}: 找到data，内容: ${JSON.stringify(dataContent)}`);
            
            if (dataContent) {
              // 检查是否是特殊标记
              if (dataContent === '[DONE]' || dataContent === 'DONE' || dataContent === 'done') {
                console.log(`行 ${i}: 收到完成标记`);
                onComplete();
                return;
              }
              
              try {
                // 尝试解析JSON
                const event = JSON.parse(dataContent);
                console.log(`行 ${i}: 解析为JSON:`, event);
                
                if (event.type === 'message' && event.data) {
                  onMessage(event.data);
                } else if (event.type === 'complete') {
                  onComplete();
                  return;
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'SSE流错误');
                } else if (event.data) {
                  // 如果有data字段，即使type不是message也发送
                  onMessage(event.data);
                }
              } catch (parseError) {
                // 如果不是JSON，直接作为消息内容
                console.log(`行 ${i}: 不是JSON，直接作为消息:`, dataContent);
                
                // 过滤掉消息ID - 添加这行
                const cleanedData = dataContent.replace(/^id:[a-f0-9\-]+/, '').trim();
                if (cleanedData) {
                  onMessage(cleanedData);
                }
              }
            }
          } else if (line.startsWith('event:')) {
            // ... 其他代码不变
          } else {
            console.log(`行 ${i}: 未知格式，直接作为消息:`, line);
            
            // 过滤掉消息ID - 添加这行
            const cleanedLine = line.replace(/^id:[a-f0-9\-]+/, '').trim();
            if (cleanedLine) {
              onMessage(cleanedLine);
            }
          }
        }
        }
      } catch (streamError) {
        console.error("读取流过程中出错:", streamError);
        if ((streamError as Error).name !== 'AbortError') {
          onError(streamError as Error);
          onComplete();
        }
      }
    };

    console.log("开始读取流数据");
    // 开始读取流
    readStream().catch(error => {
      console.error("readStream promise 拒绝:", error);
      if ((error as Error).name !== 'AbortError') {
        onError(error as Error);
        onComplete();
      }
    });

  } catch (error) {
    console.error("SSE请求捕获错误:", error);
    // 排除主动取消的错误
    if ((error as Error).name !== 'AbortError') {
      onError(error as Error);
      onComplete();
    }
  }

  // 返回取消流式请求的函数
  return () => {
    console.log("取消SSE请求");
    abortController.abort();
  };
};

/**
 * 非流式聊天（备用方案）
 */
export const chat = async (
  memoryId: string | number,
  message: string
): Promise<{
  success: boolean;
  data: string;
  message?: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    throw new Error('用户未登录');
  }
  
  const response = await request.post('/chat', {
    memoryId,
    message
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

// ==================== 辅助函数 ====================

/**
 * 格式化会话消息为前端消息格式
 */
export const formatSessionMessages = (messages: SessionMessageItem[]): ChatMessage[] => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: new Date(msg.timestamp).getTime()
  }));
};

/**
 * 检查会话是否有效
 */
export const isSessionValid = (session: SessionItem | SessionInfo): boolean => {
  if (!session.isValid) return false;
  
  if (session.expiryTime) {
    const expiryTime = new Date(session.expiryTime).getTime();
    return Date.now() < expiryTime;
  }
  
  return true;
};

/**
 * 获取最近的会话
 */
export const getRecentSessions = (sessions: SessionItem[], limit = 10): SessionItem[] => {
  return sessions
    .filter(session => isSessionValid(session))
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, limit);
};

/**
 * 获取活跃会话（最近7天内有活动的）
 */
export const getActiveSessions = (sessions: SessionItem[]): SessionItem[] => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return sessions.filter(session => {
    if (!isSessionValid(session)) return false;
    
    const lastAccessed = new Date(session.lastAccessed).getTime();
    return lastAccessed > sevenDaysAgo;
  });
};

// 导出所有类型和函数
export type {
  // 可以在这里重新导出需要的类型
};

export default {
  // 会话管理
  createNewSession,
  deleteSession,
  getSessionInfo,
  getUserSessions,
  getSessionMessages,
  updateSessionTitle,
  cleanupExpiredSessions,
  getSessionStats,
  
  // AI聊天
  sseChat,
  chat,
  
  // 辅助函数
  formatSessionMessages,
  isSessionValid,
  getRecentSessions,
  getActiveSessions
};