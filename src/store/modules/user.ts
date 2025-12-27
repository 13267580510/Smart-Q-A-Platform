// store/modules/user.ts
import { defineStore } from 'pinia'
import { GET_TOKEN, REMOVE_TOKEN, SET_TOKEN } from '../../utils/token';
import { ReqLogin, ReqRegister } from '../../api/user';
import routes from '../../router/routes';
import router from '../../router';

// 默认头像路径常量
const DEFAULT_AVATAR = '/src/assets/icons/default_avat.svg';

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
        },
        
        // 添加获取用户头像的方法
        userAvatar: (state) => {
            // 如果用户信息存在且有头像路径，则返回用户头像
            if (state.userInfo && state.userInfo.avatar) {
                return state.userInfo.avatar;
            }
            // 否则返回默认头像
            return DEFAULT_AVATAR;
        }
    },
    actions: {
        async login(data) {
            try {
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
                    return result;
                }
                return null;
            } catch (error) {
                console.error('登录过程中捕获的错误:', error);
                return null;
            }
        },
        
        async register(data) {
            try {
                let result = await ReqRegister(data);
                console.log("注册响应:", result);
                
                if (result) {
                    return result;
                }
                return null;
            } catch (error) {
                console.error('注册过程中捕获的错误:', error);
                return null;
            }
        },
        
        async exitLogin() {
            try {
                // 可以添加退出登录的API调用
            } catch (error) {
                console.error('退出登录API错误:', error);
            } finally {
                this.token = '';
                this.userInfo = null;
                localStorage.removeItem('userInfo');
                REMOVE_TOKEN();
                router.push('/login');
            }
        },
        
        // 添加更新用户信息的方法
        async updateUserInfo(newUserInfo) {
            if (newUserInfo) {
                this.userInfo = { ...this.userInfo, ...newUserInfo };
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
            }
        },
        
        // 添加更新用户头像的方法
        async updateAvatar(avatarUrl) {
            if (this.userInfo) {
                this.userInfo.avatar = avatarUrl;
                localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
            }
        },
        
        goToUserCenter() {
            if (this.isLoggedIn && this.userInfo && this.userInfo.id) {
                router.push(`/user/${this.userInfo.id}`);
            } else {
                router.push('/user/center');
            }
        },
        
        goToLogin() {
            router.push('/login');
        },
        
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