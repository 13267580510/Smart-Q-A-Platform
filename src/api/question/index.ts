import request from '../../utils/request'

enum API{
    QuestionAll_URL = '/qa/questions',
    GET_HOT_QUESTION_URL='/qa/questions/getHotQuestions',
    CREATEDQUESTION_URL = '/qa/questions/createQuestion',
    QUESTIONDETAIL_URL = '/qa/questions/',
    ADMINQUESTIONALL_URL = '/qa/admin/questions',    
    ADMINDELETEQUESTION_URL = '/qa/admin/questions/',
    UPLOADQUESTIONIMG_URL = '/qa/questions/images/upload',
    EDIT_QUESTION_URL = '/qa/questions/', // 问题修改（PUT 请求）
    // ========== 新增：标记/取消标记解决答案的接口地址 ==========
    MARK_SOLVED_URL = '/qa/questions/',
    UNMARK_SOLVED_URL = '/qa/questions/',

     // ========== 新增：收藏相关接口地址 ==========
    COLLECT_QUESTION_URL = '/qa/questions/',        // 收藏问题
    CANCEL_COLLECT_URL = '/qa/questions/',          // 取消收藏
    CHECK_COLLECT_STATUS_URL = '/qa/questions/',    // 检查收藏状态
    GET_COLLECTED_QUESTIONS_URL = '/qa/questions/collected', // 获取收藏列表

    // ========== 新增：获取用户自身所有问题的接口地址 ===my=======
    USER_QUESTIONS_URL = '/qa/questions/my',
    CATEGORIES_ALL_URL = '/qa/questions/categories',// 获取树形分类列表
    // ========== 新增：举报相关接口地址 ==========
        REPORT_URL = '/qa/questions/',
}
export const ReqGetQuestionAll = (page:number,size:number)=>request.get(API.QuestionAll_URL + `?page=${page}&size=${size}`);

export const ReqGetHotQuestion = (page:number,size:number)=>request.get(API.GET_HOT_QUESTION_URL + `?page=${page}&size=${size}`);


export const ReqGetQuestionDetail = (id:number)=> request.get(API.QUESTIONDETAIL_URL + `${id}/detail`)

export const ReqGetAdminQuestionAll = (page:number,size:number)=>request.get(API.ADMINQUESTIONALL_URL + `?page=${page}&size=${size}`);

export const ReqDelAdminQuestion = (id:number)=>request.delete(API.ADMINDELETEQUESTION_URL + id)

export const ReqSearchAdminQuestion = (page:number,size:number,status:string) => request.get(API.ADMINQUESTIONALL_URL + `?page=${page}&size=${size}&status=${status}`);

export const ReqApprovedQuestion = (id:number,approved:boolean) => request.put(API.ADMINDELETEQUESTION_URL + `${id}/review?approved=${approved}`);

export const ReqUploadQuestionImg = (file:any)=>request.post(API.UPLOADQUESTIONIMG_URL,file);

export const ReqAskQuestion = (data:any)=>request.post(API.CREATEDQUESTION_URL,data)

export const ReqLikeQuestion = (id:number)=>request.post(API.QUESTIONDETAIL_URL+`${id}/like`);

export const ReqDislikeQuestion = (id:number)=>request.post(API.QUESTIONDETAIL_URL+`${id}/dislike`)


// ========== 新增：问题修改请求方法 ==========
/**
 * 修改用户自身的问题（仅问题作者可操作）
 * @param editData 问题修改参数（包含 id、title、content、categoryId 等）
 * @returns Promise<ApiResponse> 包含修改后的问题详情
 */
export const ReqEditQuestion = (questionId:Number,editData: any) => 
    request.put(`${API.EDIT_QUESTION_URL}${questionId}`, editData);

// ========== 新增：标记回答为解决答案 ==========
/**
 * 标记指定回答为问题的解决答案
 * @param questionId 问题ID
 * @param answerId 回答ID
 * @returns Promise<ApiResponse>
 */
export const ReqMarkAnswerAsSolved = (questionId: number, answerId: number) => 
    request.post(API.MARK_SOLVED_URL + `${questionId}/mark-solved/${answerId}`);

// ========== 新增：取消标记解决答案 ==========
/**
 * 取消问题的解决答案标记
 * @param questionId 问题ID
 * @returns Promise<ApiResponse>
 */
export const ReqUnmarkAnswerAsSolved = (questionId: number) => 
    request.post(API.UNMARK_SOLVED_URL + `${questionId}/unmark-solved`);


// ========== 新增：收藏相关请求方法 ==========
/**
 * 收藏问题
 * @param questionId 问题ID
 * @returns Promise<ApiResponse>
 */
export const ReqCollectQuestion = (questionId: number) => 
    request.post(API.COLLECT_QUESTION_URL + `${questionId}/collect`);

/**
 * 取消收藏问题
 * @param questionId 问题ID
 * @returns Promise<ApiResponse>
 */
export const ReqCancelCollectQuestion = (questionId: number) => 
    request.post(API.CANCEL_COLLECT_URL + `${questionId}/cancel-collect`);

/**
 * 检查问题是否已收藏
 * @param questionId 问题ID
 * @returns Promise<ApiResponse> 包含是否收藏的布尔值
 */
export const ReqCheckQuestionCollected = (questionId: number) => 
    request.get(API.CHECK_COLLECT_STATUS_URL + `${questionId}/is-collected`);

/**
 * 获取当前用户收藏的问题列表
 * @param userId 用户ID
 * @param page 页码（默认1）
 * @param size 每页条数（默认10）
 * @returns Promise<ApiResponse> 包含分页的收藏问题列表
 */
export const ReqGetCollectedQuestions = (userId: number, page: number = 1, size: number = 10) => 
    request.get(API.GET_COLLECTED_QUESTIONS_URL + `?userId=${userId}&page=${page}&size=${size}`);

// ========== 新增：获取用户自身所有问题 ==========
/**
 * 获取指定用户发布的所有问题（分页）
 * @param userId 用户ID
 * @param page 页码（默认1，与现有接口一致）
 * @param size 每页条数（默认10，与现有接口一致）
 * @returns Promise<ApiResponse> 包含分页的用户问题列表
 */
export const ReqGetUserOwnQuestions = (userId: number, page: number = 1, size: number = 10) => 
    request.get(API.USER_QUESTIONS_URL + `?page=${page}&size=${size}`);

// ========== 新增：分类相关请求 ==========
/**
 * 获取所有树形分类列表
 * @returns Promise<ApiResponse> 包含无限级树形分类数据
 */
export const ReqGetCategories = () => request.get(API.CATEGORIES_ALL_URL);

/**
 * 举报问题
 * @param questionId 问题ID
 * @param reason 举报原因
 * @returns Promise<ApiResponse>
 */
export const ReqReportQuestion = (questionId: number, data: Map<string,any>) => 
    request.post(API.REPORT_URL + `${questionId}/report`, data);
