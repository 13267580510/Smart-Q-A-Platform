<template>
    <div>
        <el-card style="margin-bottom: 10px;">
            <el-select style="width: 300px;margin-right: 10px;" v-model="selectQuery">
                <el-option value="全部">全部</el-option>
                <el-option value="待审核">待审核</el-option>
                <el-option value="已驳回">已驳回</el-option>
                <el-option value="已封禁">已封禁</el-option>
            </el-select>
            <el-button type="primary" @click="query(1, true)">查询</el-button>
        </el-card>
        <el-card>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="data">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                <el-table-column label="被举报者用户名" width="150">
                    <template #="{ row }">
                        <pre>{{ row.reportedUsername }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报者用户名" width="150">
                    <template #="{ row }">
                        <pre>{{ row.reporterUsername }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报时间" width="150">
                    <template #="{ row }">
                        <pre>{{ formatTimestamp(row.reportTime) }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="举报理由">
                    <template #="{ row }">
                        <p style="overflow: hidden;">{{ row.reportReason }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="100">
                    <template #="{ row }">
                        <p style="overflow: hidden;">
                            <el-tag
                                :type="row.result == 'BAN_USER' ? 'danger' : (row.result == 'REJECT_REPORT' ? 'primary' : 'info')">{{
                                    row.result == 'BAN_USER' ? '已封禁' : (row.result == 'REJECT_REPORT' ? '已驳回' : '待审核')
                                }}</el-tag>
                        </p>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250">
                    <template #="{ row }">
                        <el-popconfirm class="box-item" title="你确认要驳回该举报吗？" placement="bottom" width="200"
                            @confirm="reject(row.id)">
                            <template #reference>
                                <el-button type="primary" :disabled="row.isProcessed">驳回</el-button>
                            </template>
                        </el-popconfirm>
                        <el-button type="danger" :disabled="row.isProcessed"
                            @click="isBan = true; banUserName = row.reportedUsername; banId = row.id; banDate = ''">封禁</el-button>
                        <el-popconfirm class="box-item" title="你确认要解封该用户吗？" placement="bottom" width="200"
                            @confirm="unban(row.id,row.reportedUserId)">
                            <template #reference>
                                <el-button type="success" :disabled="row.result != 'BAN_USER'">解封</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :page-sizes="[3, 5, 7, 9]"
                background layout="prev, pager, next, jumper,->, sizes,total" :total="total"
                @current-change="pagenav(pageNo)" @size-change="pagenav()" />
        </el-card>
        <el-dialog v-model="isBan" width="300" title="封禁用户">
            <el-form label-width="auto">
                <el-form-item label="用户名">
                    <el-input v-model="banUserName" disabled></el-input>
                </el-form-item>
                <el-form-item label="封禁时间">
                    <el-date-picker v-model="banDate" type="date" placeholder="请选择封禁到何时" clearable />
                </el-form-item>
            </el-form>
            <div style="display: flex;">
                <el-button type="danger" style="flex:1" @click="ban">封禁</el-button>
                <el-button @click="isBan = false" style="flex:1">取消</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ReqBanUser, ReqGetUserReport, ReqQueryUserReport, ReqRejectUserReport, ReqUnBanUser } from '../../../api/admin/report/index'
import { ElMessage } from 'element-plus'
import { formatTimestamp } from '../../../utils/general'
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(5)
const data = ref([])
const selectQuery = ref('')
const isBan = ref(false)
const banDate = ref('')
const banUserName = ref('jiumengchen');
const banId = ref(0);
const ban = async () => {
    let result = await ReqBanUser(banId.value, { "banEndTime": formatDate(banDate.value) });
    if (result.status == 200) {
        ElMessage.success('封禁用户成功');
        isBan.value = false;
        pagenav();
        return 'ok'
    } else {
        ElMessage.error('封禁用户失败');
        return Promise.reject('封禁用户失败');
    }

}
const formatDate = (isoDate: String) => {
    const date = new Date(isoDate);

    // 格式化日期部分：年/月/日
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始
    const day = String(date.getDate()).padStart(2, '0');

    // 格式化时间部分：时:分:秒
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // 组合成目标格式
    const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
}
const query = async (page = 1, show = false) => {
    pageNo.value = page;
    let state;
    let result:any = null;
    if (selectQuery.value == '' || selectQuery.value == '全部') {
        getUserReport(1, false, true)
    } else if (selectQuery.value == '待审核') {
        state = ''
        result = await ReqQueryUserReport(pageNo.value, pageSize.value, state,false);
    } else if (selectQuery.value == '已驳回') {
        state = 'REJECT_REPORT';
        result = await ReqQueryUserReport(pageNo.value, pageSize.value, state,true);
    } else {
        state = 'BAN_USER'
        result = await ReqQueryUserReport(pageNo.value, pageSize.value, state,true);
    }
    if (result.status == 200) {
        data.value = result.data.data;
        total.value = result.data.totalElements;
        if (show) ElMessage.success('查询用户举报列表成功')
        return 'ok'
    } else {
        ElMessage.error('查询用户举报列表失败')
        return Promise.reject('查询用户举报列表失败')
    }
}
const reject = async (id: number) => {
    let result = await ReqRejectUserReport(id);
    if (result.status == 200) {
        ElMessage.success('举报驳回成功');
        pagenav(pageNo.value);
        return 'ok'
    } else {
        ElMessage.error('举报驳回失败');
        return Promise.reject('举报驳回失败')
    }
}
const getUserReport = async (page = 1, show = false, query = false) => {
    pageNo.value = page;
    let result = await ReqGetUserReport(pageNo.value, pageSize.value);
    console.log(result)
    if (result.status === 200) {
        data.value = result.data.data;
        total.value = result.data.totalElements;
        if (show) ElMessage.success('获取用户举报列表成功');
        if (query) ElMessage.success('查询用户举报列表成功');
        return 'ok'
    } else {
        ElMessage.error('获取用户举报列表失败');
        return Promise.reject('获取用户举报列表失败')
    }
}
const pagenav = (page = 1) => {
    pageNo.value = page
    if (selectQuery.value && selectQuery.value != '全部') {
        query(page)
    } else {
        getUserReport(page);
    }
}
const unban = async (reportId:number,userId:number) =>{
    let result = await ReqUnBanUser(reportId,userId);
    if(result.status == 200) {
        if(selectQuery.value == '' || selectQuery.value == '全部'){
            getUserReport(pageNo.value)
        }else{
            query(pageNo.value);
        }
        ElMessage.success('用户解封成功');
    }else{
        ElMessage.error('用户解封失败')
    }
}
onMounted(() => {
    getUserReport(1, true);
})
</script>

<style scoped></style>