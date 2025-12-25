<template>
    <div class="loginBox">
        <el-form class="login" ref="loginForms" :model="loginForm" :rules="rules" label-width="auto">
            <h2>登录</h2>
            <el-form-item prop="username">
                <el-input style="width: 300px;" placeholder="请输入用户名" :prefix-icon="User"
                    v-model="loginForm.username"></el-input>
            </el-form-item>
            <el-form-item prop="password">
                <el-input type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password
                    v-model="loginForm.password"></el-input>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :loading="isLoading" style="width: 100%;" @click="login">登录</el-button>
            </el-form-item>
           <div class="goRegister">
             <router-link to="/register" >没有账号?马上注册</router-link>
           </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage, ElNotification, type FormInstance, type FormRules } from 'element-plus'
import useUserStore from '../../store/modules/user'
import { useRouter,useRoute } from 'vue-router'
const $router = useRouter();
const $route = useRoute();
const loginForms = ref();
const UserStore = useUserStore();
let loginForm = ref({
    username: '',
    password: ''
})
let isLoading = ref(false);
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

const login = async () => {
    await loginForms.value.validate()
    isLoading.value = true;
    
    try {
        // 调用登录方法，获取返回结果
        const result = await UserStore.login(loginForm.value)
        
        if (result) {
            // 登录成功
            isLoading.value = false;
            let h: number = new Date().getHours();
            let time: String;
            time = h < 12 ? '早上' : (h < 14 ? '中午' : (h < 18 ? '下午' : '晚上'))
            let redirect: any = $route.query.redirect
            
            // 显示欢迎通知
            ElNotification({
                title: 'Hi',
                type: 'success',
                message: `欢迎回来，${time}好！`
            })
            
            // 根据是否有重定向参数进行跳转
            if (redirect) {
                $router.push(redirect)
            } else {
                $router.push('/home')
            }
        } else {
            // 登录失败（但axios拦截器已经显示了错误提示）
            isLoading.value = false;
            // 这里可以添加一些登录失败后的UI处理
            // 例如：重置表单或显示额外提示
        }
        
    } catch (error) {
        // 这里通常不会执行，因为错误已经在axios拦截器中处理了
        isLoading.value = false;
        console.error('登录过程异常:', error);
    }
}
</script>

<style scoped lang="scss">
.loginBox {
    width: 100vw;
    height: 100vh;
    background-color: rgb(184, 229, 248);
    background-image: url(../../assets/image/bg.png);
    background-size: cover;
    background-repeat: no-repeat;
    position: relative;

    .login {
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
        .goRegister{
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