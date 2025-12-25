export interface loginForm{
    username:string,
    password:string
}

export interface registerForm extends loginForm{
    email:string,
    nickname:string
}

interface ResponseData{
    status:number,
    message:string,
}

export interface ResponseUserInfoData{
    id:number,
    username:string,
    nickname:string,
    email:string,
    role:string,
    questionCount:number,
    answerCount:number
}

export interface LoginResponseData extends ResponseData{
    token:string,
    data:ResponseUserInfoData
}