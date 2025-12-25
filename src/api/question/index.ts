import request from '../../utils/request'

enum API{
    QuestionAll_URL = '/questions',
    QUESTIONDETAIL_URL = '/questions/',
    ADMINQUESTIONALL_URL = '/admin/questions',    
    ADMINDELETEQUESTION_URL = '/admin/questions/',
    UPLOADQUESTIONIMG_URL = '/questions/images/upload'
}

export const ReqGetQuestionAll = (page:number,size:number)=>request.get(API.QuestionAll_URL + `?page=${page}&size=${size}`);

export const ReqGetQuestionDetail = (id:number)=> request.get(API.QUESTIONDETAIL_URL + `${id}/detail`)

export const ReqGetAdminQuestionAll = (page:number,size:number)=>request.get(API.ADMINQUESTIONALL_URL + `?page=${page}&size=${size}`);

export const ReqDelAdminQuestion = (id:number)=>request.delete(API.ADMINDELETEQUESTION_URL + id)

export const ReqSearchAdminQuestion = (page:number,size:number,status:string) => request.get(API.ADMINQUESTIONALL_URL + `?page=${page}&size=${size}&status=${status}`);

export const ReqApprovedQuestion = (id:number,approved:boolean) => request.put(API.ADMINDELETEQUESTION_URL + `${id}/review?approved=${approved}`);

export const ReqUploadQuestionImg = (file:any)=>request.post(API.UPLOADQUESTIONIMG_URL,file);

export const ReqAskQuestion = (data:any)=>request.post(API.QuestionAll_URL,data)

export const ReqLikeQuestion = (id:number)=>request.post(API.QUESTIONDETAIL_URL+`${id}/like`);

export const ReqDislikeQuestion = (id:number)=>request.post(API.QUESTIONDETAIL_URL+`${id}/dislike`)