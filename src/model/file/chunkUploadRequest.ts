export interface CheckUploadRequest  {
    fileId:number,
    chunkIndex:number,
    chunk: Blob; // 文件分片
    chunkHash: string; // 分片哈希
    totalChunks: number; // 总分片数
    clientIp: string; // 上传者IP
  }

