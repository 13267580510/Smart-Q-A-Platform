import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes';
import adminRoutes from './adminRoutes';
const router = createRouter({
    history: createWebHashHistory(),
    routes:[
        ...routes,
        ...adminRoutes
    ],
    scrollBehavior() {
        return {
            left: 0,
            top: 0
        }
    }
})

export default router;