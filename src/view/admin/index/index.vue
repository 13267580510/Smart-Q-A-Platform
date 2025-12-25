<template>
    <div>
        <el-card style="margin-bottom: 10px;">
            <div class="header">
                <img src="https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif" alt="">
                <div>Hi, <span>{{ UserStore.userInfo.nickname }}</span><span style="margin-left: 20px;">欢迎来到问答后台管理系统哟~</span></div>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import useUserStore from '../../../store/modules/user';

const UserStore = useUserStore()
</script>

<style scoped lang="scss">
    .header{
        display: flex;
        align-items: center;
        img{
            width: 100px;
            height: 100px;
            border-radius: 50%;
        }
        div{
            margin-left: 20px;
            font-size: 20px;
            font-weight: bold;
        }
    }
</style>