import request from "../../utils/request";

enum API{
    ANSWER_URL = '/qa/answers',
    CREATE_ANSWER_URL = '/qa/answers/create',
    UPLOADANSWERIMG_URL = '/answers/images/upload'
}

export const ReqSendAnswer = (data:any)=>request.post(API.CREATE_ANSWER_URL,data);
export const ReqUploadAnswerImg = (file:any)=>request.post(API.UPLOADANSWERIMG_URL,file)
export const ReqSendComment  = (id:number,data:any)=>request.post(API.ANSWER_URL + `/${id}/comments`,data);
export const ReqLikeAnswer = (id:number)=>request.post(API.ANSWER_URL+"/"+`${id}/like`);
export const ReqDislikeAnswer = (id:number)=>request.post(API.ANSWER_URL+"/"+`${id}/dislike`)
