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

/**
 * 文件上传结果接口
 */
interface FileUploadResult {
  sessionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  textLength: number;
  question?: string;
  aiResponse?: string;
  success: boolean;
  uploadTime: string;
  errorMessage?: string;
}

/**
 * 文件上传请求参数接口
 */
 interface FileUploadParams {
  sessionId: string;
  file: File;
  question?: string;
}

/**
 * OCR识别结果接口
 */
 interface OcrResult {
  originalFilename: string;
  fileSize: number;
  recognizedText: string;
  textLength: number;
  success: boolean;
}


/**
 * 支持的文件类型
 */
 interface SupportedFormats {
  image: string[];
  pdf: string[];
  document: string[];
  maxSize: string;
  notes: string;
}


/**
 * OCR服务状态
 */
 interface OcrStatus {
  service: string;
  status: 'UP' | 'DOWN' | 'ERROR';
  timestamp: number;
  error?: string;
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
    const response = await request.post('/ai/chat/session/new', {}, {
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
  
  const response = await request.delete(`/ai/chat/session/${sessionId}`, {
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
  
  const response = await request.get(`/ai/chat/session/${sessionId}/info`, {
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
  
  const response = await request.get('/ai/chat/sessions', {
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
  
  const response = await request.get(`/ai/chat/session/${sessionId}/messages`, {
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
  
  const response = await request.put(`/ai/chat/session/${sessionId}/title`, 
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
  
  const response = await request.post('/ai/chat/sessions/cleanup', {}, {
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
  
  const response = await request.get('/ai/chat/sessions/stats', {
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
  
  // 🔥 核心修改1：创建FormData，封装所有参数（不再用URL拼接）
  const formData = new FormData();
  formData.append('message', message); // 必选参数
  if (memoryId) {
    formData.append('memoryId', String(memoryId)); // 可选参数
  }

  // 用于取消请求的控制器
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    console.log("开始SSE请求，URL:", `/ai/chat/sse`);
    
    // 发起Fetch请求，接收流式响应
    const response = await fetch(`/ai/chat/sse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
        // 🔥 核心修改2：不手动设置Content-Type，让浏览器自动生成multipart/form-data
      },
      body: formData, // 🔥 核心修改3：传递FormData，而非空
      signal: signal
    });
    
    // 以下原有逻辑完全不变
    console.log("SSE响应状态:", response.status, response.ok);
    console.log("SSE响应头:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SSE错误响应:", errorText);
      throw new Error(`SSE连接失败 (${response.status}): ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log("响应Content-Type:", contentType);
    
    if (!contentType || !contentType.includes('text/event-stream')) {
      console.warn("警告：响应不是SSE流，Content-Type:", contentType);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应流读取器");
    }

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
          const chunkText = textDecoder.decode(value, { stream: true });
          console.log(`chunk ${chunkCount} 原始数据:`, JSON.stringify(chunkText));
          console.log(`chunk ${chunkCount} 长度:`, chunkText.length);
          
          buffer += chunkText;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

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
                if (dataContent === '[DONE]' || dataContent === 'DONE' || dataContent === 'done') {
                  console.log(`行 ${i}: 收到完成标记`);
                  onComplete();
                  return;
                }
                
                try {
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
                    onMessage(event.data);
                  }
                } catch (parseError) {
                  const cleanedData = dataContent.replace(/^id:[a-f0-9\-]+/, '').trim();
                  if (cleanedData) {
                    onMessage(cleanedData);
                  }
                }
              }
            } else if (line.startsWith('event:')) {
              // 原有逻辑不变
            } else {
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
    readStream().catch(error => {
      console.error("readStream promise 拒绝:", error);
      if ((error as Error).name !== 'AbortError') {
        onError(error as Error);
        onComplete();
      }
    });

  } catch (error) {
    console.error("SSE请求捕获错误:", error);
    if ((error as Error).name !== 'AbortError') {
      onError(error as Error);
      onComplete();
    }
  }

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




/**
 * 获取支持的文件格式
 */
export const getSupportedFormats = async (): Promise<SupportedFormats> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    throw new Error('用户未登录，请先登录');
  }
  
  try {
    const response = await request.get('/ocr/supported-formats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('获取支持格式失败:', error);
    
    // 返回默认支持格式
    return {
      image: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'],
      pdf: ['pdf'],
      document: ['doc', 'docx'],
      maxSize: '10MB',
      notes: '支持中英文文字识别'
    };
  }
};

/**
 * 清理OCR缓存
 */
export const clearOcrCache = async (): Promise<{ clearedAt: number }> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    throw new Error('用户未登录，请先登录');
  }
  
  try {
    const response = await request.post('/ocr/cache/clear', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('清理OCR缓存失败:', error);
    throw error;
  }
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


/**
 * 检查文件是否支持
 */
export const isFileSupported = (
  file: File, 
  supportedFormats: SupportedFormats
): { supported: boolean; reason?: string } => {
  // 检查文件大小
  const maxSizeMB = parseInt(supportedFormats.maxSize) || 10;
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      supported: false,
      reason: `文件大小超过${maxSizeMB}MB限制`
    };
  }
  
  // 获取文件扩展名
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop() || '';
  
  // 检查是否支持该格式
  const supportedExtensions = [
    ...supportedFormats.image,
    ...supportedFormats.pdf,
    ...supportedFormats.document
  ];
  
  if (!supportedExtensions.includes(extension)) {
    return {
      supported: false,
      reason: `不支持的文件格式: .${extension}`
    };
  }
  
  return { supported: true };
};

/**
 * 获取文件类型
 */
export const getFileType = (file: File): 'image' | 'pdf' | 'document' | 'unknown' => {
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop() || '';
  
  if (['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'].includes(extension)) {
    return 'image';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  if (['doc', 'docx', 'txt', 'md'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 提取文本中的关键信息（简化版）
 */
export const extractKeyInfo = (text: string, maxLength: number = 200): string => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  
  // 尝试找到段落分隔符
  const paragraphs = text.split(/[\n\r。.]+/);
  
  if (paragraphs.length > 1) {
    // 取第一个有意义的段落
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length > 20 && paragraph.length <= maxLength) {
        return paragraph + (paragraph.endsWith('。') ? '' : '...');
      }
    }
  }
  
  // 否则截断文本
  return text.substring(0, maxLength) + '...';
};

/**
 * 验证上传参数
 */
export const validateUploadParams = (params: FileUploadParams): { valid: boolean; error?: string } => {
  if (!params.sessionId || !params.sessionId.trim()) {
    return { valid: false, error: '会话ID不能为空' };
  }
  
  if (!params.file) {
    return { valid: false, error: '请选择文件' };
  }
  
  if (params.question && params.question.trim().length > 500) {
    return { valid: false, error: '问题不能超过500个字符' };
  }
  
  return { valid: true };
};


export const uploadFileAndQuery = async (
  params: FileUploadParams
): Promise<FileUploadResult> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    throw new Error('用户未登录，请先登录');
  }
  
  // 创建FormData对象
  const formData = new FormData();
  formData.append('sessionId', params.sessionId);
  formData.append('file', params.file);
  
  if (params.question && params.question.trim()) {
    formData.append('question', params.question);
  }
  
  console.log('开始上传文件并提问:', {
    sessionId: params.sessionId,
    fileName: params.file.name,
    fileSize: params.file.size,
    question: params.question
  });
  
  try {
    // 使用统一的request实例，但要处理multipart/form-data
    const response = await request.post('/chat/upload-with-query', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        // 注意：不设置Content-Type，让浏览器自动设置multipart/form-data
      }
    });
    
    console.log('文件上传成功:', response);
    
    // 确保返回的数据结构正确
    if (response.data && typeof response.data === 'object') {
      return {
        ...response.data,
        success: response.data.success !== false
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error('文件上传失败:', error);
    
    // 统一错误处理
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      if (status === 401) {
        throw new Error('认证失败，请重新登录');
      } else if (status === 400) {
        throw new Error(`文件上传失败: ${message}`);
      } else if (status === 413) {
        throw new Error('文件太大，请上传小于10MB的文件');
      } else if (status >= 500) {
        throw new Error('服务器错误，请稍后重试');
      }
    }
    
    throw error;
  }
};


/**
 * 发送消息到AI并接收流式响应（支持附件）
 * @param memoryId 会话ID，用于维持对话上下文
 * @param message 用户消息内容
 * @param file 可选的文件附件
 * @param onMessage 消息接收回调函数
 * @param onError 错误处理回调函数
 * @param onComplete 完成回调函数
 * @returns 取消流的函数
 */
export const sseChatWithAttachment = async (
  memoryId: string | number,
  message: string,
  file: File | null,
  onMessage: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<() => void> => {
  console.log("开始SSE请求（带附件），参数:", { memoryId, message, file });
  // 获取用户token
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    onError(new Error('用户未登录，请先登录'));
    onComplete();
    return () => {};
  }
  
  // 用于取消请求的控制器
  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    const formData = new FormData();
    formData.append('memoryId', String(memoryId));
    formData.append('message', message);
    
    if (file) {
      formData.append('file', file);
    }
    
    console.log("开始SSE请求（带附件），URL:", '/ai/chat/sse');
    
    // 发起Fetch请求，接收流式响应
    const response = await fetch('/ai/chat/sse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: formData,
      signal: signal
    });
    
    console.log("SSE响应状态:", response.status, response.ok);
    
    // 检查请求是否成功
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SSE错误响应:", errorText);
      throw new Error(`SSE连接失败 (${response.status}): ${errorText || response.statusText}`);
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
          buffer += chunkText;
          
          // 处理完整的SSE事件
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留不完整的行

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim() === '') {
              continue;
            }

            if (line.startsWith('data:')) {
              const dataContent = line.slice(5).trim();
              
              if (dataContent) {
                // 检查是否是特殊标记
                if (dataContent === '[DONE]' || dataContent === 'DONE' || dataContent === 'done') {
                  onComplete();
                  return;
                }
                
                try {
                  // 尝试解析JSON
                  const event = JSON.parse(dataContent);
                  
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
                  const cleanedData = dataContent.replace(/^id:[a-f0-9\-]+/, '').trim();
                  if (cleanedData) {
                    onMessage(cleanedData);
                  }
                }
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
    readStream();
    
    // 返回取消函数
    return () => {
      console.log("取消SSE请求");
      abortController.abort();
    };
    
  } catch (error: any) {
    console.error("SSE请求失败:", error);
    onError(error);
    onComplete();
    return () => {};
  }
};

/**
 * 上传文件并继续对话（流式）
 */
export const uploadFileAndContinueChat = async (
  sessionId: string,
  file: File,
  onProgress?: (progress: number) => void,
  onTextExtracted?: (text: string) => void
): Promise<{
  text: string;
  success: boolean;
  error?: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  if (!token) {
    throw new Error('用户未登录，请先登录');
  }
  
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('file', file);
  
  try {
    // 如果有进度回调，可以在这里处理（需要后端支持进度事件）
    if (onProgress) {
      onProgress(10); // 开始上传
    }
    
    const response = await request.post('/chat/upload-with-query', formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      // 如果有进度事件支持
      onUploadProgress: (progressEvent: any) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(10 + percentCompleted * 0.8); // 上传占80%
        }
      }
    });
    
    if (onProgress) {
      onProgress(95); // 上传完成，开始处理
    }
    
    const result = response.data;
    
    if (result.success && result.extractedText) {
      if (onTextExtracted) {
        onTextExtracted(result.extractedText);
      }
      
      if (onProgress) {
        onProgress(100); // 处理完成
      }
      
      return {
        text: result.extractedText,
        success: true
      };
    } else {
      return {
        text: '',
        success: false,
        error: result.errorMessage || '文件处理失败'
      };
    }
  } catch (error: any) {
    console.error('上传文件失败:', error);
    
    return {
      text: '',
      success: false,
      error: error.message || '上传失败'
    };
  }
};
export type {
  FileUploadResult,
  FileUploadParams,
  OcrResult,
  SupportedFormats,
  OcrStatus
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
  
  // 文件上传和OCR
  uploadFileAndQuery,
  getSupportedFormats,
  clearOcrCache,
  uploadFileAndContinueChat,
  
  // 辅助函数
  formatSessionMessages,
  isSessionValid,
  getRecentSessions,
  getActiveSessions,
  isFileSupported,
  getFileType,
  formatFileSize,
  extractKeyInfo,
  validateUploadParams
};