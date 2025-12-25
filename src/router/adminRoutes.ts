
const adminRoutes = [
    {
        path: '/adminLogin',
        component: () => import('../view/admin/login/index.vue'),
        name: 'adminLogin',
        meta: {
            title: '后台管理系统登录页',
            hidden: true
        }
    },
    {
        path: '/admin',
        component: () => import('../view/admin/layout/index.vue'),
        redirect: '/admin/index',
        name: 'admin',
        meta: {
            hidden: true
        },
        children: [
            {
                path: '/admin/index',
                component: () => import('../view/admin/index/index.vue'),
                meta: {
                    title: '首页',
                    icon: 'HomeFilled'
                },

            }
        ]
    },
    {
        path: '/adminUserManage',
        component: () => import('../view/admin/layout/index.vue'),
        redirect: '/adminUserManage/user',
        name: 'adminUserManage',
        meta: {
            title: '用户管理',
            icon: 'Avatar',
            hidden: true
        },
        children: [
            {
                path: '/adminUserManage/user',
                component: () => import('../view/admin/user/index.vue'),
                meta: {
                    title: '用户信息',
                    icon: 'UserFilled'
                },

            }
        ]
    },
    {
        path: '/adminQuestionManage',
        component: () => import('../view/admin/layout/index.vue'),
        redirect: '/adminQuestionManage/question',
        name: 'adminQuestionManage',
        meta: {
            hidden: true,
            title: '问题管理',
            icon: 'HelpFilled'
        },
        children: [
            {
                path: '/adminQuestionManage/question',
                component: () => import('../view/admin/question/index.vue'),
                meta: {
                    title: '问题信息',
                    icon: 'QuestionFilled'
                },

            }
        ]
    },
    {
        path: '/adminReportManage',
        component: () => import('../view/admin/layout/index.vue'),
        redirect: '/adminReportManage/userReport',
        name: 'adminReportManage',
        meta: {
            title: '举报管理',
            hidden: true,
            icon: 'WarnTriangleFilled'
        },
        children: [
            {
                path: '/adminReportManage/userReport',
                component: () => import('../view/admin/userReport/index.vue'),
                name: 'userReport',
                meta: {
                    title: '用户举报',
                    icon: 'Avatar'
                }
            },
            {
                path: '/adminReportManage/questionReport',
                component: () => import('../view/admin/questionReport/index.vue'),
                name: 'questionReport',
                meta: {
                    title: '问题举报',
                    icon: 'QuestionFilled'
                }
            },
            {
                path: '/adminReportManage/answerReport',
                component: () => import('../view/admin/answerReport/index.vue'),
                name: 'answerReport',
                meta: {
                    title: '回答举报',
                    icon: 'Comment'
                }
            }
        ]
    },
    {
        path: '/admin/noticeManage',
        component: () => import('../view/admin/layout/index.vue'),
        children: [
            {
                path: '/admin/noticeManage/notice',
                component: () => import('../view/admin/noticeManage/index.vue'),
                meta: {
                    title: '通知管理',
                    icon: 'BellFilled'
                },
            }
        ]

    }
]

export default adminRoutes