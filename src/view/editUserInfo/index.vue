<template>
    <el-card>
        <div class="edit">
            <div class="back" @click="back">
                <p>返回我的主页</p>
                <el-icon>
                    <ArrowRight />
                </el-icon>
            </div>
            <div class="userImgBox">
                <img :src="userInfo.avatarPath ? 'http://127.0.0.1:8080' + userInfo.avatarPath : 'https://img03.sogoucdn.com/app/a/100520093/8379901cc65ba509-45c21ceb904429fc-7587b62e452ef23f277ac5600d144bec.jpg'"
                    alt="">
                <el-upload class="mask" :show-file-list="false"
                     :before-upload="beforeAvatarUpload">
                    <div class="content">
                        <el-icon class="icon">
                            <CameraFilled />
                        </el-icon>
                        <p>修改我的头像</p>
                    </div>
                </el-upload>
            </div>
            <div class="editUserInfo">
                <div class="username">
                    <div class="user" v-if="!editUserName">
                        <div class="title">{{ userInfo.nickname }}</div>
                        <div class="edit" @click="edit('username')">
                            <el-icon>
                                <EditPen />
                            </el-icon>
                            <p>修改</p>
                        </div>
                    </div>
                    <div class="editusername" v-if="editUserName">
                        <el-form>
                            <el-form-item label="昵称">
                                <el-input v-model="editUserInfo.nickname"></el-input>
                            </el-form-item>
                            <el-form-item style="margin-left: 55px;">
                                <el-button type="primary" @click="save('username')">保存</el-button>
                                <el-button @click="cancel('username')">取消</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
                <div class="item">
                    <div class="title">性别</div>
                    <div class="edit" v-if="!isEditSex">
                        <p>{{ userInfo.sex == 'WOMAN' ? '女' : (userInfo.sex == 'MAN' ? '男' : '未知') }}</p>
                        <div class="btn" @click="edit('sex')">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>修改</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditSex">
                        <el-radio-group v-model="editUserInfo.sex" style="margin-bottom: 20px;">
                            <el-radio value="MAN">男</el-radio>
                            <el-radio value="WOMAN">女</el-radio>
                        </el-radio-group>
                        <br />
                        <el-button type="primary" @click="save('sex')">保存</el-button>
                        <el-button @click="cancel('sex')">取消</el-button>
                    </div>
                </div>
                <div class="item">
                    <div class="title">年龄</div>
                    <div class="edit" v-if="!isEditAge">
                        <p>{{ userInfo.age ? userInfo.age : '暂无' }}</p>
                        <div class="btn" @click="edit('age')">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>修改</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditAge">
                        <el-form>
                            <el-form-item>
                                <el-input placeholder="请输入年龄" v-model="editUserInfo.age"></el-input>
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="save('age')">保存</el-button>
                        <el-button @click="cancel('age')">取消</el-button>
                    </div>
                </div>
                <div class="item">
                    <div class="title">一句话介绍</div>
                    <div class="edit" v-if="!isEditIntroduce">
                        <p>{{ userInfo.introduction ? userInfo.introduction : '暂无' }}</p>
                        <div class="btn" @click="edit('introduce')">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>填写</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditIntroduce">
                        <el-form>
                            <el-form-item>
                                <el-input placeholder="请输入介绍" v-model="editUserInfo.introduction"></el-input>
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="save('introduce')">保存</el-button>
                        <el-button @click="cancel('introduce')">取消</el-button>
                    </div>
                </div>
                <div class="item">
                    <div class="title">邮箱</div>
                    <div class="edit" v-if="!isEditEmail">
                        <p>{{ userInfo.email }}</p>
                        <div class="btn" @click="edit('email')">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>换绑</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditEmail">
                        <el-form>
                            <el-form-item>
                                <el-input placeholder="请输入邮箱" v-model="editUserInfo.email"></el-input>
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="save('email')">保存</el-button>
                        <el-button @click="cancel('email')">取消</el-button>
                    </div>
                </div>
                <div class="item">
                    <div class="title">密码</div>
                    <div class="edit" v-if="!isEditPwd">
                        <div class="btn" @click="edit('password')" style="margin: 0;">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>设置新密码</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditPwd">
                        <el-form>
                            <el-form-item>
                                <el-input placeholder="请输入新密码" v-model="editUserInfo.password"></el-input>
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="save('password')">保存</el-button>
                        <el-button @click="cancel('password')">取消</el-button>
                    </div>
                </div>
                <div class="item">
                    <div class="title">居住地</div>
                    <div class="edit" v-if="!isEditAddress">
                        <p>{{ editUserInfo.residence ? editUserInfo.residence : '暂无' }}</p>
                        <div class="btn" @click="edit('address')">
                            <el-icon style="margin-top: 4px;">
                                <EditPen />
                            </el-icon>
                            <p>填写</p>
                        </div>
                    </div>
                    <div class="editInp" v-if="isEditAddress">
                        <el-form>
                            <el-form-item>
                                <el-input placeholder="请输入地址" v-model="editUserInfo.residence"></el-input>
                            </el-form-item>
                        </el-form>
                        <el-button type="primary" @click="save('address')">保存</el-button>
                        <el-button @click="cancel('address')">取消</el-button>
                    </div>
                </div>
            </div>

        </div>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router';
import useUserStore from '../../store/modules/user';
import { ReqUpdatePassword, ReqUpdateUserInfo, ReqUploadUserImg } from '../../api/user';
const UserStore = useUserStore();
const userInfo = ref(UserStore.userInfo);
const $router = useRouter();
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { UploadProps } from 'element-plus'
import request from '../../utils/request';

const beforeAvatarUpload: UploadProps['beforeUpload'] = async (rawFile) => {
    if (rawFile.type == 'image/jpeg' || rawFile.type == 'image/png' || rawFile.type == 'image/git') {
        if (rawFile.size / 1024 / 1024 < 4) {
            const formData = new FormData();
            formData.append('avatarFile',rawFile)
            let result = await ReqUploadUserImg(UserStore.userInfo.id,formData);
            if(result.status == 200){
                UserStore.userInfo.avatarPath = result.data
                localStorage.setItem('userInfo',JSON.stringify(UserStore.userInfo))
                userInfo.value.avatarPath = result.data;
                ElMessage.success('修改用户头像成功')
            }else{
                ElMessage.error('修改用户头像失败')
            }
            return true
        } else {
            ElMessage.error('上传的图片大小应小于4M');
            return false;
        }
    } else {
        ElMessage.error('上传的图片格式应为JPG | PNG | GIF');
        return false
    }
}
const back = () => {
    $router.push('/my')
}
const { id, nickname, sex, age, email, introduction, residence, password } = UserStore.userInfo
const editUserInfo = ref({
    nickname,
    sex,
    age,
    email,
    introduction,
    residence,
    password
})
const updateUserInfo = async () => {
    let result = await ReqUpdateUserInfo(id, editUserInfo.value);
    if (result.status == 200) {
        UserStore.userInfo = result.data;
        localStorage.setItem('userInfo', JSON.stringify(result.data));
        userInfo.value = result.data
        return 'ok'
    } else {
        return Promise.reject('修改用户信息失败')
    }
}
const updateUserPassword = async ()=>{
    let result = await ReqUpdatePassword(UserStore.userInfo.id,editUserInfo.value.password)
    if(result.status ==200){
        ElMessage.success('修改密码成功');
    }else{
        ElMessage.success('修改密码失败');
    }
}
const editUserName = ref(false)
const isEditSex = ref(false);
const isEditIntroduce = ref(false);
const isEditAge = ref(false);
const isEditEmail = ref(false);
const isEditPwd = ref(false);
const isEditAddress = ref(false);
const edit = (type: string) => {
    switch (type) {
        case 'username':
            editUserName.value = true;
            break
        case 'sex':
            isEditSex.value = true;
            break
        case 'introduce':
            isEditIntroduce.value = true;
            break
        case 'age':
            isEditAge.value = true;
            break
        case 'email':
            isEditEmail.value = true;
            break
        case 'password':
            isEditPwd.value = true;
            break
        case 'address':
            isEditAddress.value = true;
            break
    }
}
const save = (type: string) => {
    switch (type) {
        case 'username':
            editUserName.value = false;
            updateUserInfo();
            break
        case 'sex':
            isEditSex.value = false;
            updateUserInfo();
            break
        case 'introduce':
            isEditIntroduce.value = false;
            updateUserInfo();
            break
        case 'age':
            isEditAge.value = false;
            updateUserInfo();
            break
        case 'email':
            isEditEmail.value = false;
            updateUserInfo();
            break
        case 'password':
            isEditPwd.value = false;
            updateUserPassword();
            break
        case 'address':
            isEditAddress.value = false;
            updateUserInfo();
            break
    }
}
const cancel = (type: string) => {
    switch (type) {
        case 'username':
            editUserName.value = false;
            break
        case 'sex':
            isEditSex.value = false;
            break
        case 'introduce':
            isEditIntroduce.value = false;
            break
        case 'age':
            isEditAge.value = false;
            break
        case 'email':
            isEditEmail.value = false;
            break
        case 'password':
            isEditPwd.value = false;
            break
        case 'address':
            isEditAddress.value = false;
            break
    }
}
</script>

<style scoped lang="scss">
.edit {
    display: flex;
    position: relative;

    .userImgBox {
        width: 150px;
        height: 150px;
        margin-right: 20px;
        position: relative;

        img {
            width: 100%;
            height: 100%;
        }

        .mask {
            cursor: pointer;
            width: 100%;
            height: 100%;
            background-color: rgba($color: #000000, $alpha: .5);
            position: absolute;
            top: 0;
            text-align: center;

            .content {
                width: 100%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);

                .icon {
                    color: #fff;
                    font-size: 40px;
                }

                p {
                    color: #fff;
                }
            }
        }
    }

    .editUserInfo {
        width: calc(100% - 150px - 20px);
        margin-top: 30px;

        .username {
            display: flex;
            align-items: center;
            position: relative;

            .user {
                display: flex;
                align-items: center;

                .title {
                    font-size: 24px;
                    font-weight: bold;
                }

                .edit {
                    margin-left: 20px;
                    display: flex;
                    align-items: center;
                    font-size: 15px;
                    color: #003783;
                    cursor: pointer;
                }
            }
        }

        .item {
            display: flex;
            width: 100%;
            padding: 30px 0;
            box-sizing: border-box;
            border-bottom: 1px solid #EBECED;

            .title {
                width: 120px;
            }

            .edit {
                .btn {
                    margin-left: 20px;
                    display: flex;
                    color: #003783;
                    cursor: pointer;
                    font-size: 15px;
                }
            }
        }
    }

}

.back {
    display: flex;
    align-items: center;
    color: #8491A5;
    cursor: pointer;
    position: absolute;
    font-size: 15px;
    right: 0;
}
</style>