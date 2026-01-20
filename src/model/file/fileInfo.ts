export interface FileInfo {
    fileName: string; // 文件名
    fileSize: number; // 文件大小（字节）
    category: string; // 文件类型（如：image/jpeg）
    md5: string; // 文件MD5值
    userId: number; // 用户ID
    clientIp: string; // 客户端IP地址
}