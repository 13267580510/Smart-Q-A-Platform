<template>
    <div class="registerBox">
        <el-form class="register" ref="registerForms" :model="registerForm" :rules="rules" label-width="auto">
            <h2>注册</h2>
            <el-form-item prop="nickname">
                <el-input style="width: 300px;" placeholder="请输入昵称(可选)" :prefix-icon="Avatar"
                    v-model="registerForm.nickname"></el-input>
            </el-form-item>
            <el-form-item prop="username">
                <el-input style="width: 300px;" placeholder="请输入用户名" :prefix-icon="User"
                    v-model="registerForm.username"></el-input>
            </el-form-item>
            <el-form-item prop="password">
                <el-input type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password
                    v-model="registerForm.password"></el-input>
            </el-form-item>
            <el-form-item prop="passwordok">
                <el-input type="password" placeholder="确认密码" :prefix-icon="Lock" show-password
                    v-model="registerForm.passwordok"></el-input>
            </el-form-item>
            <el-form-item prop="email">
                <el-input type="email" placeholder="请输入邮箱" :prefix-icon="Message"
                    v-model="registerForm.email"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :loading="isLoading" style="width: 100%;" @click="register">注册</el-button>
            </el-form-item>
           <div class="goLogin">
             <router-link to="/login" >已有账号?马上登录</router-link>
           </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Avatar, Lock, User ,Message} from '@element-plus/icons-vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import useUserStore from '../../store/modules/user'
import { useRouter,useRoute } from 'vue-router'
const $router = useRouter();
const $route = useRoute();
const UserStore = useUserStore();
let registerForm = ref({
    nickname:'',
    username: '',
    password: '',
    passwordok:'',
    email:'',
    age:'',
    sex:'MAN',
    residence:''
})
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
const validateEmail = (rule: any, value: any, callback: any)=>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === '') {
        callback(new Error('邮箱不能为空'))
    } else if (!emailRegex.test(value)) {
        callback(new Error("输入必须符合邮箱格式，如123@163.com"))
    } else {
        callback()
    }
}
const validatePasswordOK = (rule: any, value: any, callback: any)=>{
    const passwordLenRegex = /^.{6,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if (value === '') {
        callback(new Error('密码不能为空'))
    } else if (!passwordLenRegex.test(value)) {
        callback(new Error("密码应至少为6位"))
    } else if(!passwordRegex.test(value)){
        callback(new Error("密码必须包含字母和数字"));
    }else if(registerForm.value.password != value){
        callback(new Error("前后密码不一致"));
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
    ],
     passwordok:[
         {required:true,validator: validatePasswordOK, trigger: 'blur'}
    ],
     email:[
         {required:true,validator: validateEmail, trigger: 'blur'}
    ],
})
const registerForms = ref();
let isLoading = ref(false);
const register = async()=>{
    await registerForms.value.validate()
    isLoading.value = true;
    try{
        await UserStore.register(registerForm.value)
        ElNotification({
            type: 'success',
            message: '注册成功'
        })
        isLoading.value = false;
        $router.push('/login')

    }catch(error){
        ElNotification({
            type: 'error',
            message: '注册失败'
        })
        isLoading.value = false
    }
}
</script>

<style scoped lang="scss">
.registerBox {
    width: 100vw;
    height: 100vh;
    background-color: rgb(184, 229, 248);
    background-image: url(../../assets/image/bg.png);
    background-size: cover;
    background-repeat: no-repeat;
    position: relative;

    .register {
        padding: 20px;
        background-color: #fff;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 2px 2px 8px rgba($color: #000000, $alpha: .5);
        border-radius: 5px;
        box-sizing: border-box;

        h2 {
            text-align: center;
            margin-bottom: 10px;
        }
        .goLogin{
            width: 100%;
            a{
                text-align: center;
                text-decoration: none;
                display: block;
            }
        }
    }
}
</style>