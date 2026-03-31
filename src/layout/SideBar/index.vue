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
    
        <div class="create-box">
            <p class="title">开启你的问答网站创作之旅</p>
            <div class="context">
                <p>发布首篇内容，开通创作中心快来成为问答网站创作者吧~</p>
                <img src="../../assets/image/i-create.png" alt="">
            </div>
        </div>
        <el-button :icon="Plus" class="startCreateBtn" @click="gotoCreateArticle()">开始创作</el-button>
    </el-card>
        <!-- 大家都在搜 -->
        <el-card class="trending-card" shadow="hover">
          <div class="card-header">
            <span>大家都在搜</span>
            <el-link type="primary" @click="refreshTrending">换一换</el-link>
          </div>
          <ul class="trending-list">
            <li
              v-for="(item, idx) in trendingList"
              :key="idx"
              class="trending-item"
              @click="search(item.keyword)"
            >
              <span class="rank">{{ idx + 1 }}</span>
              <span class="keyword">{{ item.keyword }}</span>
              <span class="hot">{{ item.hot }}</span>
            </li>
          </ul>
        </el-card>
</template>

<script setup lang="ts">
import { Avatar, Document, Plus, HelpFilled } from '@element-plus/icons-vue'
import { ref } from 'vue';
import {useRouter} from "vue-router";   
const pageCount = ref(3);
const router = useRouter();
// 大家都在搜
const trendingList = ref([
  { keyword: "现货黄金大幅跳水后再反弹", hot: "412万" },
  { keyword: "警方通报「金晨被曝肇事」", hot: "366万" },
  { keyword: "宝可梦在靖国神社举办活动", hot: "363万" },
]);
const pageNo = ref(0);
const changeUserList = ()=>{
    console.log(pageCount.value,pageNo.value)
}

const gotoResource = ()=>{
    router.push('/files')
}
const gotoCreateArticle=()=>{
    router.push('/articleCreate')
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
.trending-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .trending-list {
    list-style: none;
    padding: 0;
    margin: 0;

    .trending-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        color: #1772f6;
      }

      .rank {
        width: 20px;
        color: #858585;
        font-size: 13px;
      }

      .keyword {
        flex: 1;
      }

      .hot {
        color: #858585;
        font-size: 12px;
      }
    }
  }
}
</style>