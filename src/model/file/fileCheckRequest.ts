export interface FileCheckRequest {
    /**
     * 文件名（必填）
     */
    fileName: string;
  
    /**
     * 文件大小（字节，必填，必须大于0）
     */
    fileSize: number;
  
    /**
     * 文件MD5值（必填，用于校验文件唯一性/断点续传）
     */
    md5: string;
  
    /**
     * 用户ID（可选）
     */
    userId?: number;
  
    /**
     * 文件分类（可选）
     */
    category?: string;
  
    /**
     * 客户端IP（可选，注意：Java端字段名是ClientIp，TS保持一致）
     */
    clientIp?: string;
  }
  