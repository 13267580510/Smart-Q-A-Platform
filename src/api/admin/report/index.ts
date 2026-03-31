import request from "../../../utils/request";

enum API{
        ARTICLEREPORT_URL = '/admin/articles/reports', // 文章举报列表根路径（与后端 @GetMapping("/reports") 对应）
    USERREPORT_URL = '/reports/getReportList',
    ANSWERREPORT_URL = '/admin/answers/reports',
    QUESTIONREPORT_URL = 'qa/admin/questions/reports',
    REJECTUSERREPORT_URL='/reports/',
    ANSWERREPORTHANDLE_URL = '/admin/answers/'
}

export const ReqGetUserReport = (page:number,size:number)=>request.get(API.USERREPORT_URL+`?page=${page}&size=${size}`);

export const ReqGetAnswerReport = (page:number,size:number)=>request.get(API.ANSWERREPORT_URL+`?page=${page}&size=${size}`)

export const ReqGetQuestionReport = (page:number,size:number)=>request.get(API.QUESTIONREPORT_URL+`?page=${page}&size=${size}`)

export const ReqRejectUserReport = (id:number)=>request.post(API.REJECTUSERREPORT_URL + `${id}/reject`);

export const ReqQueryUserReport = (page:number,size:number,result:string,isProcessed:boolean)=>request.get(API.USERREPORT_URL+`?page=${page}&size=${size}&result=${result}&isProcessed=${isProcessed}`);

export const ReqBanUser = (id:number,data:any) =>request.post(API.REJECTUSERREPORT_URL + `${id}/ban`,data);

export const ReqHandleQuestionReport = (id:number,approved:boolean)=>request.put(API.QUESTIONREPORT_URL+`/${id}/review?&approved=${approved}`)

export const ReqSearchQuestionReport = (page:number,size:number,status:string)=>request.get(API.QUESTIONREPORT_URL+`?page=${page}&size=${size}&status=${status}`)

export const ReqSearchAnswerReport = (page:number,size:number,status:string)=>request.get(API.ANSWERREPORT_URL+`?page=${page}&size=${size}&status=${status}`)

export const ReqHandleAnswerReport = (id:number,approved:boolean)=>request.put(API.ANSWERREPORTHANDLE_URL+`${id}/approve?&isApproved=${approved}`)

export const ReqUnBanUser = (reportId:number,userId:number) =>request.post(API.REJECTUSERREPORT_URL + `${reportId}/unban/${userId}`);


// 新增：获取文章举报列表（支持多查询参数，非必填参数按需传递）
/**
 * 获取文章举报列表
 * @param page 页码（默认1）
 * @param size 页大小（默认10）
 * @param status 举报状态（可选，对应后端 ReportStatus 枚举：PENDING/APPROVED/REJECTED）
 * @param startTime 开始时间（可选，ISO格式时间字符串）
 * @param endTime 结束时间（可选，ISO格式时间字符串）
 * @param articleId 文章ID（可选）
 * @param reporterId 举报人ID（可选）
 */
export const ReqGetArticleReport = (
    page: number = 1,
    size: number = 10,
    status?: string,
    startTime?: string,
    endTime?: string,
    articleId?: number,
    reporterId?: number
) => {
    // 拼接查询参数（仅传递有值的参数，避免多余的 null/undefined 参数）
    let queryParams = `?page=${page}&size=${size}`;
    if (status) queryParams += `&status=${status}`;
    if (startTime) queryParams += `&startTime=${encodeURIComponent(startTime)}`;
    if (endTime) queryParams += `&endTime=${encodeURIComponent(endTime)}`;
    if (articleId) queryParams += `&articleId=${articleId}`;
    if (reporterId) queryParams += `&reporterId=${reporterId}`;
    
    return request.get(API.ARTICLEREPORT_URL + queryParams);
};

// 新增：处理文章举报（驳回/通过）
/**
 * 处理文章举报
 * @param reportId 举报ID（路径参数）
 * @param approved 是否通过举报（true=通过/封禁，false=驳回）
 */
export const ReqHandleArticleReport = (reportId: number, approved: boolean) => {
    return request.put(API.ARTICLEREPORT_URL + `/${reportId}/review?approved=${approved}`);
};

// 新增：文章举报筛选查询（简化版，仅按状态筛选，匹配之前的问题/回答举报筛选风格）
/**
 * 按状态筛选文章举报（适配前端表格筛选）
 * @param page 页码
 * @param size 页大小
 * @param status 举报状态（PENDING/APPROVED/REJECTED）
 */
export const ReqSearchArticleReport = (page: number, size: number, status: string) => {
    return ReqGetArticleReport(page, size, status);
};



// export const ReqReportQuestion = ()=>request.post()