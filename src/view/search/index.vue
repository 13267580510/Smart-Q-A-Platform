<template>
    <div class="search">
        <div class="left">
            <el-card class="question-box">
                <template v-for="item in 9">
                    <div class="item">
                        <div class="question">
                            <div class="title" @click="goQuestionDetail">有没有先婚后爱的甜宠文？</div>
                            <div class="detail">藏山宇宙： 跟古板丈夫联姻第三年，我突然想出去找点刺激。 正寻思怎么提离婚，眼前突然飘过弹幕： 【男主是个人才，又从聚会上接了个闹钟就溜了。】
                                【还不
                            </div>
                        </div>
                        <div class="bottom">
                            <el-button :icon="CaretTop" class="up" :class="[{ active: isUp }]"
                                @click="up">赞同342</el-button>
                            <el-button :icon="CaretBottom" class="down" :class="[{ active: isDown }]"
                                @click="down">不赞同10</el-button>
                            <div class="menu">
                                <div class="collect" @click="collect" :class="[{ activeC: isCollect }]">
                                    <el-icon>
                                        <component :is="Star"></component>
                                    </el-icon>
                                    <p>收藏</p>
                                </div>
                                <div class="answer">
                                    <el-icon>
                                        <component :is="ChatDotSquare"></component>
                                    </el-icon>
                                    <p>回答数 1906</p>
                                </div>
                                <div class="report" @click="report">
                                    <el-icon>
                                        <component :is="Pointer"></component>
                                    </el-icon>
                                    <p>举报</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </el-card>
        </div>
        <div class="right">
            <side-bar />
        </div>
    </div>
</template>

<script setup lang="ts">
import SideBar from '../../layout/SideBar/index.vue'
</script>

<style scoped>
.search {
    display: flex;

    .left {
        width: 100%;
        margin-right: 20px;

        .question-box {
            .item {
                margin-bottom: 20px;

                .title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }

                .question {
                    margin-bottom: 20px;

                    .title {
                        font-size: 20px;
                        cursor: pointer;
                    }

                    .title:hover {
                        color: rgb(9, 64, 142);
                    }

                    .detail {
                        width: 100%;
                        height: 50px;
                        display: -webkit-box;
                        overflow: hidden;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        text-overflow: ellipsis;
                    }

                }

                .bottom {
                    display: flex;
                    align-items: center;

                    button {
                        background-color: rgb(231, 241, 254);
                        color: rgb(23, 114, 246);
                        border: none;
                    }

                    .active {
                        background-color: #1772F6;
                        color: #fff;
                    }

                    .active:hover {
                        background-color: #1772F6;
                        color: #fff;
                    }

                    button:hover {
                        background-color: rgb(220, 234, 254);
                    }

                    .menu {
                        display: flex;
                        align-items: center;
                        color: #758195;
                        font-size: 14px;

                        .activeC {
                            color: #1772F6;
                        }

                        div {
                            cursor: pointer;
                            margin-left: 20px;
                            display: flex;
                            align-items: center;

                            p {
                                margin-left: 5px;
                            }
                        }
                    }
                }
            }
        }
    }

    .right {
        width: 600px;
    }
}
</style>