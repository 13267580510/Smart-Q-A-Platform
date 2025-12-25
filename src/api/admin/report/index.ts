import request from "../../../utils/request";

enum API{
    USERREPORT_URL = '/reports/getReportList',
    ANSWERREPORT_URL = '/admin/answers/reports',
    QUESTIONREPORT_URL = '/admin/questions/reports',
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

// export const ReqReportQuestion = ()=>request.post()