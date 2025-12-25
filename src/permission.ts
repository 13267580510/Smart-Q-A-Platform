import router from "./router";
import nprogress from 'nprogress'
import "nprogress/nprogress.css"
import pinia from './store/index'
import useUserStore from "./store/modules/user";

let userStore = useUserStore(pinia);

console.log(userStore.token)

router.beforeEach(async(to, from, next) => {
    document.title=`问答后台管理系统-${to.meta.title}`;
    nprogress.start();
    let token = userStore.token;
    let username = userStore.userInfo.nickname;
    console.log(username)
    if(token){
        if(to.path === '/adminLogin'){
            next({path:'/admin'})
        }else{
            if(username){
                next()
            }else{
                try {
                    next();
                } catch (error) {
                    userStore.exitLogin();
                    next({path:'/adminLogin'})
                }
            }
        }
    }else{
        if(to.path != '/adminLogin'){
            if(to.path == '/login' || to.path == '/register'){
                next()
            }else{
                next({path:'/adminLogin'})
            }
        }else{
            next()
        }
    }
})

router.afterEach((to, from) => {
    nprogress.done();
})
