<template>
     <el-menu-item index="/admin/index">
          <el-icon>
               <HomeFilled />
          </el-icon>
          <span>首页</span>
     </el-menu-item>
     <el-sub-menu index="/adminUserManage">
          <template #title>
               <el-icon>
                    <Avatar />
               </el-icon>
               <span>用户管理</span>
          </template>
          <el-menu-item index="/adminUserManage/user">
               <el-icon>
                    <UserFilled />
               </el-icon>
               <span>用户信息</span>
          </el-menu-item>
     </el-sub-menu>
     <el-sub-menu index="/adminQuestionManage">
          <template #title>
               <el-icon>
                    <HelpFilled />
               </el-icon>
               <span>问题管理</span>
          </template>
          <el-menu-item index="/adminQuestionManage/question">
               <el-icon>
                    <QuestionFilled />
               </el-icon>
               <span>问题信息</span>
          </el-menu-item>
     </el-sub-menu>
      <el-sub-menu index="/adminArticleManage">
          <template #title>
               <el-icon>
                  <Tickets />
               </el-icon>
               <span>文章管理</span>
          </template>
          <el-menu-item index="/adminArticleManage/article">
               <el-icon><Notebook /></el-icon>
               <span>文章信息</span>
          </el-menu-item>
     </el-sub-menu>
     <el-sub-menu index="1">
          <template #title>
               <el-icon>
                    <WarnTriangleFilled />
               </el-icon>
               <span>举报管理</span>
          </template>
          <el-menu-item index="/adminReportManage/userReport">
               <el-icon>
                    <Avatar />
               </el-icon>
               <span>用户举报</span>
          </el-menu-item>
          <el-menu-item index="/adminReportManage/questionReport">
               <el-icon>
                    <QuestionFilled />
               </el-icon>
               <span>问题举报</span>
          </el-menu-item>
          <el-menu-item index="/adminReportManage/answerReport">
               <el-icon>
                    <Comment />
               </el-icon>
               <span>回答举报</span>
          </el-menu-item>
          <el-menu-item index="/adminReportManage/articleReport">
             <el-icon><Memo /></el-icon>
               <span>文章举报</span>
          </el-menu-item>
     </el-sub-menu>
     <el-menu-item index="/admin/noticeManage/notice">
          <el-icon>
               <BellFilled />
          </el-icon>
          <span>通知管理</span>
     </el-menu-item>
     <el-menu-item index="/admin/fileManage/file">
          <el-icon>
               <Document />
          </el-icon>
          <span>文件管理</span>
     </el-menu-item>
</template>

<script setup lang="ts">

</script>

<style scoped></style>