<template>
    <div>
        <el-card style="margin-bottom: 10px;">
            <el-select v-model="Status" style="width: 300px; margin-right: 10px;">
                <el-option value="全部">全部</el-option>
                <el-option value="待审核">待审核</el-option>
                <el-option value="已驳回">已驳回</el-option>
                <el-option value="已封禁">已封禁</el-option>
            </el-select>
            <el-button type="primary" @click="search(1,true)">查询</el-button>
        </el-card>
        <el-card>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="data">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                <el-table-column label="问题标题" width="100">
                    <template #="{ row }">
                        <p style="width: 100%;overflow: hidden;white-space: nowrap;text-overflow: ellipsis;">{{ row.questionTitle }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="举报者用户名" width="150" align="center">
                    <template #="{ row }">
                        <pre>{{ row.reporterUsername }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报类型" width="100" align="center">
                    <template #="{ row }">
                        <pre>{{ row.reason == 'SPAM'?'垃圾内容':(row.reason == 'OFFENSIVE'?'冒犯性内容':(row.reason == 'INAPPROPRIATE'?'不适当内容':'其他')) }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报时间" width="150" align="center">
                    <template #="{ row }">
                        <pre>{{ formatTimestamp(row.reportTime) }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报理由">
                    <template #="{ row }">
                        <p style="overflow: hidden;">{{ row.description }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="100" align="center">
                    <template #="{ row }">
                        <el-tag :type="row.status == 'PENDING'?'success':(row.status == 'APPROVED'?'danger':'primary')">{{ row.status == 'PENDING'?'待审核':(row.status == 'APPROVED'?'已封禁':'已驳回') }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #="{ row }">
                        <el-button type="primary" @click="handle(row)">处理</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :page-sizes="[3, 5, 7, 9]"
                background layout="prev, pager, next, jumper,->, sizes,total" :total="total" @current-change="pagenav(pageNo)" @size-change="pagenav()"/>
        </el-card>
        <el-dialog v-model="isHandle" title="处理问题举报" width="500" style="margin-top: 3%;" v-if="isHandle">
            <el-form label-width="auto">
                <el-form-item label="问题标题:">
                    <h4>{{ handleInfo.questionTitle }}</h4>
                </el-form-item>
                <el-form-item label="举报者用户名:">
                    <el-input :value="handleInfo.reporterUsername" disabled></el-input>
                </el-form-item>
                <el-form-item label="举报类型:">
                   <el-input :value="handleInfo.reason == 'SPAM'?'垃圾内容':(handleInfo.reason == 'OFFENSIVE'?'冒犯性内容':(handleInfo.reason == 'INAPPROPRIATE'?'不适当内容':'其他'))" disabled></el-input>
                </el-form-item>
                <el-form-item label="举报时间:">
                    <el-input :value="formatTimestamp(handleInfo.reportTime)" disabled></el-input>
                </el-form-item>
                <el-form-item label="举报理由:">
                    <div style="height: 200px; border: 1px solid #ccc; width: 100%; overflow: auto;">{{ handleInfo.description }}</div>
                </el-form-item>
                <el-form-item label="状态:">
                    <el-tag :type="handleInfo.status == 'PENDING'?'success':(handleInfo.status == 'APPROVED'?'danger':'primary')">{{ handleInfo.status == 'PENDING'?'待审核':(handleInfo.status == 'APPROVED'?'已封禁':'已驳回') }}</el-tag>
                </el-form-item>
            </el-form>
            <div style="display:flex;">
                <el-button type="primary" style="flex: 1;" @click="isReject = true" :disabled="handleInfo.status != 'PENDING'">驳回</el-button>
                <el-button type="danger" style="flex: 1;"  @click="isBan = true" :disabled="handleInfo.status != 'PENDING'">封禁</el-button>
                <el-button style="flex: 1;" @click="isHandle = false">取消</el-button>
            </div>
            <el-dialog v-model="isReject" title="提示" width="250" style="position: absolute;top: 30%;left: 50%;transform: translate(-50%,-50%);">
                <div>你确认要驳回该举报吗？</div>
                <div style="display: flex;margin-top: 20px;">
                    <el-button type="primary" style="flex:1" @click="confirm('reject')">
                        确定
                    </el-button>
                    <el-button style="flex:1" @click="isReject = false">
                        取消
                    </el-button>
                </div>
            </el-dialog>
            <el-dialog v-model="isBan" title="提示" width="250" style="position: absolute;top: 30%;left: 50%;transform: translate(-50%,-50%);">
                <div>你确认要封禁该问题吗？</div>
                <div style="display: flex;margin-top: 20px;">
                    <el-button type="primary" style="flex:1" @click="confirm('ban')" >
                        确定
                    </el-button>
                    <el-button style="flex:1" @click="isBan = false">
                        取消
                    </el-button>
                </div>
            </el-dialog>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { ReqGetQuestionReport, ReqHandleQuestionReport, ReqSearchQuestionReport } from '../../../api/admin/report'
import { ElMessage } from 'element-plus';
import { formatTimestamp } from '../../../utils/general'
const Status = ref('')
const data = ref([]);
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(5)
const isHandle = ref(false);
const handleInfo = ref({});
const isReject = ref(false);
const isBan = ref(false);
const handle = (row:any)=>{
    handleInfo.value = row;
    isHandle.value = true;
}
const search = async (page=1,show=false)=>{
    pageNo.value = page;
    if(Status.value && Status.value != '全部'){
        let status = Status.value == '待审核'?'PENDING':(Status.value == '已驳回'?'REJECTED':'APPROVED')
        let result = await ReqSearchQuestionReport(pageNo.value,pageSize.value,status);
        if(result.status == 200){
            data.value = result.data.data;
            total.value = result.data.totalElements;
            if(show) ElMessage.success('查询问题举报列表成功');
            return 'ok'
        }else{
            if(show) ElMessage.error('查询问题举报列表失败');
            return Promise.reject('获取问题举报列表失败');
        }
    }else{
        getQuestionReportList(1,false,true)
    }
}
const confirm = async (type:string)=>{
    let result:any = null;
    if(type == 'ban') result = await ReqHandleQuestionReport(handleInfo.value.id,true)
    else if(type == 'reject') result = await ReqHandleQuestionReport(handleInfo.value.id,false)
    console.log("驳回result",result);
    if(result=="操作成功"){
        if(type=='ban') ElMessage.success('封禁问题成功');
        if(type=='reject') ElMessage.success('驳回举报成功');
        isBan.value = false;
        isReject.value = false;
        isHandle.value = false;
        pagenav(pageNo.value)
        return 'ok'
    }else{
        if(type == 'ban') ElMessage.error('封禁问题失败');
        if(type=='reject') ElMessage.error('驳回举报失败');
         isBan.value = false;
        isReject.value = false;
        isHandle.value = false;
        return Promise.reject('封禁问题失败')
    }
}
const getQuestionReportList = async(page=1,show=false,search=false)=>{
    pageNo.value = page;
    let result = await ReqGetQuestionReport(pageNo.value,pageSize.value);
    console.log("result",result);
    if(result){
        data.value = result.data;
        total.value = result.totalElements;
        if(show) ElMessage.success('获取问题举报列表成功')
        if(search) ElMessage.success('查询问题举报列表成功')
        return 'ok'
    }else{
        ElMessage.error('获取问题举报列表失败');
        if(search) ElMessage.error('查询问题举报列表失败')
        return Promise.reject('获取问题举报列表失败')
    }
}
const pagenav = (page = 1) => {
    pageNo.value = page
    if(Status.value && Status.value != '全部'){
        search(page)
    }else{
        getQuestionReportList(page)
    }
}
onMounted(()=>{
    getQuestionReportList(1,true)
})
</script>

<style scoped></style>