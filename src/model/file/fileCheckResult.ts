/**
 * 文件校验结果 DTO
 * 对应 Java 端：org.example.backend.dto.FileCheckResult
 * 用途：文件上传前校验返回的结果（判断是否已上传、断点续传等）
 */
export interface FileCheckResult {
    /**
     * 文件是否已存在（数据库/存储系统中）
     */
    exist: boolean;
  
    /**
     * 是否跳过上传（文件已完整上传，无需再传）
     */
    skipUpload: boolean;
  
    /**
     * 文件唯一ID（新建/已存在的文件ID）
     * Java Long → TS number（前端无Long类型，用number兼容）
     */
    fileId?: number;
  
    /**
     * 已上传的切片索引列表（断点续传用）
     * Java List<Integer> → TS number[]
     */
    uploadedChunks?: number[];
  
    /**
     * 文件总分片数
     * Java Integer → TS number
     */
    totalChunks?: number;
  
    /**
     * 单切片大小（字节，默认10MB）
     * Java Long → TS number
     */
    chunkSize?: number;
  
    /**
     * 文件最终存储路径（仅文件完整上传后返回）
     */
    filePath?: string;
  
    /**
     * 上传状态：0-未开始 1-上传中 2-已完成
     * Java Integer → TS number
     */
    uploadStatus?: number;
  
    /**
     * 提示消息（如校验失败原因、断点续传提示等）
     */
    message?: string;
  }
  
  /**
   * 上传状态枚举（对应 uploadStatus 字段）
   * 提升代码可读性，避免硬编码数字
   */
  export enum UploadStatusEnum {
    /** 未开始上传 */
    NOT_STARTED = 0,
    /** 上传中 */
    UPLOADING = 1,
    /** 上传完成 */
    COMPLETED = 2,
    /**
     * 上传失败
     */
    DEFEAT=3
  }
  
  /**
   * 创建默认的 FileCheckResult 对象
   * 避免前端访问空值报错，初始化时使用
   */
  export function createDefaultFileCheckResult(): FileCheckResult {
    return {
      exist: false,
      skipUpload: false,
      fileId: undefined,
      uploadedChunks: [],
      totalChunks: undefined,
      chunkSize: undefined,
      filePath: undefined,
      uploadStatus: UploadStatusEnum.NOT_STARTED,
      message: '',
    };
  }