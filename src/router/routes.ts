
const routes = [
    {
        path: '/',
        component: () => import('../layout/index.vue'),//layout/index.vue
        name: 'index',
        redirect: '/home',
        meta: {
            title: '首页'
        },
        children: [
            {
                path: '/home',
                component: () => import('../view/home/index.vue'),
                nmae: 'home',
                meta: {
                    title: '首页'
                },

            },
            {
                path: '/answer',
                component: () => import('../view/answer/index.vue'),
                nmae: 'answer',
                meta: {
                    title: '等你来答'
                },

            },
            {
                path: '/ask',
                component: () => import('../view/ask/index.vue'),
                nmae: 'ask',
                meta: {
                    title: '提问'
                },

            },
            {
                path: '/questionEditor',
                component: () => import('../view/questionEditor/index.vue'),
                nmae: 'questionEditor',
                meta: {
                    title: '修改问题'
                },

            },
            {
                path: '/questionDetail',
                component: () => import('../view/questionDetail/index.vue'),
                name: 'questionDetail',
                meta: {
                    title: '问题详情'
                },
            },
             {
                path: '/articleDetail',
                component: () => import('../view/article/showDetail.vue'),
                name: 'articleDetail',
                meta: {
                    title: '文章详情'
                },
            },
            {
                path: '/articleCreate',
                name: 'ArticleCreate',
                component: () => import('../view/article/release.vue'),
                 meta: {
                    title: '发布文章'
                },
            },
            {
                path: '/articleEditor',
                name: 'ArticleEditor',
                component: () => import('../view/article/editor.vue'),
                 meta: {
                    title: '修改文章'
                },
            },
            {
                path: '/my',
                redirect: '/my/myQuestion',
                component: () => import('../view/my/index.vue'),
                name: 'my',
                meta: {
                    title: '我的主页'
                },
                children: [
                    {
                        path: '/my/myQuestion',
                        component: () => import('../view/myQuestion/index.vue'),
                        name: 'myQuestion',
                        meta: {
                            title: '我的问题'
                        },
                    },
                    {
                        path: '/my/myArticle',
                        component: () => import('../view/myArticle/index.vue'),
                        name: 'myArticle',
                        meta: {
                            title: '我的文章'
                        },
                    },
                    {
                        path: '/my/myCollect',
                        component: () => import('../view/myCollect/index.vue'),
                        name: 'myCollect',
                        meta: {
                            title: '我的收藏'
                        },
                    },
                ]
            },
            {
                path: '/editUserInfo',
                component: () => import('../view/editUserInfo/index.vue'),
                name: 'editUserInfo',
                meta: {
                    title: '编辑个人资料'
                }
            },
            {
                path: '/search',
                component: () => import('../view/search/index.vue'),
                name: 'search',
                meta: {
                    title: '搜索'
                },
            },
            {
                path: '/ai-chat',
                component: () => import('../view/aiChat/index.vue'),
                name: 'aiChat',
                meta: {
                    title: 'AI智能助手'
                },
            },
            {
                path: '/articles',
                component: () => import('../view/article/index.vue'),
                name: 'articles',
                meta: {
                    title: '文章专栏'
            }
            },
            {
                path: '/files',
                component: () => import('../view/files/index.vue'),
                name: 'files',
                meta: {
                    title: '资源站'
                },
            }
        ]
    },
    {
        path: '/login',
        component: () => import('../view/login/index.vue'),
        name: 'login',
        meta: {
            title: '登录页',
            hidden: true
        }
    },
    {
        path: '/register',
        component: () => import('../view/register/index.vue'),
        name: 'register',
        meta: {
            title: '注册页',
            hidden: true
        }
    },
    {
        path: '/404',
        component: () => import('../view/404/index.vue'),
        name: '404',
        meta: {
            title: '404',
            hidden: true
        }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
        name: 'Any',
        meta: {
            title: '默认路由',
            hidden: true
        }
    }

]
export default routes;