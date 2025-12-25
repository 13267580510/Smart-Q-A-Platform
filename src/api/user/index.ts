import request from "../../utils/request";
import type {loginForm,registerForm} from './type'

enum API{
    LOGIN_URL = '/auth/login',
    REGISTER_URL='/auth/register',
    USER_URL = '/admin/user/users',
    UPDATEUSERINFO_URL = '/UserInfo/',
    DELETEUSER_URL = '/admin/user/delete/',
    REGISTERADMIN_URL = '/admin/user/Administator',
    UPDATEUSERPWD_URL = '/admin/user/update/'
}

export const ReqLogin = (loginForm:loginForm)=>request.post(API.LOGIN_URL,loginForm);
export const ReqRegister = (registerForm:registerForm)=>request.post(API.REGISTER_URL,registerForm);
export const ReqGetUserAll = (page:number,size:number)=>request.get(API.USER_URL+`?page=${page}&size=${size}`)
export const ReqGetSearchUserList = (page:number,size:number,status:string)=>request.get(API.USER_URL+`?page=${page}&size=${size}&status=${status}`)
export const ReqUpdateUserInfo = (id:number,data:any)=>request.put(API.UPDATEUSERINFO_URL + id,data);
export const ReqDeleteUser = (id:number)=>request.delete(API.DELETEUSER_URL + id);
export const ReqRegisterAdmin = (registerForm:any) => request.post(API.REGISTERADMIN_URL,registerForm);
export const ReqGetSearchUserName = (page:number,size:number,username:string)=>request.get(API.USER_URL+`?page=${page}&size=${size}&username=${username}`)
export const ReqUploadUserImg = (id:number,avatarFile:any) => request.post(API.UPDATEUSERINFO_URL + `${id}/avatar/upload`,avatarFile);
export const ReqUpdatePassword = (id:number,newPassword:string)=>request.put(API.UPDATEUSERPWD_URL + `${id}/password`,{newPassword});