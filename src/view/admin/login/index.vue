<template>
    <div class="login">
        <el-row>
            <el-col :span="12">1</el-col>
            <el-col :span="12" class="right">
                <div class="loginBox">
                    <h2 style="margin-bottom: 30px;">问答网站后台管理系统</h2>
                    <el-form ref="loginForms" :model="loginForm" :rules="rules" label-width="auto">
                        <el-form-item label="用户名" prop="username">
                            <el-input placeholder="请输入用户名" v-model="loginForm.username"></el-input>
                        </el-form-item>
                        <el-form-item label="密码" prop="password">
                            <el-input placeholder="请输入密码" type="password" show-password v-model="loginForm.password"></el-input>
                        </el-form-item>
                        <el-button type="primary" style="width: 100%;margin-top: 10px;" :isLoading="isLoading" @click="login">登录</el-button>
                    </el-form>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import {ref ,reactive} from 'vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import useUserStore from '../../../store/modules/user';
import { useRoute, useRouter } from 'vue-router';
const UserStore = useUserStore();
const $router = useRouter();
const $route = useRoute();
const loginForm = ref({
    username:'',
    password:''
})
let isLoading = ref(false);
const loginForms = ref();
const validateUsername = (rule: any, value: any, callback: any) => {
    const usernameLenRegex = /^.{6,20}$/;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (value === '') {
        callback(new Error('用户名不能为空'))
    } else if (!usernameLenRegex.test(value)) {
        callback(new Error("用户名应为6-20位"))
    } else if(!usernameRegex.test(value)){
        callback(new Error("用户名应由字母、数字、下划线组成"));
    }else {
        callback()
    }
}
const validatePassword = (rule: any, value: any, callback: any)=>{
    const passwordLenRegex = /^.{6,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if (value === '') {
        callback(new Error('密码不能为空'))
    } else if (!passwordLenRegex.test(value)) {
        callback(new Error("密码应至少为6位"))
    } else if(!passwordRegex.test(value)){
        callback(new Error("密码必须包含字母和数字"));
    }else {
        callback()
    }
}
const rules  = reactive<FormRules<typeof ruleForm>>({
    username: [
        {required:true,validator: validateUsername, trigger: 'blur'}
    ],
    password:[
         {required:true,validator: validatePassword, trigger: 'blur'}
    ]
})

const login = async ()=>{
    await loginForms.value.validate()
        isLoading.value = true;
        try{
            await UserStore.login(loginForm.value)
            isLoading.value = false;
            let h:number = new Date().getHours();
            let time:String;
            time = h<12?'早上':(h<14?'中午':(h<18?'下午':'晚上'))
            let redirect:any = $route.query.redirect
            $router.push(redirect||'/admin')
            ElNotification({
                title: 'Hi',
                type: 'success',
                message: `欢迎回来，${time}好！`
            })
        }catch(error){
            ElNotification({
                type: 'error',
                message: (error as Error).message
            })
            isLoading.value = false
        }
}

</script>

<style scoped lang="scss">
    .login{
        width: 100vw;
        height: 100vh;
        background-color: rgb(184, 229, 248);
        background-image: url(../../../assets/image/bg.png);
        background-repeat: no-repeat;
        background-size: cover;
        .right{
            text-align: center;
            position: relative;
            height: 100vh;
            .loginBox{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%,-50%);
                width: 400px;
                background-color: #fff;
                padding: 30px 20px;
                border-radius: 20px;
                box-shadow: 2px 2px 8px rgba($color: #000000, $alpha: .5);
            }
        }
    }

</style>