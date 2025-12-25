// api-response.type.ts

/**
 * 后端API响应基类
 */
export interface ApiResponse<T = any> {
  status: number;
  success: boolean;
  message: string;
  data?: T | null;
}

/**
 * 成功响应的类型守卫
 */
export function isSuccessResponse<T = any>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success && response.data !== undefined && response.data !== null;
}

/**
 * 错误响应的类型守卫
 */
export function isErrorResponse<T = any>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false } {
  return !response.success;
}

/**
 * API响应构建器
 * 模拟Java中的静态工厂方法
 */
export class ApiResponseBuilder {
  /**
   * 成功响应（无数据）
   * 对应Java的 success(int status, String message)
   */
  static success<T = any>(status: number, message: string): ApiResponse<T> {
    return {
      status,
      success: true,
      message,
      data: null as any
    };
  }

  /**
   * 成功响应（有数据）
   * 对应Java的 success(int status, String message, Object data)
   */
  static successWithData<T = any>(
    status: number, 
    message: string, 
    data: T
  ): ApiResponse<T> {
    return {
      status,
      success: true,
      message,
      data
    };
  }

  /**
   * 错误响应
   * 对应Java的 error(int status, String message)
   */
  static error<T = any>(status: number, message: string): ApiResponse<T> {
    return {
      status,
      success: false,
      message,
      data: null as any
    };
  }
}

/**
 * 常用的HTTP状态码常量
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * 常用的响应消息常量
 */
export const ApiMessages = {
  SUCCESS: '请求成功',
  CREATED: '创建成功',
  UPDATED: '更新成功',
  DELETED: '删除成功',
  BAD_REQUEST: '请求参数错误',
  UNAUTHORIZED: '未授权，请重新登录',
  FORBIDDEN: '权限不足，拒绝访问',
  NOT_FOUND: '请求的资源不存在',
  INTERNAL_ERROR: '服务器内部错误'
} as const;