import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import useUserStore from '@/store/modules/user';
import streamSaver from 'streamsaver'; // 新增
import {FileCheckRequest} from '@/model/file/fileCheckRequest'; // 新增
import {FileCheckResult} from '@/model/file/fileCheckResult'; // 新增
import { FileInfo } from '@/model/file/fileInfo';
import {CheckUploadRequest}  from '@/model/file/chunkUploadRequest'
import { ChunkUploadResult } from '@/model/file/chunkUploadResult';
import { calculateChunkHash } from '@/utils/computeMD5'; // 新增
import { ref } from 'vue'

export const ReqGetCategories = () => {
    return request.get(API.GETCATEGORIES_URL)
};

// 新增：定义上传进度的响应式状态
export const uploadProgress = ref<number>(0) // 进度值 0-100
export const uploadTotalChunks = ref<number>(0) // 总分片数
export const uploadCurrentChunk = ref<number>(0) // 当前上传到第几个分片
// 重置上传进度（每次开始新上传前调用）
export const resetUploadProgress = () => {
    uploadProgress.value = 0
    uploadTotalChunks.value = 0
    uploadCurrentChunk.value = 0
  }
  
enum API{
    SEARCHFILE_URL='/files/search',
    GETFILELIST_URL='/files/list',
    DELETEFILE_URL='/files/admin/delete',
    GETCATEGORIES_URL='/files/categories',
    CHECKFILE_URL = '/files/admin/check',
    UPLOADCHUNK_URL='/files/admin/upload-chunk',
    MERGECHUNK_URL='/files/admin/merge',
}
// 获取文件列表（分页 + 筛选）
export const ReqGetFileList = (params: {
    category?: string;
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
}) => {
    return request.get(API.GETFILELIST_URL, { params });
};

// 搜索文件
export const ReqSearchFiles = (keyword: string) => {
    return request.get(API.SEARCHFILE_URL, { params: { keyword } });
};

// 获取文件详情
export const ReqGetFileDetail = (fileKey: string) => {
    return request({
        url: `/files/detail/${fileKey}`,
        method: 'get'
    });
};

export const ReqDownloadFileStream = async (fileId: number, fileName: string) => {
    const userStore = useUserStore();
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
        // 设置超时
        timeoutId = setTimeout(() => {
            controller.abort();
            ElMessage.error('下载超时');
        }, 5 * 60 * 1000);
        
        // 直接使用 fetch 获取流
        const response = await fetch(`/api/files/download/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userStore.token}`,
            },
            signal: controller.signal,
        });
        
        if (!response.ok) {
            // 处理错误响应
            const errorText = await response.text();
            let errorMessage = '下载失败';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch {
                // 如果不是 JSON，直接显示文本
                if (errorText) errorMessage = errorText;
            }
            
            throw new Error(`服务器错误 (${response.status}): ${errorMessage}`);
        }
        
        // 检查是否是文件
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || '请求的不是文件');
        }
        
        // 获取文件名
        let downloadFileName = fileName;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            downloadFileName = extractFileNameFromContentDisposition(contentDisposition) || fileName;
        }
        
        // 获取文件大小
        const contentLength = response.headers.get('content-length');
        const fileSize = contentLength ? parseInt(contentLength, 10) : null;
        
        // 显示下载信息
        if (fileSize) {
            const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
            console.log(`开始下载: ${downloadFileName} (${sizeInMB} MB)`);
        }
        
        // 创建文件流
        const fileStream = streamSaver.createWriteStream(downloadFileName, {
            size: fileSize || undefined,
        });
        
        // 直接使用 fetch 返回的 ReadableStream
        if (response.body) {
            await response.body.pipeTo(fileStream);
        } else {
            throw new Error('响应体不可用');
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        ElMessage.success('文件下载完成');
        
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            ElMessage.info('下载已取消');
        } else {
            ElMessage.error(`下载失败: ${error.message || '未知错误'}`);
            throw error;
        }
    }
};

// 辅助函数：从 Content-Disposition 提取文件名
const extractFileNameFromContentDisposition = (contentDisposition: string): string | null => {
    try {
        // 优先处理 RFC 5987 格式: filename*=UTF-8''encoded-filename
        const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (rfc5987Match && rfc5987Match[1]) {
            return decodeURIComponent(rfc5987Match[1]);
        }
        
        // 处理带引号的普通格式: filename="filename.ext"
        const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (quotedMatch && quotedMatch[1]) {
            return quotedMatch[1];
        }
        
        // 处理不带引号的格式: filename=filename.ext
        const unquotedMatch = contentDisposition.match(/filename=([^;]+)/i);
        if (unquotedMatch && unquotedMatch[1]) {
            return unquotedMatch[1].trim();
        }
        
        return null;
    } catch (error) {
        console.warn('解析 Content-Disposition 失败:', error);
        return null;
    }
};


export const ReqUploadFile = async (formData:FileInfo) => {
    const fileCheckRequest = {
        fileName: formData.fileName, // 文件名
        fileSize: formData.fileSize, // 文件大小（字节）
        category: formData.category, // 文件类型
        md5: formData.md5, // 文件MD5值
        userId: formData.userId, // 用户ID
        clientIp: formData.clientIp // 客户端IP地址
    }
    return   checkFile(fileCheckRequest)
}


export const ReqUploadChunk=async (result:FileCheckResult,selectedFile:File)=>{
    resetUploadProgress()
    const chunkSize:number = result.chunkSize || 100* 1024 * 1024; // 切片大小，默认10MB
     //读取文件转为切片并从已经上传了的切片后开始上传
     const uploadedChunks = result?.uploadedChunks; // 已上传的切片索引数组
     const totalChunk = result?.totalChunks; //总切片数
     const notUploadedChunks = [];
     const file = selectedFile; 
     const CheckUploadRequest = {
         fileId: result.fileId, // 文件ID
         chunkIndex: 0, // 切片索引
         chunkHash:'', // 切片哈希
         chunk: new Blob(), // 切片
         totalChunks: totalChunk, // 总分片数
         clientIp: '127.0.0.1' // 客户端IP地址
     }
     console.log("准备执行上传切片，检查是否有上传过该文件：",result.exist);
     if(!result.exist){
         console.log("文件未上传过，开始切片上传");
         uploadTotalChunks.value = totalChunk;
         for(let i = 0;i<totalChunk;i++){
             CheckUploadRequest.chunkIndex=i;
             // 1. 设置当前切片索引
        // 2. 读取对应索引的文件切片数据（核心：截取文件的指定范围）
        const chunk = getFileChunk(file, i, chunkSize);
        CheckUploadRequest.chunk = chunk;
        // 3. 计算当前切片的哈希（异步操作，需await）
        CheckUploadRequest.chunkHash = await calculateChunkHash(chunk);
        // 4. 执行切片上传（需替换为你的上传接口调用）
        const chunkUploadResult:ChunkUploadResult = await uploadChunk(CheckUploadRequest);
            if(chunkUploadResult!=null){
                // 新增：更新上传进度
                console.log("切片上传成功",chunkUploadResult);
                uploadCurrentChunk.value = i + 1;
                uploadProgress.value = Math.floor((uploadCurrentChunk.value / uploadTotalChunks.value) * 100);
                console.log(`上传进度：${uploadProgress.value}% (${uploadCurrentChunk.value}/${uploadTotalChunks.value})`);
            }else{
                console.log("切片数:",i," 上传失败");
            }
           
         }
         console.log("切片上传完成，开始请求合并切片");
         const mergeRusult =  await mergeChunk(result.fileId);
         console.log("合并结果:",mergeRusult);
         return mergeRusult
     }else{
        console.log("文件已上传部分切片，仅上传未完成的");
      // 第一步：先筛选出未上传的切片索引
      for (let i = 0; i < totalChunk; i++) {
        if (!uploadedChunks.includes(i)) {
          console.log("未上传的切片索引：", i);
          notUploadedChunks.push(i);
        }
      }

      // 初始化未上传分片的进度基数
      const uploadedCount = totalChunk - notUploadedChunks.length;
      uploadCurrentChunk.value = uploadedCount;
      uploadProgress.value = Math.floor((uploadedCount / totalChunk) * 100);

      // 第二步：遍历未上传切片，读取数据并上传
      for (const i of notUploadedChunks) {
        CheckUploadRequest.chunkIndex = i;
        // 读取当前索引的切片数据
        const chunk = getFileChunk(file, i, chunkSize);
        CheckUploadRequest.chunk = chunk;
        // 计算切片哈希
        CheckUploadRequest.chunkHash = await calculateChunkHash(chunk);
        // 上传当前切片
        await uploadChunk(CheckUploadRequest);
            // 新增：更新上传进度
        uploadCurrentChunk.value += 1;
        uploadProgress.value = Math.floor((uploadCurrentChunk.value / uploadTotalChunks.value) * 100);
        console.log(`上传进度：${uploadProgress.value}% (${uploadCurrentChunk.value}/${uploadTotalChunks.value})`);
       
      }
         console.log("切片上传完成，开始请求合并切片");
         const mergeRusult =  await mergeChunk(result.fileId);
         console.log("合并结果:",mergeRusult);
         uploadProgress.value = 100;
         return mergeRusult
     }
}

//检查文件是否存在，或文件是否是传了一半
export const  checkFile = async (formData: FileCheckRequest): Promise<FileCheckResult> => {
    try{
        const result:FileCheckResult =   await request.post(API.CHECKFILE_URL, formData); 
        return result;
    }catch(error){
        console.log(error);
        throw error;
    }
}

//上传切片
export const uploadChunk = async (checkUploadRequest:CheckUploadRequest): Promise<ChunkUploadResult> => {
    const formData = new FormData();
     // 1. 添加文件切片（key必须和后端@RequestPart("chunk")一致）
     formData.append('chunk', checkUploadRequest.chunk); 
     // 2. 添加其他参数
     formData.append('request', new Blob([JSON.stringify(checkUploadRequest)], { type: 'application/json' }));
     const result:ChunkUploadResult= await request.post(API.UPLOADCHUNK_URL,formData);
    return result;
}

//合并切片
const mergeChunk = async (fileId:number)=>{
    const result = await request.post(
        API.MERGECHUNK_URL,
        fileId,
        {
            headers: {
                'Content-Type': 'application/json' // 关键：指定JSON格式
            }
        }
    );
    return result;
}


//删除文件
export  const deleteFile = async (fileId:number)=>{
    return await request.delete(API.DELETEFILE_URL,{params:{fileId}})
}



function getFileChunk(file: File, chunkIndex: number, chunkSize: number): Blob {
 // 计算当前切片的起始和结束字节位置
 const start = chunkIndex * chunkSize;
 // 最后一片可能不足chunkSize，取文件末尾
 const end = Math.min(start + chunkSize, file.size);
 // 截取文件的指定范围，返回Blob（可直接用于上传）
 return file.slice(start, end);
}