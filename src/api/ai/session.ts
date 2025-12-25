import request from "../../utils/request";
import useUserStore from "../../store/modules/user";

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
 * 创建新会话
 */
export const createNewSession = async (): Promise<{
  sessionId: string;
  userId: number;
  createdAt: string;
}> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.post('/api/chat/session/new', {}, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
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
  
  const response = await request.delete(`/api/chat/session/${sessionId}`, {
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
  
  const response = await request.get(`/api/chat/session/${sessionId}/info`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};

/**
 * 获取用户所有历史会话
 */
export const getUserSessions = async (): Promise<SessionsResponse> => {
  const UserStore = useUserStore();
  const token = UserStore.token;
  
  const response = await request.get('/api/chat/sessions', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
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
  
  const response = await request.put(`/api/chat/session/${sessionId}/title?title=${encodeURIComponent(title)}`, {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
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
  
  const response = await request.post('/api/chat/sessions/cleanup', {}, {
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
  
  const response = await request.get('/api/chat/sessions/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.data;
};