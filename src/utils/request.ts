import axios, { AxiosResponse } from "axios";
import useUserStore from "../store/modules/user";
import { ElMessage, ElMessageBox } from 'element-plus';

// 响应数据结构定义
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  status: number;
}

// HTTP状态码枚举
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

// 类型守卫：判断是否为成功响应
export const isSuccessResponse = <T = any>(response: ApiResponse<T>): response is ApiResponse<T> => {
  console.log("response.success === true：",response.success === true);
  console.log("response.status ：",response);
  return response.success === true && response.status === HttpStatus.OK;
};

// 创建Axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// 请求拦截器
request.interceptors.request.use((config) => {
  const userStore = useUserStore();
  // 添加Token认证
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
}, (error) => {
  // 请求配置错误处理
  ElMessage.error('请求配置异常，请稍后重试');
  return Promise.reject(error);
});

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse): any => {
    // 1. 先判断是否为文件下载请求
    const isDownloadRequest = 
      // 方式1：通过响应类型判断（推荐）
      response.headers['content-type']?.includes('application/octet-stream') ||
      // 方式2：通过响应头判断是否有Content-Disposition
      response.headers['content-disposition']?.includes('attachment') ||
      // 方式3：通过请求URL包含download关键词判断
      response.config.url?.includes('/download/');
    
    // 2. 如果是文件下载接口，直接返回完整响应（不解析JSON）
    if (isDownloadRequest) {
      console.log("文件下载响应，跳过拦截器解析");
      return response; // 返回完整的response对象
    }
   // 3. 如果不是下载请求，才当作JSON API响应处理
   const apiResponse = response.data;
    
    // 使用类型守卫检查响应是否成功
    if (isSuccessResponse(apiResponse)) {
      return apiResponse.data;
    }

    // 业务逻辑错误（success: false）
    console.error(`业务错误 [${apiResponse.status}]: ${apiResponse.message}`);
    
    // 处理特定的状态码 - 使用ElMessage提示
    switch (apiResponse.status) {
      case HttpStatus.UNAUTHORIZED:
        // token过期，跳转到登录页
        ElMessage({
          type: 'warning',
          message: '登录已过期，请重新登录',
          duration: 2000,
          onClose: () => {
            const userStore = useUserStore();
            userStore.token = '';
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        });
        break;
      
      case HttpStatus.FORBIDDEN:
        // 权限不足
        ElMessage({
          type: 'error',
          message: '权限不足，无法访问',
          duration: 3000
        });
        break;
      
      case HttpStatus.NOT_FOUND:
        // 资源不存在
        ElMessage({
          type: 'warning',
          message: apiResponse.message || '请求的资源不存在',
          duration: 3000
        });
        break;
      
      case HttpStatus.INTERNAL_SERVER_ERROR:
        // 服务器错误
        ElMessage({
          type: 'error',
          message: '服务器内部错误，请联系管理员',
          duration: 3000
        });
        break;
      
      default:
        // 其他业务错误，显示后端返回的消息
        ElMessage({
          type: 'error',
          message: apiResponse.message || '操作失败',
          duration: 3000
        });
    }

    // 抛出错误，让调用方可以catch处理
    const error = new Error(apiResponse.message || '请求失败');
    (error as any).status = apiResponse.status;
    (error as any).response = apiResponse;
    return Promise.reject(error);
  },
  // HTTP错误处理（网络错误或HTTP状态码错误）
  (error) => {
    let message = '网络错误，请稍后重试';
    let status = 0;
    let errorType: 'success' | 'warning' | 'info' | 'error' = 'error';

    if (error.response) {
      // 服务器返回了响应，但状态码不在2xx范围
      status = error.response.status;
      const data = error.response.data;

      // 尝试获取后端返回的错误消息
      if (data && typeof data === 'object' && data.message) {
        message = data.message;
      } else {
        // 根据HTTP状态码设置默认消息
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            message = '请求参数错误';
            errorType = 'warning';
            break;
          case HttpStatus.UNAUTHORIZED:
            message = '未授权，请重新登录';
            errorType = 'warning';
            // 401错误特殊处理：确认是否跳转登录
            ElMessageBox.confirm(
              '登录状态已过期，请重新登录',
              '提示',
              {
                confirmButtonText: '重新登录',
                cancelButtonText: '取消',
                type: 'warning',
              }
            ).then(() => {
              const userStore = useUserStore();
              userStore.token = '';
              localStorage.removeItem('token');
              window.location.href = '/login';
            }).catch(() => {
              // 用户取消，不做处理
            });
            return Promise.reject(error); // 直接返回，避免重复提示
          case HttpStatus.FORBIDDEN:
            message = '拒绝访问';
            errorType = 'error';
            break;
          case HttpStatus.NOT_FOUND:
            message = '请求的资源不存在';
            errorType = 'warning';
            break;
          case HttpStatus.REQUEST_TIMEOUT:
            message = '请求超时';
            errorType = 'warning';
            break;
          case HttpStatus.INTERNAL_SERVER_ERROR:
            message = '服务器内部错误';
            errorType = 'error';
            break;
          case HttpStatus.BAD_GATEWAY:
            message = '网关错误';
            errorType = 'error';
            break;
          case HttpStatus.SERVICE_UNAVAILABLE:
            message = '服务不可用';
            errorType = 'error';
            break;
          case HttpStatus.GATEWAY_TIMEOUT:
            message = '网关超时';
            errorType = 'warning';
            break;
          default:
            message = `请求失败 (${status})`;
            errorType = 'error';
        }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      if (error.code === 'ECONNABORTED') {
        message = '请求超时，请检查网络连接';
        errorType = 'warning';
      } else {
        message = '网络异常，请检查网络连接';
        errorType = 'error';
      }
    } else {
      message = error.message || '请求配置错误';
      errorType = 'error';
    }

    console.error(`HTTP错误 [${status}]: ${message}`);

    // 显示错误提示（401错误已特殊处理，这里不再重复显示）
    ElMessage({
      type: errorType,
      message: message,
      duration: 3000,
      showClose: true, // 显示关闭按钮
    });

    const customError = new Error(message);
    (customError as any).status = status;
    (customError as any).originalError = error;
    return Promise.reject(customError);
  }
);




export default request;