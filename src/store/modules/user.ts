import { defineStore } from 'pinia'
import { GET_TOKEN, REMOVE_TOKEN, SET_TOKEN } from '../../utils/token';
import { ReqLogin, ReqRegister } from '../../api/user';
import routes from '../../router/routes';
import router from '../../router'; // 确保导入了router

const useUserStore = defineStore('UserStore', {
    state: () => {
        return {
            token: GET_TOKEN(),
            userInfo: JSON.parse(localStorage.getItem('userInfo')) || null,
            menuList: routes,
        }
    },
    getters: {
        // 添加getter来判断是否登录
        isLoggedIn: (state) => {
            return !!state.token;
        }
    },
    actions: {
        async login(data) {
            try {
                // 直接调用请求，错误已在axios拦截器中处理
                let result = await ReqLogin(data);
                console.log("登录响应:", result);
                if (result) {
                    this.userInfo = result.data
                    this.token = result.token;
                    
                    // 存储到localStorage
                    if (this.userInfo) {
                        localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
                    }
                    SET_TOKEN(this.token);
                    
                    console.log('登录成功:', this.userInfo);
                    return result; // 返回完整结果
                }
                return null;
            } catch (error) {
                // 错误已经在axios拦截器中通过ElMessage显示了
                // 这里可以记录日志或做其他处理
                console.error('登录过程中捕获的错误:', error);
                // 不返回任何值或返回null，让调用方知道登录失败
                return null;
            }
        },
        
        async register(data) {
            try {
                let result = await ReqRegister(data);
                console.log("注册响应:", result);
                
                if (result) {
                    // 注册成功后自动登录
                    // 根据你的后端设计，可能需要在注册后调用登录
                    return result;
                }
                return null;
            } catch (error) {
                // 错误已经在axios拦截器中处理
                console.error('注册过程中捕获的错误:', error);
                return null;
            }
        },
        
        async exitLogin() {
            try {
                // 可以添加退出登录的API调用
                // await ReqLogout(); // 如果有退出接口
            } catch (error) {
                // 退出失败也继续执行本地清理
                console.error('退出登录API错误:', error);
            } finally {
                // 无论如何都执行本地清理
                this.token = '';
                this.userInfo = null;
                localStorage.removeItem('userInfo');
                REMOVE_TOKEN();
                
                // 跳转到登录页
                router.push('/login');
            }
        },
        
        // 添加一个跳转到个人中心的方法
        goToUserCenter() {
            if (this.isLoggedIn && this.userInfo && this.userInfo.id) {
                router.push(`/user/${this.userInfo.id}`);
            } else {
                // 否则跳转到通用个人中心页
                router.push('/user/center');
            }
        },
        
        // 跳转到登录页的方法
        goToLogin() {
            router.push('/login');
        },
        
        // 刷新用户信息
        async refreshUserInfo() {
            if (!this.isLoggedIn) return;
            
            try {
                // 假设有获取用户信息的接口
                // let result = await ReqGetUserInfo();
                // if (result) {
                //     this.userInfo = result;
                //     localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
                // }
            } catch (error) {
                console.error('刷新用户信息失败:', error);
            }
        }
    }
})

export default useUserStore;