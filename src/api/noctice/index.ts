import request from "../../utils/request";

enum API{
    NOCTICE_URL = '/admin/notifications/List',
    SENDNOCTICEALL_URL = '/admin/notifications/all',
    SENDNOCTICEAPPOINT_URL = '/admin/notifications/user/',
    UPDATENOCTICE_URL = '/admin/notifications/',
    USERNOTICE_URL = '/UserInfo/notifications'
}

export const ReqGetNocticeList = (page:number,size:number) => request.get(API.NOCTICE_URL + `?page=${page}&size=${size}`);

export const ReqSendNocticeAll = (data:any)=>request.post(API.SENDNOCTICEALL_URL,data);

export const ReqSendNocticeAppoint = (id:number,data:any)=>request.post(API.SENDNOCTICEAPPOINT_URL + id,data);

export const ReqUpdateNoctice = (id:number,data:any)=>request.put(API.UPDATENOCTICE_URL + id,data);

export const ReqGetUserNotice = (page:number,size:number) => request.get(API.USERNOTICE_URL + `?page=${page}&size=${size}`)
