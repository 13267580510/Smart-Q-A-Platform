import request from '../../utils/request'

enum API{
    // 文章核心接口
    ARTICLE_ALL_URL = '/article/all',
    CREATE_ARTICLE_URL = '/article/create',
    ARTICLE_DETAIL_URL = '/article/',
    ADMIN_ARTICLE_DETAIL_URL = '/article/',
    
    ADMIN_ARTICLE_ALL_URL = '/article/admin',    
    ADMIN_DELETE_ARTICLE_URL = '/article/admin',
    
    // 文章图片相关
    UPLOAD_ARTICLE_IMG_URL = '/article/images/upload',
    UPLOAD_ARTICLE_COVER_URL = '/article/images/cover',
    DELETE_ARTICLE_IMG_URL = '/article/',
    
    // 文章点赞/点踩
    LIKE_ARTICLE_URL = '/article/',
    DISLIKE_ARTICLE_URL = '/article/',
    
    // 文章收藏相关
    COLLECT_ARTICLE_URL = '/article/',        // 收藏文章
    CANCEL_COLLECT_ARTICLE_URL = '/article/', // 取消收藏文章
    CHECK_COLLECT_ARTICLE_STATUS_URL = '/article/', // 检查文章收藏状态
    GET_COLLECTED_ARTICLES_URL = '/article/collected', // 获取收藏文章列表
    
    // 我的文章相关
    MY_ARTICLES_URL = '/article/my',
    
    // 文章搜索相关
    SEARCH_ARTICLE_URL = '/article/search',


        // ========== 新增：分类相关接口 ==========
    CATEGORIES_ALL_URL = '/article/categories',// 获取树形分类列表

    // ========== 新增：文章举报相关接口 ==========
    REPORT_ARTICLE_URL = '/article/' // 文章举报接口（拼接文章ID使用）
}

// ========== 文章基础操作 ==========
/**
 * 获取所有公开文章（分页）
 * @param page 页码
 * @param size 每页条数
 * @returns Promise<ApiResponse>
 */
export const ReqGetArticleAll = (page:number, size:number)=>request.get(API.ARTICLE_ALL_URL + `?page=${page}&size=${size}`);

/**
 * 获取文章详情
 * @param id 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqGetArticleDetail = (id:number)=> request.get(API.ARTICLE_DETAIL_URL + `${id}/detail`);
//ReqGetArticleDetailAdmin
export const ReqGetArticleDetailAdmin = (id:number)=> request.get(API.ADMIN_ARTICLE_DETAIL_URL + `${id}/detail`);

/**
 * 创建新文章
 * @param data 文章创建参数（title、summary、content等）
 * @returns Promise<ApiResponse>
 */
export const ReqCreateArticle = (data:any)=>request.post(API.CREATE_ARTICLE_URL, data);

/**
 * 修改文章
 * @param id 文章ID
 * @param data 文章修改参数
 * @returns Promise<ApiResponse>
 */
export const ReqUpdateArticle = (id:number, data:any)=>request.put(API.ARTICLE_DETAIL_URL + `${id}`, data);

/**
 * 删除文章（仅作者/管理员）
 * @param id 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqDeleteArticle = (id:number)=>request.delete(API.ARTICLE_DETAIL_URL + `${id}`);

// ========== 管理员文章操作 ==========
/**
 * 管理员获取所有文章（分页）
 * @param page 页码
 * @param size 每页条数
 * @returns Promise<ApiResponse>
 */
export const ReqGetAdminArticleAll = (page:number, size:number)=>request.get(API.ADMIN_ARTICLE_ALL_URL + `?page=${page}&size=${size}`);

/**
 * 管理员删除文章
 * @param id 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqDelAdminArticle = (id:number)=>request.delete(API.ADMIN_DELETE_ARTICLE_URL + id);

/**
 * 管理员筛选文章（分页+状态）
 * @param page 页码
 * @param size 每页条数
 * @param status 文章状态
 * @returns Promise<ApiResponse>
 */
export const ReqSearchAdminArticle = (page:number, size:number, status:string) => 
    request.get(API.ADMIN_ARTICLE_ALL_URL + `?page=${page}&size=${size}&status=${status}`);

// ========== 文章图片操作 ==========
/**
 * 上传文章内容图片（临时）
 * @param file 图片文件
 * @returns Promise<ApiResponse>
 */
export const ReqUploadArticleImg = (file:any)=>request.post(API.UPLOAD_ARTICLE_IMG_URL, file);

/**
 * 上传文章封面图片（临时）
 * @param file 封面图片文件
 * @returns Promise<ApiResponse>
 */
export const ReqUploadArticleCover = (file:any)=>request.post(API.UPLOAD_ARTICLE_COVER_URL, file);

/**
 * 删除文章图片
 * @param articleId 文章ID
 * @param imageId 图片ID
 * @returns Promise<ApiResponse>
 */
export const ReqDeleteArticleImg = (articleId:number, imageId:number)=>
    request.delete(API.DELETE_ARTICLE_IMG_URL + `${articleId}/images/${imageId}`);

// ========== 文章点赞/点踩 ==========
/**
 * 文章点赞
 * @param id 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqLikeArticle = (id:number)=>request.post(API.LIKE_ARTICLE_URL + `${id}/like`);

/**
 * 文章点踩
 * @param id 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqDislikeArticle = (id:number)=>request.post(API.DISLIKE_ARTICLE_URL + `${id}/dislike`);

// ========== 文章收藏相关 ==========
/**
 * 收藏文章
 * @param articleId 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqCollectArticle = (articleId: number) => 
    request.post(API.COLLECT_ARTICLE_URL + `${articleId}/collect`);

/**
 * 取消收藏文章
 * @param articleId 文章ID
 * @returns Promise<ApiResponse>
 */
export const ReqCancelCollectArticle = (collectId: number) => 
    request.post(API.CANCEL_COLLECT_ARTICLE_URL + `${collectId}/uncollect`);

/**
 * 检查文章是否已收藏
 * @param articleId 文章ID
 * @returns Promise<ApiResponse> 包含是否收藏的布尔值
 */
export const ReqCheckArticleCollected = (articleId: number) => 
    request.get(API.CHECK_COLLECT_ARTICLE_STATUS_URL + `${articleId}/is-collected`);

/**
 * 获取当前用户收藏的文章列表
 * @param userId 用户ID
 * @param page 页码（默认1）
 * @param size 每页条数（默认10）
 * @returns Promise<ApiResponse> 包含分页的收藏文章列表
 */
export const ReqGetCollectedArticles = (userId: number, page: number = 1, size: number = 10) => 
    request.get(API.GET_COLLECTED_ARTICLES_URL + `?userId=${userId}&page=${page}&size=${size}`);

// ========== 我的文章相关 ==========
/**
 * 获取当前用户的文章列表
 * @param userId 用户ID
 * @param page 页码
 * @param size 每页条数
 * @param status 文章状态（默认ALL）
 * @param keyword 搜索关键词（默认空字符串）
 * @returns Promise<ApiResponse>
 */
export const ReqGetMyArticles = (
    userId: number, 
    page: number = 1, 
    size: number = 10, 
    status: string = "ALL", 
    keyword: string = ""
) => request.get(
    API.MY_ARTICLES_URL + 
    `?userId=${userId}&page=${page}&size=${size}&status=${status}&keyword=${encodeURIComponent(keyword)}`
);

// ========== 文章搜索相关 ==========
/**
 * 搜索文章（关键词模糊查询）
 * @param keyword 搜索关键词
 * @param page 页码（默认1）
 * @returns Promise<ApiResponse>
 */
export const ReqSearchArticle = (keyword: string, page: number = 1) => 
    request.get(API.SEARCH_ARTICLE_URL + `?keyword=${encodeURIComponent(keyword)}&page=${page}`);


// ========== 新增：分类相关请求 ==========
/**
 * 获取所有树形分类列表
 * @returns Promise<ApiResponse> 包含无限级树形分类数据
 */
export const ReqGetCategories = () => request.get(API.CATEGORIES_ALL_URL);

// ========== 新增：文章举报相关请求 ==========
/**
 * 举报文章
 * @param articleId 文章ID
 * @param reportData 举报数据（reason：举报原因，description：详细说明）
 * @returns Promise<ApiResponse>
 */
export const ReqReportArticle = (articleId: number, reportData: { reason: string; description?: string }) => 
    request.post(API.REPORT_ARTICLE_URL + `${articleId}/report`, reportData);