<template>
    <div>
         <el-card style="margin-bottom: 10px;">
            <el-select v-model="Status" style="width: 300px; margin-right: 10px;">
                <el-option value="全部">全部</el-option>
                <el-option value="待审核">待审核</el-option>
                <el-option value="已审核">已审核</el-option>
                <el-option value="已封禁">已封禁</el-option>
            </el-select>
            <el-button type="primary" @click="search(1,true)">查询</el-button>
        </el-card>
        <el-card>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="questionAllList">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                <el-table-column label="问题标题" width="150">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">{{ row.title }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="正文">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;" class="box" v-html="row.content.content">
                        </p>
                    </template>
                </el-table-column>
                <el-table-column label="发布者" width="150">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">{{ row.author.nickname }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="点赞数" width="80" align="center">
                    <template #="{ row }">
                        <pre>{{ row.likeCount }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="点踩数" width="80" align="center">
                    <template #="{ row }">
                        <pre>{{ row.dislikeCount }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="浏览数" align="center" width="80">
                    <template #="{ row }">
                        <pre>{{ row.viewCount }}</pre>
                    </template>
                </el-table-column>
                 <el-table-column label="状态" width="100" align="center">
                    <template #="{ row }">
                        <el-tag :type="row.status === 'PENDING'?'info':(row.status === 'NORMAL'?'success':'danger')">{{ row.status === 'PENDING'?'待审核':(row.status === 'NORMAL'?'已审核':'已封禁') }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #="{ row }" width="200">
                        <el-button type="primary" @click="lookQuestion(row)">查看</el-button>
                        <el-popconfirm class="box-item" title="你确认要删除该问题吗？" placement="bottom" width="200" @confirm="delQuestion(row.id)">
                            <template #reference>
                                <el-button type="danger" :disabled="row.status == 'PENDING'">删除</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :page-sizes="[3, 5, 7, 9]"
                background layout="prev, pager, next, jumper,->, sizes,total" :total="total" @current-change="pagenav(pageNo)" @size-change="pagenav()"/>
        </el-card>
        <el-dialog v-model="isLook" title="查看问题" width="700" v-if="isLook" style="margin-top: 5%;">
            <div class="content">
                <div class="label">问题标题：</div>
                <div class="main" style="font-weight: bold;">{{lookInfo.title}}</div>
            </div>
            <div class="content">
                <div class="label">正文：</div>
                <div class="main" style="height: 300px;width: 500px; border: 1px solid #ccc;overflow: auto;">
                    <div v-html="lookInfo.content.content"></div>
                </div>
            </div>
            <div class="content">
                <div class="label">发布者：</div>
                <div class="main">
                    <el-tag type="success">{{ lookInfo.author.nickname }}</el-tag>
                </div>
            </div>
            <div class="content">
                <div style="display: flex;margin-right: 30px;align-items: center;">
                    <p style="width: 100px;text-align: right;font-weight: bold;margin-right: 10px;">点赞数：</p>
                    <p>
                        <el-tag type="warning">{{lookInfo.likeCount}}</el-tag>
                    </p>
                </div>
                <div style="display: flex;margin-right: 30px;align-items: center;">
                    <p style="font-weight: bold;margin-right: 10px;">点踩数：</p>
                    <p>
                        <el-tag type="danger">{{lookInfo.dislikeCount}}</el-tag>
                    </p>
                </div>
                <div style="display: flex;margin-right: 30px;align-items: center;">
                    <p style="font-weight: bold;margin-right: 10px;">浏览数：</p>
                    <p>
                        <el-tag type="primary">{{ lookInfo.viewCount }}</el-tag>
                    </p>
                </div>
            </div>
            <div class="content">
                <div class="label">状态：</div>
                <div class="main">
                    <el-tag :type="lookInfo.status === 'PENDING'?'info':(lookInfo.status === 'NORMAL'?'success':'danger')">{{ lookInfo.status === 'PENDING'?'待审核':(lookInfo.status === 'NORMAL'?'已审核':'已封禁') }}</el-tag>
                </div>
            </div>
            <div class="btn" style="display: flex;margin-top: 20px;">
                <el-button type="success" style="flex: 1;" @click="isAccept = true" v-if="lookInfo.status == 'PENDING'">审核通过</el-button>
                <el-button type="danger" style="flex: 1;" @click="innerConfirm = true" v-if="lookInfo.status != 'PENDING'">删除</el-button>
                <el-button style="flex: 1;" @click="isLook = false">取消</el-button>
            </div>
            <el-dialog v-model="innerConfirm" title="提示" width="250" style="position: absolute;top: 30%;left: 50%;transform: translate(-50%,-50%);">
                <div>你确认要删除该问题吗？</div>
                <div style="display: flex;margin-top: 20px;">
                    <el-button type="primary" style="flex:1" @click="delQuestion(lookInfo.id)">
                        确定
                    </el-button>
                    <el-button style="flex:1" @click="innerConfirm = false">
                        取消
                    </el-button>
                </div>
            </el-dialog>
            <el-dialog v-model="isAccept" title="提示" width="250" style="position: absolute;top: 30%;left: 50%;transform: translate(-50%,-50%);">
                <div>你确认要审核通过该问题吗？</div>
                <div style="display: flex;margin-top: 20px;">
                    <el-button type="primary" style="flex:1" @click="approvedQuestion(lookInfo.id)">
                        确定
                    </el-button>
                    <el-button style="flex:1" @click="isAccept= false">
                        取消
                    </el-button>
                </div>
            </el-dialog>
        </el-dialog>
    </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { ReqGetUserReport } from '../../../api/admin/report/index'
import { ReqApprovedQuestion, ReqDelAdminQuestion, ReqGetAdminQuestionAll, ReqSearchAdminQuestion} from '../../../api/question'
import { ElMessage } from 'element-plus'
const isAccept = ref(false)
const isLook = ref(false);
const innerConfirm = ref(false)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(5)
const questionAllList = ref([]);
const lookInfo = ref({})
const Status = ref('')
const getQuestionAll = async (page = 1,show = false,search = false)=>{
    pageNo.value = page;
    let result = await ReqGetAdminQuestionAll(pageNo.value,pageSize.value);
    console.log(result)
    if(result.status === 200){
        questionAllList.value = result.data;
        total.value = result.total
        if(show){
            ElMessage.success('获取问题列表成功')
        }else if(search) ElMessage.success('查询问题成功')
        return 'ok'
    }else{
        ElMessage({
            type:'error',
            message:'获取问题列表失败'
        })
    }
}
const delQuestion = async (id) =>{
    let result = await ReqDelAdminQuestion(id);
    if(result.status == 200){
        ElMessage.success('删除问题信息成功');
        if(Status.value == '' || Status.value == '全部'){
            getQuestionAll(pageNo.value);
        }else{
            search(pageNo.value)
        }
        innerConfirm.value = false;
        isLook.value = false
        return 'ok'
    }else{
        ElMessage.error('删除问题信息失败');
        innerConfirm.value = false;
        isLook.value = false
        return Promise.reject('删除问题信息失败')
    }
}
const approvedQuestion = async (id)=>{
    let result = await ReqApprovedQuestion(id,true);
    if(result.status == 200){
        ElMessage.success('问题审核通过成功');
        if(Status.value == '' || Status.value == '全部'){
            getQuestionAll(pageNo.value);
        }else{
            search(pageNo.value)
        }
        isAccept.value = false;
        isLook.value = false
        return 'ok';
    }else{
        ElMessage.error('问题审核通过失败');
        isAccept.value = false;
        isLook.value = false;
        return Promise.reject('问题审核通过失败');
    }
}
const lookQuestion = (row)=>{
    lookInfo.value = row;
    isLook.value = true
}
const pagenav = (page = 1) => {
    pageNo.value = page
    if(Status.value == '' || Status.value == '全部'){
        getQuestionAll(pageNo.value)
    }else{
        search(pageNo.value)
    }
}
const search = async (page = 1,show = false)=>{
    pageNo.value = page;
    let state = '';
    let result;
    if(Status.value == '' || Status.value == '全部'){
        getQuestionAll(page,false,true);
    }else if(Status.value == '待审核'){
        state = 'PENDING'
        result = await ReqSearchAdminQuestion(pageNo.value,pageSize.value,state);
    }else if(Status.value == '已审核'){
        state = 'NORMAL'
        result = await ReqSearchAdminQuestion(pageNo.value,pageSize.value,state);
    }else{
       state = 'CLOSED'
        result = await ReqSearchAdminQuestion(pageNo.value,pageSize.value,state); 
    }
    if(result.status == 200){
        questionAllList.value = result.data;
        total.value = result.total
        if(show) ElMessage.success('查询问题成功');
    }else{
        ElMessage.error('查询问题失败')
    }
}
onMounted(()=>{
    getQuestionAll(1,true);
})
</script>

<style lang="scss" scoped>
    .box{
        img{
            height: 50px;
        }
    }
    .content{
        display: flex;
        font-size: 16px;
        margin-top: 10px;
        .label{
            width: 100px;
            text-align: right;
            font-weight: bold;
            margin-right: 10px;
        }
    }
</style>