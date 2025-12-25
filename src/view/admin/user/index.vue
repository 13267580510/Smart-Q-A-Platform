<template>
    <div>
        <el-card style="margin-bottom: 10px;">
            <el-select style="width: 300px; margin-right: 10px;" v-model="status">
                <el-option value="全部">全部</el-option>
                <el-option value="正常">正常</el-option>
                <el-option value="封禁">封禁</el-option>
            </el-select>
            <el-button type="primary" @click="search(1, true)">查询</el-button>
        </el-card>
        <el-card>
            <el-button type="primary" @click="addUser">添加用户</el-button>
            <el-table border="1" style="margin-top: 10px;margin-bottom: 20px;" :data="data">
                <el-table-column label="序号" width="100" align="center" type="index"></el-table-column>
                <el-table-column label="昵称" width="150">
                    <template #="{ row }">
                        <pre>{{ row.nickname }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="用户名" width="150">
                    <template #="{ row }">
                        <pre style="overflow: hidden;">{{ row.username }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="密码" width="150">
                    <template #="{ row }">
                        <pre>{{ row.password }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="邮箱" width="150">
                    <template #="{ row }">
                        <pre>{{ row.email }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="身份">
                    <template #="{ row }">
                        <pre>{{ row.role == 'USER' ? '普通用户' : '管理员' }}</pre>
                    </template>
                </el-table-column>
                <el-table-column label="状态">
                    <template #="{ row }">
                        <el-tag :type="row.status == 'ACTIVE' ? 'success' : 'danger'">
                            {{ row.status == 'ACTIVE' ? '正常' : '封禁' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作">
                    <template #="{ row }" width="200">
                        <el-button type="primary" @click="editUser(row)">修改</el-button>
                        <el-popconfirm class="box-item" title="你确认要删除该用户吗？" placement="bottom" width="200"
                            @confirm="delUser(row.id)">
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
        <el-dialog v-model="isAddUser" title="添加用户" width="500">
            <el-form label-width="auto" ref="addUserForms" :model="registerForm" :rules="rules">
                <el-form-item label="昵称">
                    <el-input placeholder="请输入昵称" v-model="registerForm.nickname"></el-input>
                </el-form-item>
                <el-form-item label="用户名" prop="username">
                    <el-input placeholder="请输入用户名" v-model="registerForm.username"></el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input placeholder="请输入密码" v-model="registerForm.password"></el-input>
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input placeholder="请输入邮箱" v-model="registerForm.email"></el-input>
                </el-form-item>
                <el-form-item label="身份" prop="role">
                    <el-select v-model="registerForm.roleShow">
                        <el-option value="普通用户">
                            普通用户
                        </el-option>
                        <el-option value="管理员">
                            管理员
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
            <div style="display: flex;">
                <el-button type="primary" style="flex:1" @click="confirm('add')">确定</el-button>
                <el-button style="flex:1" @click="cancel('add')">取消</el-button>
            </div>
        </el-dialog>
        <el-dialog v-model="isEditUser" title="修改用户" width="500">
            <el-form label-width="auto" ref="editUserForms" :model="editForm" :rules="rules">
                <el-form-item label="昵称">
                    <el-input placeholder="请输入昵称" v-model="editForm.nickname"></el-input>
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input placeholder="请输入用户名" v-model="editForm.username" disabled></el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input placeholder="请输入密码" v-model="editForm.password"></el-input>
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input placeholder="请输入邮箱" v-model="editForm.email"></el-input>
                </el-form-item>
                <el-form-item label="身份">
                    <el-input v-model="editForm.roleShow" disabled></el-input>
                </el-form-item>
            </el-form>
            <div style="display: flex;">
                <el-button type="primary" style="flex:1" @click="confirm('edit')">确定</el-button>
                <el-button style="flex:1" @click="cancel('edit')">取消</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import { ReqGetUserReport } from '../../../api/admin/report/index'
import { ElMessage, FormRules } from 'element-plus'
import { ReqDeleteUser, ReqGetSearchUserList, ReqGetSearchUserName, ReqGetUserAll, ReqRegister, ReqRegisterAdmin, ReqUpdateUserInfo } from '../../../api//user'
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(5)
const isAddUser = ref(false)
const isEditUser = ref(false)
const status = ref('');
const username = ref('')
const addUserForms = ref();
const editUserForms = ref();
const queryUser = async ()=>{
    if(username.value.trim()){
        let result = await ReqGetSearchUserName(username.value);
    }else{
        ElMessage.error('输入的用户名不能为空！');
    }
}
const registerForm = ref({
    nickname: '',
    username: '',
    password: '',
    email: '',
    age: 'Defalut',
    residence: 'Defalut',
    roleShow: ''
})
const editForm = ref({
    id: 0,
    nickname: '',
    username: '',
    password: '',
    email: '',
    role: '',
    roleShow: ''
})
const addUser = () => {
    isAddUser.value = true;
    addUserForms.value.clearValidate()
    registerForm.value = {
        nickname: '',
        username: '',
        password: '',
        email: '',
        age: 'Defalut',
        residence: 'Defalut',
        roleShow: ''
    }
}
const cancel = (type: string) => {
    if (type === 'add') {
        isAddUser.value = false;
    } else if (type === 'edit') {
        isEditUser.value = false
    }
}
const editUser = async (row: any) => {
    isEditUser.value = true;
    editUserForms.value.clearValidate();
    const { id, nickname, username, password, email, role } = row
    editForm.value = {
        id,
        nickname,
        username,
        password,
        email,
        role,
        roleShow: ''
    };
    editForm.value.roleShow = row.role == 'USER' ? '管理员' : '普通用户'
}
const validateUsername = (rule: any, value: any, callback: any) => {
    const usernameLenRegex = /^.{6,20}$/;
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (value === '') {
        callback(new Error('用户名不能为空'))
    } else if (!usernameLenRegex.test(value)) {
        callback(new Error("用户名应为6-20位"))
    } else if (!usernameRegex.test(value)) {
        callback(new Error("用户名应由字母、数字、下划线组成"));
    } else {
        callback()
    }
}
const validatePassword = (rule: any, value: any, callback: any) => {
    const passwordLenRegex = /^.{6,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if (value === '') {
        callback(new Error('密码不能为空'))
    } else if (!passwordLenRegex.test(value)) {
        callback(new Error("密码应至少为6位"))
    } else if (!passwordRegex.test(value)) {
        callback(new Error("密码必须包含字母和数字"));
    } else {
        callback()
    }
}
const validateEmail = (rule: any, value: any, callback: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value === '') {
        callback(new Error('邮箱不能为空'))
    } else if (!emailRegex.test(value)) {
        callback(new Error("输入必须符合邮箱格式，如123@163.com"))
    } else {
        callback()
    }
}
const validateRole = (rule: any, value: any, callback: any) => {
    if (value === '') {
        callback(new Error('身份不能为空'))
    } else {
        callback()
    }
}
const rules = reactive<FormRules<typeof ruleForm>>({
    username: [
        { required: true, validator: validateUsername, trigger: 'blur' }
    ],
    password: [
        { required: true, validator: validatePassword, trigger: 'blur' }
    ],
    email: [
        { required: true, validator: validateEmail, trigger: 'blur' }
    ],
    role: [
        { required: true, validator: validateRole, trigger: 'blur' }
    ],
})
const data = ref([
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员',
        email: '123@qq.com'
    },
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员'
    },
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员'
    },
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员'
    },
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员'
    },
    {
        nickname: '久梦辰',
        username: 'jiumengchen',
        password: '123456qwe',
        role: '管理员'
    }
])
const getUserList = async (page = 1, show = false, showSearch = false) => {
    pageNo.value = page
    let result = await ReqGetUserAll(pageNo.value, pageSize.value);
    if (result.status === 200) {
        data.value = result.data.data;
        total.value = result.data.totalElements
        if (show) {
            ElMessage.success('获取用户信息成功')
        } else if (showSearch) {
            ElMessage.success('查询用户信息成功')
        }
        return 'ok';
    } else {
        ElMessage({
            type: 'error',
            message: '获取用户信息失败'
        })
        return Promise.reject('获取用户信息失败')
    }
}
const search = async (page = 1, show = false) => {
    if (status.value && status.value != '全部') {
        pageNo.value = page
        let state = status.value == '封禁' ? 'BANNED' : (status.value == '正常' ? 'ACTIVE' : 'INACTIVE');
        let result = await ReqGetSearchUserList(pageNo.value, pageSize.value, state)
        if (result.status === 200) {
            data.value = result.data.data;
            total.value = result.data.totalElements
            if (show) {
                ElMessage({
                    type: 'success',
                    message: '查询用户信息成功'
                })
            }
            return 'ok';
        } else {
            ElMessage({
                type: 'error',
                message: '查询用户信息失败'
            })
            return Promise.reject('获取用户信息失败')
        }
    } else if (status.value == '全部') {
        getUserList(1, false, true);
    } else {
        getUserList(1, false, true);
    }
}
const pagenav = (page = 1) => {
    pageNo.value = page
    if (status.value == '' || status.value == '全部') {
        getUserList(page)
    } else {
        search(page)
    }
}
const confirm = async (type: string) => {
    if (type === 'add') {
        await addUserForms.value.validate()
        let result;
        if (registerForm.value.roleShow == '普通用户') {
            result = await ReqRegister(registerForm.value);
        } else {
            result = await ReqRegisterAdmin(registerForm.value);
        }
        if (result.status == 200 || result.status == 201) {
            getUserList();
            ElMessage({
                type: 'success',
                message: '添加用户信息成功'
            })
            isAddUser.value = false;
            return 'ok'
        } else {
            ElMessage({
                type: 'error',
                message: '添加用户信息失败'
            })
            return Promise.reject('添加用户信息失败');
        }

    } else if (type === 'edit') {
        console.log(editForm.value)
        let result = await ReqUpdateUserInfo(editForm.value.id, editForm.value);
        if (result.status == 200) {
            if (status.value) {
                search(pageNo.value);
            } else {
                getUserList(pageNo.value)
            }
            ElMessage({
                type: 'success',
                message: '修改用户信息成功'
            })
        }
        console.log(result);
        isEditUser.value = false
    }
}
const delUser = async (id: number) => {
    console.log(id);
    let result = await ReqDeleteUser(id);
    if (result.status == 200) {
        if (status.value) {
            search(pageNo.value)
        } else {
            getUserList(pageNo.value)
        }
        ElMessage({
            type: 'success',
            message: '删除用户信息成功'
        })

        return 'ok'
    } else {
        ElMessage({
            type: 'error',
            message: '删除用户信息失败'
        })
        return Promise.reject('删除用户失败')
    }
}
onMounted(() => {
    getUserList(1, true)
})
</script>

<style scoped lang="scss"></style>