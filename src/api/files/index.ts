import { ElMessage } from 'element-plus';
import request from '../../utils/request';
import axios from 'axios';
import useUserStore from '@/store/modules/user';
// 获取所有分类
export const ReqGetCategories = () => {
    return request({
        url: '/files/categories',
        method: 'get'
    });
};

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

// 下载文件
export const ReqDownloadFile = async (fileId: number) => {
    try {
        const response = await axios({
            method: 'GET',
            url: `/api/files/download/${fileId}`,
            responseType: 'blob',
            headers: {
                'Authorization': `Bearer ${useUserStore().token}`,
                'Content-Type': 'application/octet-stream'
            }
        });
        // 如果是下载文件，直接返回response对象
        console.log("下载文件响应，返回完整response对象");
        // 直接处理文件下载
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        // 如果是取消下载，不显示错误
        if (axios.isCancel(error)) {
            console.log('用户取消了下载');
            return;
        }
        // 其他错误
        ElMessage({
            type: 'error',
            message: '下载失败',
            duration: 3000
        });
        throw error;
    }
  };