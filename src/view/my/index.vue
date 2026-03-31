<template>
    <div>
        <el-card class="header">
           <div class="userBox">
            <img 
                :src="UserStore.userInfo?.avatarPath ? 'http://127.0.0.1:8080' + UserStore.userInfo.avatarPath : defaultAvatar" 
                alt="用户头像"
            >                
                <div class="userInfo">
                    <div class="user">
                        <div class="username">{{UserStore.userInfo.nickname}}</div>
                        <div class="userdetail" v-show="isFold">{{ UserStore.userInfo.introduction }}</div>
                        <div class="userbot" @click="isFold = !isFold">
                            <el-icon>
                                <component :is="isFold?ArrowUp:ArrowDown"></component>
                            </el-icon>
                            <div>查看详细资料</div>
                        </div>
                    </div>
                    <el-button class="editBtn" @click="editUserInfo">编辑个人资料</el-button>
                </div>
           </div>
        </el-card>
        <el-card>
            <el-menu mode="horizontal" :default-active="activeIndex" @select="handleSelect" router>
                <el-menu-item index="/my/myquestion">我的问题</el-menu-item>
                <el-menu-item index="/my/myArticle">我的文章</el-menu-item>
                <el-menu-item index="/my/myCollect">我的收藏</el-menu-item>
            </el-menu>
            <div class="show" style="margin-top: 10px;">
                <router-view></router-view>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {ref} from 'vue'
import useUserStore from '../../store/modules/user';
import {ArrowDown,ArrowUp} from '@element-plus/icons-vue'
import defaultAvatar from '../../assets/icons/default_avat.svg'
const $router = useRouter();
const activeIndex = ref('/my/myquestion')
const UserStore = useUserStore()
const isFold = ref(false)
const editUserInfo = ()=>{
    $router.push('/editUserInfo')
}
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped lang="scss">
.header{
    height: 300px;
    background-image: linear-gradient(to bottom,#1772F6,#fff);
    position: relative;
    margin-bottom: 10px;
    .userBox{
        width: 100%;
        height: 150px;
        background-color: #fff;
        position: absolute;
        bottom: 0;
        left: 0;
        img{
            width: 150px;
            height: 150px;
            border: 4px solid #fff;
            border-radius: 10px;
            position: absolute;
            top: -50%;
            left: 5%;
        }
        .userInfo{
            width: 70%;
           position: absolute;
           left: 24%;
           top: 15%;
           display: flex;
           justify-content: space-between;
           align-items: center;
           .user{
            .username{
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            .userbot{
                margin-top: 5px;
                display: flex;
                align-items: center;
                font-size: 14px;
                color: #8491A5;
                cursor: pointer;
                div{
                    margin-left: 10px;
                }
            }
           }
           .editBtn{
            color: #1772F6;
            border: 1px solid #1772F6;
           }
        }
    }
}
</style>