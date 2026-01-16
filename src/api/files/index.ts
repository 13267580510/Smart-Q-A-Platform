import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import useUserStore from '@/store/modules/user';
import streamSaver from 'streamsaver'; // 新增
import {fileCheckRequest} from '@/model/file/fileCheckRequest'; // 新增
import {fileCheckResult} from '@/model/file/FileCheckResult'; // 新增

// 获取所有分类
export const ReqGetCategories = () => {
    return request({
        url: '/files/categories',
        method: 'get'
    });
};
enum API{
    CHECKFILE_URL = '/UserInfo/notifications'
}
// 获取文件列表（分页 + 筛选）
export const ReqGetFileList = (params: {
    category?: string;
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
}) => {
    return request({
        url: '/files/list',
        method: 'get',
        params
    });
};

// 搜索文件
export const ReqSearchFiles = (keyword: string) => {
    return request({
        url: '/files/search',
        method: 'get',
        params: { keyword }
    });
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

// 获取文件大小信息（需要后端提供这个接口）
export const ReqGetFileSize = (fileId: number) => {
    return request({
        url: `/files/info/${fileId}`,
        method: 'get'
    });
};

// 可选：如果需要显示下载进度，可以使用这个版本
export const ReqDownloadFileWithProgress = async (fileId: number, fileName: string) => {
    
    try {
        // 先获取文件信息（用于显示文件大小）
        const fileInfo = await ReqGetFileSize(fileId);
        const fileSize = fileInfo.size || fileInfo.fileSize;
        
        if (fileSize) {
            const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2);
            ElMessage.info(`开始下载 ${fileName} (${sizeInMB} MB)...`);
        } else {
            ElMessage.info(`开始下载 ${fileName}...`);
        }
        
        // 然后调用下载
        await ReqDownloadFile(fileId, fileName);
        
    } catch (error) {
        console.error('带进度显示的下载失败:', error);
        throw error;
    }
};

//检查文件是否存在，或文件是否是传了一半
export const checkFile = async (formData: fileCheckRequest) => {
    try{
        await request.post(API.CHECKFILE_URL, formData); // 这里假设你有一个上传文件的API，需要传入文件流和文件信息，如文件名、文件类型等
    }catch(error){
        console.log(error);
    }
}

