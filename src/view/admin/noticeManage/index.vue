<template>
    <div>
        <el-card>
            <el-button type="primary" @click="send">发布通知</el-button>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="data">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                <el-table-column label="通知内容">
                    <template #="{ row }">
                        <pre>{{ row.notificationContent }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="接收者" width="150" align="center">
                    <template #="{ row }">
                        <pre>{{ row.username=='所有用户'?'所有用户':'指定用户' }}</pre>
                    </template>
                </el-table-column>
                 <el-table-column label="用户名" width="150" align="center">
                    <template #="{ row }">
                        <pre>{{ row.username=='所有用户'?'无':row.username }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="发布时间" width="150">
                    <template #="{ row }">
                        <pre>{{ formatTimestamp(row.notificationTime) }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                    <template #="{ row }">
                        <el-button type="primary" @click="edit(row)">编辑</el-button>
                        <el-popconfirm class="box-item" title="你确认要封禁该用户吗？" placement="bottom" width="200">
                            <template #reference>
                                <el-button type="danger">删除</el-button>
                            </template>
                        </el-popconfirm>
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :page-sizes="[3, 5, 7, 9]"
                background layout="prev, pager, next, jumper,->, sizes,total" :total="total"
                @current-change="pagenav(pageNo)" @size-change="pagenav()" />
        </el-card>
        <el-dialog title="编辑通知" v-model="isEdit" width="500">
        <el-form label-width="auto">
            <el-form-item label="接收者">
                <el-select v-model="editNoctice.sendType">
                    <el-option value="所有用户">所有用户</el-option>
                    <el-option value="指定用户">指定用户</el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="用户名" v-if="editNoctice.sendType == '指定用户'">
                <el-select v-model="editNoctice.username">
                    <template #header>
                        <el-input placeholder="请输入用户名搜索" v-model="searchUserName"
                            @input="inpUserName"></el-input>
                    </template>
                    <el-option v-for="(item,index) in userInfo" :key="item.id" :value="item.id" :label="item.username" ></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="内容">
                <el-input :rows="4" type="textarea" placeholder="请输入内容" v-model="editNoctice.content" />
            </el-form-item>
        </el-form>
        <div style="display: flex;">
            <el-button type="primary" style="flex:1" @click="reSendNoctice">重新发送</el-button>
            <el-button style="flex:1" @click="cancel('edit')">取消</el-button>
        </div>
    </el-dialog>
    <el-dialog title="发布通知" v-model="isSend" width="500">
        <el-form label-width="auto">
            <el-form-item label="接收者">
                <el-select v-model="nocticeInfo.sendType">
                    <el-option value="所有用户">所有用户</el-option>
                    <el-option value="指定用户">指定用户</el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="用户名" v-if="nocticeInfo.sendType == '指定用户'">
                <el-select v-model="nocticeInfo.userId">
                    <template #header>
                        <el-input placeholder="请输入用户名搜索" v-model="searchUserName"
                            @input="inpUserName"></el-input>
                    </template>
                    <el-option v-for="(item,index) in userInfo" :key="item.id" :value="item.id" :label="item.username"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="内容">
                <el-input :rows="4" type="textarea" placeholder="请输入内容" v-model="nocticeInfo.content" />
            </el-form-item>
        </el-form>
        <div style="display: flex;">
            <el-button type="primary" style="flex:1" @click="sendNoctice">发送</el-button>
            <el-button style="flex:1" @click="cancel('send')">取消</el-button>
        </div>
    </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ReqGetNocticeList, ReqSendNocticeAll, ReqSendNocticeAppoint, ReqUpdateNoctice } from '../../../api/noctice';
import { ElMessage } from 'element-plus';
import { formatTimestamp, debounce } from '../../../utils/general'
import { ReqGetSearchUserName } from '../../../api/user';
const data = ref([]);
const total = ref(40)
const pageNo = ref(1)
const pageSize = ref(5)
const isSend = ref(false)
const isEdit = ref(false)
const searchUserName = ref('')
const userInfo = ref([]);
let timer:any = null;
const nocticeInfo = ref({
    sendType: '',
    userId:'',
    content: ''
})
const editNoctice = ref({
    sendType: '',
    content: '',
    username:'',
    userId:'',
    id:0
})
const sendNoctice = async ()=>{
    if(nocticeInfo.value.sendType == '所有用户'){
        const {content} = nocticeInfo.value
        let result = await ReqSendNocticeAll({content});
        isSend.value = false
        if(result.status == 200){
            ElMessage.success('发布通知成功');
            getNocticeList();
            return 'ok'
        }else{
            ElMessage.error('发布通知失败')
            return Promise.reject('发布通知失败')
        }
    }else{
        const {userId,content} = nocticeInfo.value
        let data = {
            userId:parseInt(userId),
            notificationContent:content
        }
        let result = await ReqSendNocticeAppoint(data.userId,data);
        isSend.value = false
        if(result.status == 200){
            ElMessage.success('发送通知成功')
            getNocticeList();
            return 'ok'
        }else{
            ElMessage.error('发布通知失败')
            return Promise.reject('发布通知失败')
        }
    }
}
const reSendNoctice = async ()=>{
    let result;
    if(editNoctice.value.sendType == '所有用户'){
        result = await ReqUpdateNoctice(editNoctice.value.id,{notificationContent:editNoctice.value.content})
    }else{
        result = await ReqUpdateNoctice(editNoctice.value.id,{userId:parseInt(editNoctice.value.username),notificationContent:editNoctice.value.content})
    }
    if(result.status == 200){
        ElMessage.success('重新发布通知成功')
        getNocticeList(pageNo.value);
    }else{
        ElMessage.error('重新发布通知失败')
    }
    isEdit.value = false
}
const getNocticeList = async (page = 1, show = false) => {
    pageNo.value = page;
    let result = await ReqGetNocticeList(pageNo.value, pageSize.value);
    if (result.status == 200) {
        data.value = result.data.data;
        total.value = result.data.totalElements;
        if (show) ElMessage.success('获取通知信息成功')
        return 'ok'
    } else {
        ElMessage.error('获取通知信息失败')
        return Promise.reject('获取通知信息失败');
    }
}
const pagenav = (page = 1) => {
    pageNo.value = page
    getNocticeList(page)
}
const send = () => {
    isSend.value = true;
    nocticeInfo.value = {
    sendType: '',
    userId:'',
    content: ''
}
}
const edit = (row:any)=>{
    editNoctice.value = {
        sendType:row.username == '所有用户'?'所有用户':'指定用户',
        username:row.username == '所有用户'?'':row.username,
        content:row.notificationContent,
        userId:row.userId,
        id:row.id
    }
    isEdit.value = true;
}
const inpUserName = () => {
   if(searchUserName.value.trim()){
     if (timer) clearTimeout(timer)
    timer = setTimeout(function () {
        getUser(searchUserName.value)
    }, 500)
   }else{
    userInfo.value = []
   }
}
const getUser = async (username:string)=>{
    let result = await ReqGetSearchUserName(1,5,username)
    if(result.status == 200){
        userInfo.value = result.data.data;
        return 'ok'
    }else{
        return Promise.reject('用户模糊查询失败');
    }
}
const cancel = (type:string)=>{
    if(type == 'send') isSend.value = false;
    else if(type == 'edit') isEdit.value = false; 
}
onMounted(() => {
    getNocticeList(1,true)
})
</script>

<style scoped></style>