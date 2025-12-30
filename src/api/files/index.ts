import request from '../../utils/request';

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
export const ReqDownloadFile = (fileKey: string) => {
    return request({
        url: `/files/download/${fileKey}`,
        method: 'get',
        responseType: 'blob'
    });
};