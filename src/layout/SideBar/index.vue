<template>
    <el-card class="one">
        <div class="header">
            <div class="title">
                <el-icon>
                    <Avatar />
                </el-icon>
                <p>创作中心</p>
            </div>
            <div class="goBox">
                草稿箱(0)
            </div>
        </div>
        <div class="nav">
            <ul>
                <li>
                    <el-button :icon="Document" circle></el-button>
                    <p>我的问题</p>
                </li>
                <li>
                    <el-button :icon="Document" circle></el-button>
                    <p>我的收藏</p>
                </li>
                <li>
                    <el-button :icon="Document" circle></el-button>
                    <p>我的问题</p>
                </li>
                <li>
                    <el-button :icon="Document" circle></el-button>
                    <p>我的举报</p>
                </li>
            </ul>
        </div>
        <div class="create-box">
            <p class="title">开启你的问答网站创作之旅</p>
            <div class="context">
                <p>发布首篇内容，开通创作中心快来成为问答网站创作者吧~</p>
                <img src="../../assets/image/i-create.png" alt="">
            </div>
        </div>
        <el-button :icon="Plus" class="startCreateBtn">开始创作</el-button>
    </el-card>
    <el-card class="circle">
        <div class="header">
            <div class="title">
                <el-icon>
                    <HelpFilled />
                </el-icon>
                <p>关注用户</p>
            </div>
            <div class="goBox">
                全部用户
            </div>
        </div>
        <div class="main">
            <template v-for="item in 3">
                <div class="item">
                <div class="infoBox">
                    <img src="../../assets/icons/pUser.svg" alt="">
                    <div class="info">
                        <p>username</p>
                        <p>回答问题数:1999</p>
                    </div>
                </div>
                <el-button type="primary">关注</el-button>
            </div>
            </template>
             <div style="display: flex; align-items: center;justify-content: center;">
                <el-pagination layout="prev, pager, next" :total="9" v-model:page-size="pageCount" v-model:current-page="pageNo" @change="changeUserList"/>
            </div>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { Avatar, Document, Plus, HelpFilled } from '@element-plus/icons-vue'
import { ref } from 'vue';
const pageCount = ref(3);
const pageNo = ref(0);
const changeUserList = ()=>{
    console.log(pageCount.value,pageNo.value)
}
</script>

<style scoped lang="scss">
.one {
    width: 100%;
    margin-bottom: 10px;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            display: flex;
            align-items: center;

            p {
                margin-left: 10px;
            }
        }

        .goBox {
            color: rgb(132, 145, 165);
            font-size: 12px;
            cursor: pointer;
        }
    }

    .nav {
        margin-top: 20px;

        ul {
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-align: center;
            font-size: 14px;

            li {
                button {
                    margin-bottom: 10px;
                    width: 50px;
                    height: 50px;
                }
            }
        }
    }

    .create-box {
        padding: 30px 20px;
        background-color: rgb(249, 249, 250);
        border-radius: 5px;
        box-sizing: border-box;

        .title {
            font-weight: bold;
        }

        .context {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: rgb(145, 150, 181);

            img {
                width: 80px;
                height: 80px;
            }
        }
    }

    .startCreateBtn {
        margin-top: 15px;
        width: 100%;
        height: 50px;
        font-weight: bold;
        color: rgb(23, 114, 246);
        border-color: rgb(23, 114, 246);
    }
}

.circle {
    margin-bottom: 10px;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .title {
            display: flex;
            align-items: center;

            p {
                margin-left: 10px;
            }
        }

        .goBox {
            color: rgb(132, 145, 165);
            font-size: 12px;
            cursor: pointer;
        }
        
    }
    .main{
        margin-top: 20px;
       .item{
        box-sizing: border-box;
        padding: 10px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
         .infoBox{
            display: flex;
            align-items: center;
            img{
                width: 50px;
                height: 50px;
                border-radius: 5px;
            }
            .info{
                margin-left: 10px;
                p{
                    font-size: 18px;
                    font-weight: bold;
                }
                p:nth-child(2){
                    font-size: 12px;
                    font-weight: normal;
                }
            }
        }
       }
    }
    
}
</style>