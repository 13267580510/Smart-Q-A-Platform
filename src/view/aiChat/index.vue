
<template>
  <div class="ai-chat-container" :class="{ 'dark-theme': isDarkTheme }">
    <div class="chat-layout">
      <!-- 左侧对话列表区 -->
      <div class="chat-sidebar" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <!-- 新建对话按钮 -->
        <div class="sidebar-top">
          <el-button class="new-chat-btn" @click="startNewChat" :loading="isCreatingChat">
            <el-icon v-if="!isSidebarCollapsed"><Plus /></el-icon>
            <el-icon v-else><ChatDotRound /></el-icon>
            <span v-if="!isSidebarCollapsed">新对话</span>
          </el-button>

          <el-button class="collapse-btn" circle @click="toggleSidebar" size="small">
            <el-icon>
              <component :is="isSidebarCollapsed ? 'ArrowRight' : 'ArrowLeft'" />
            </el-icon>
          </el-button>
        </div>

        <!-- 对话列表 -->
        <div class="chat-list">
          <div
            v-for="chat in chatList"
            :key="chat.id"
            :class="['chat-item', { active: activeChatId === chat.id, 'loading': loadingChats[chat.id] }]"
            @click="selectChat(chat.id)"
          >
            <el-icon class="chat-icon"><ChatLineRound /></el-icon>
            <span v-if="!isSidebarCollapsed" class="chat-title">{{ chat.title }}</span>
            <div v-if="!isSidebarCollapsed" class="chat-actions">
              <el-icon
                class="delete-btn"
                @click.stop="deleteChat(chat.id)"
              >
                <Delete />
              </el-icon>
            </div>
          </div>

          <!-- 加载更多提示 -->
          <div class="load-more" v-if="hasMoreSessions && !isLoadingSessions">
            <el-button link @click="loadMoreSessions">加载更多</el-button>
          </div>
          <div class="loading-sessions" v-if="isLoadingSessions">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <div class="empty-sessions" v-if="chatList.length === 0 && !isLoadingSessions && !isSidebarCollapsed">
            <span>暂无对话</span>
          </div>
        </div>

        <!-- 底部用户信息 -->
        <div v-if="!isSidebarCollapsed" class="sidebar-footer">
          <div class="user-info">
            <el-avatar :size="32" :src="userAvatar" />
            <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧对话内容区 -->
      <div class="chat-main">
        <!-- 顶部导航栏 -->
        <div class="chat-header">
          <div class="header-left">
            <el-icon class="mobile-menu-btn" @click="toggleSidebar" v-if="isMobile">
              <Menu />
            </el-icon>
            <span class="chat-title">{{ currentChatTitle }}</span>
          </div>
          <div class="header-actions">
            <el-tooltip content="切换主题" placement="bottom">
              <el-button circle @click="toggleTheme" size="small">
                <el-icon v-if="isDarkTheme"><Sunny /></el-icon>
                <el-icon v-else><Moon /></el-icon>
                
              </el-button>
            </el-tooltip>
            <el-tooltip content="分享对话" placement="bottom">
              <el-button circle @click="shareConversation" size="small">
                <el-icon><Share /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 消息容器 -->
        <div class="message-container" ref="messageContainer">
          <!-- 消息加载提示 -->
          <div class="loading-messages" v-if="loadingMessages">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载消息...</span>
          </div>

          <!-- 无消息提示 -->
          <div class="empty-messages" v-if="!loadingMessages && currentMessages.length === 0">
            <div class="empty-content">
              <el-icon class="empty-icon"><ChatLineSquare /></el-icon>
              <h2>我能帮你什么?</h2>
              <div class="suggestion-grid">
                <div class="suggestion-card" @click="sendQuickMessage('帮我写一个Vue组件的示例')">
                  <el-icon><EditPen /></el-icon>
                  <span>编写代码</span>
                </div>
                <div class="suggestion-card" @click="sendQuickMessage('解释一下什么是闭包')">
                  <el-icon><Reading /></el-icon>
                  <span>解释概念</span>
                </div>
                <div class="suggestion-card" @click="sendQuickMessage('如何优化前端性能')">
                  <el-icon><Lightning /></el-icon>
                  <span>优化建议</span>
                </div>
                <div class="suggestion-card" @click="sendQuickMessage('帮我分析这段代码的问题')">
                  <el-icon><DocumentCopy /></el-icon>
                  <span>代码审查</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <div
            v-for="message in currentMessages"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-avatar">
              <el-avatar
                :size="32"
                :src="message.role === 'user' ? userAvatar : aiAvatar"
              />
            </div>
            <div class="message-main">
              <div class="message-header">
                <span class="message-role">{{ message.role === 'user' ? '你' : '小智' }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div
                class="message-content"
                :class="{ 'markdown-content': message.role === 'assistant' }"
              >
                <div v-if="message.role === 'assistant'" v-html="renderMarkdown(message.content)"></div>
                <template v-else>{{ message.content }}</template>
              </div>

              <!-- 消息操作按钮 -->
              <div class="message-actions" v-if="message.role === 'assistant'">
                <el-tooltip content="复制" placement="top">
                  <el-button size="small" @click="copyMessage(message)" class="action-btn">
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="不满意" placement="top">
                  <el-button size="small" @click="goToAskPage(message)" class="action-btn">
                    <el-icon><Promotion /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 发送中提示 -->
          <div class="sending-message" v-if="isSending">
            <div class="message assistant">
              <div class="message-avatar">
                <el-avatar :size="32" :src="aiAvatar" />
              </div>
              <div class="message-main">
                <div class="message-header">
                  <span class="message-role">小智</span>
                </div>
                <div class="message-content loading-content">
                  <div class="typing-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-wrapper">
            <el-button class="attach-btn" circle size="small" @click="handleFileUpload" :disabled="isSending">
              <el-icon><Paperclip /></el-icon>
            </el-button>
            <el-input
              v-model="inputMessage"
              placeholder="发送消息给小智..."
              :rows="1"
              type="textarea"
              resize="none"
              @keydown.enter.prevent="handleEnterKey"
              class="message-input"
              :disabled="isSending"
              :autosize="{ minRows: 1, maxRows: 6 }"
            />
            <el-button
              type="primary"
              class="send-btn"
              :loading="isSending"
              @click="sendMessage"
              circle
              :disabled="!inputMessage.trim() || isSending"
              size="small"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>

          <!-- 文件选择状态显示 -->
          <div class="file-status" v-if="selectedFile">
            <el-tag closable @close="clearSelectedFile" type="info">
              <el-icon><Document /></el-icon>
              {{ selectedFile.name }}
            </el-tag>
          </div>

          <div class="input-hint">
            <span>按 Enter 发送，Shift + Enter 换行</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, ChatLineRound, Close, Promotion, DocumentCopy,
  Refresh, Star, Share, Search, Sunny, Moon, Edit,
  Loading, ChatLineSquare, Position, Picture, Upload,
  ArrowLeft, ArrowRight, Delete, Menu, EditPen, Reading,
  Lightning, CopyDocument, Paperclip, ChatDotRound
} from '@element-plus/icons-vue'
import { sseChat, sseChatWithAttachment } from '../../api/ai'
import { 
  getUserSessions, 
  createNewSession, 
  deleteSession, 
  updateSessionTitle,
  getSessionMessages 
} from '../../api/ai/index'
import { ReqUploadAnswerImg } from '../../api/answer'
import useUserStore from '../../store/modules/user'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import { useRouter } from 'vue-router' // 引入路由
import defaultAvatar from '../../assets/icons/default_avat.svg'
import aiAvatar from '../../assets/icons/ai_avat.svg'
import { de } from 'element-plus/es/locale'
const router = useRouter()

// 类型定义
interface Chat {
  id: number | string
  title: string
  createTime: number
  sessionId?: string
}

interface Message {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sessionId: string
}
const UserStore = useUserStore()
// 静态资源路径
// const userAvatar =UserStore.userInfo?.avatarPath ? 'http://127.0.0.1:8080' + UserStore.userInfo.avatarPath : defaultAvatar
const userAvatar = defaultAvatar

// 响应式数据
const isDarkTheme = ref(false)
const isHoveredChat = ref<number | string | null>(null)
const thinkingMode = ref('normal')
const userStore = useUserStore()
const isSidebarCollapsed = ref(false)
const isMobile = ref(false)

// 会话相关
const chatList = ref<Chat[]>([])
const messagesMap = ref<Record<string | number, Message[]>>({})
const activeChatId = ref<number | string>('')
const inputMessage = ref('')
const isSending = ref(false)
const isCreatingChat = ref(false)
const messageContainer = ref<HTMLElement | null>(null)
const currentCancelStream = ref<(() => void) | null>(null)
const isUploadingImage = ref(false)
const selectedFile = ref<File | null>(null)

// 加载状态
const loadingMessages = ref(false)
const loadingChats = ref<Record<string | number, boolean>>({})
const isLoadingSessions = ref(false)
const hasMoreSessions = ref(true)
const currentPage = ref(1)
const pageSize = 20

// Markdown解析器实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch (__) {}
    }
    return hljs.highlightAuto(str).value
  }
})

const currentMessages = computed(() => {
  const chatId = activeChatId.value
  if (!chatId) {
    return []
  }
  
  return messagesMap.value[chatId] || []
})

const currentChatTitle = computed(() => {
  const chat = chatList.value.find(chat => chat.id === activeChatId.value)
  return chat ? chat.title : '新对话'
})

// 主题切换
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

// 侧边栏切换
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

// 处理回车键发送
const handleEnterKey = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    // Shift + Enter 换行，不做处理
    return
  }
  // Enter 发送消息
  sendMessage()
}

// 思考模式设置
const setThinkingMode = (mode: string) => {
  thinkingMode.value = mode
  ElMessage.success(`已切换到${mode === 'deep' ? '深度思考' : '联网搜索'}模式`)
}

// 消息操作函数
const copyMessage = async (message: Message) => {
  try {
    await navigator.clipboard.writeText(message.content)
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

const regenerateMessage = (message: Message) => {
  ElMessage.info('重新生成消息功能待实现')
}

const likeMessage = (message: Message) => {
  ElMessage.success('已点赞')
}

const dislikeMessage = (message: Message) => {
  ElMessage.info('已点踩')
}

const shareMessage = (message: Message) => {
  ElMessage.info('分享功能待实现')
}

const shareConversation = () => {
  ElMessage.info('分享对话功能待实现')
}

// 更新文件选择状态
const updateFileStatus = () => {
  // 可以在这里添加文件状态更新的逻辑
}

// 处理文件上传
const handleFileUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.bmp,.gif,.tiff'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    // 检查文件类型
    const allowedExtensions = ['txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      ElMessage.error('请选择支持的文件格式：txt, md, pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, jpg, jpeg, png, bmp, gif, tiff')
      return
    }
    
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return
    }
    
    isSending.value = true
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // TODO: 调用文件上传API
      // const response = await ReqUploadFile(formData)
      
      // if (response && response.data) {
      //   const fileUrl = response.data
      //   const fileName = file.name
      //   const fileMarkdown = `[${fileName}](${fileUrl})`
      //   
      //   // 如果当前有输入内容，则在内容后添加文件链接
      //   if (inputMessage.value.trim()) {
      //     inputMessage.value += '\n' + fileMarkdown
      //   } else {
      //     inputMessage.value = fileMarkdown
      //   }
      //   
      //   ElMessage.success('文件上传成功')
      // } else {
      //   ElMessage.error('文件上传失败')
      // }
      
      // 设置选中的文件
      selectedFile.value = file
      updateFileStatus()
      ElMessage.success('文件已选择：' + file.name)
    } catch (error: any) {
      console.error('文件上传失败:', error)
      ElMessage.error('文件上传失败: ' + (error.message || '未知错误'))
    } finally {
      isSending.value = false
    }
  }
  
  input.click()
}


// 处理图片上传
const handleImageUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }
    
    isUploadingImage.value = true
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await ReqUploadAnswerImg(formData)
      
      if (response && response.data) {
        // 在消息中插入图片链接
        const imageUrl = response.data
        const imageMarkdown = `![图片](${imageUrl})`
        
        // 如果当前有输入内容，则在内容后添加图片
        if (inputMessage.value.trim()) {
          inputMessage.value += '\n' + imageMarkdown
        } else {
          inputMessage.value = imageMarkdown
        }
        
        ElMessage.success('图片上传成功')
      } else {
        ElMessage.error('图片上传失败')
      }
    } catch (error: any) {
      console.error('图片上传失败:', error)
      ElMessage.error('图片上传失败: ' + (error.message || '未知错误'))
    } finally {
      isUploadingImage.value = false
    }
  }
  
  input.click()
}

// 清除选中的文件
const clearSelectedFile = () => {
  selectedFile.value = null
  updateFileStatus()
  ElMessage.info('已清除文件选择')
}

const editChatTitle = async () => {
  const chat = chatList.value.find(chat => chat.id === activeChatId.value)
  if (!chat) return

  try {
    const { value: newTitle } = await ElMessageBox.prompt(
      '请输入新的对话标题',
      '修改标题',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: chat.title,
        inputPattern: /^.{1,50}$/,
        inputErrorMessage: '标题长度应在1-50个字符之间'
      }
    )
    
    if (newTitle && newTitle !== chat.title) {
      await updateChatTitle(activeChatId.value, newTitle)
    }
  } catch {
    // 用户取消
  }
}

// 加载用户历史会话
const loadUserSessions = async (page = 1, append = false) => {
  if (!userStore.token || isLoadingSessions.value) return
  
  isLoadingSessions.value = true
  
  try {
    const response = await getUserSessions()
    if (response.sessions && response.sessions.length > 0) {
      const sessions: Chat[] = response.sessions.map(session => ({
        id: session.sessionId,
        title: session.title || '未命名对话',
        createTime: new Date(session.createdAt).getTime(),
        sessionId: session.sessionId
      }))
      
      sessions.sort((a, b) => b.createTime - a.createTime)
      
      if (append) {
        chatList.value.push(...sessions)
      } else {
        chatList.value = sessions
      }
      
      // 检查是否有更多数据
      hasMoreSessions.value = response.sessions.length >= pageSize
      
      if (!append && sessions.length > 0 && !activeChatId.value) {
        // 自动选择最新的会话
        activeChatId.value = sessions[0].id
        // 加载该会话的消息
        await loadSessionMessages(sessions[0].id, sessions[0].sessionId)
      }
      
      if (!append) {
        ElMessage.success(`已加载${response.sessions.length}个历史会话`)
      }
    } else {
      if (!append) {
        chatList.value = []
        hasMoreSessions.value = false
      }
    }
  } catch (error: any) {
    console.error('加载会话失败:', error)
    
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.exitLogin()
    } else if (error.message?.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      if (!append) {
        ElMessage.error(`加载会话失败: ${error.message || '未知错误'}`)
      }
    }
  } finally {
    isLoadingSessions.value = false
  }
}

// 加载更多会话
const loadMoreSessions = async () => {
  if (!hasMoreSessions.value || isLoadingSessions.value) return
  
  currentPage.value += 1
  await loadUserSessions(currentPage.value, true)
}

// 加载会话历史消息
const loadSessionMessages = async (chatId: number | string, sessionId?: string) => {
  if (!sessionId || !userStore.token) {
    messagesMap.value = {
      ...messagesMap.value,
      [chatId]: []
    }
    return
  }
  
  if (messagesMap.value[chatId] && messagesMap.value[chatId].length > 0) {
    return // 已经加载过了
  }
  
  loadingMessages.value = true
  loadingChats.value[chatId] = true
  
  try {
    const response = await getSessionMessages(sessionId)
    console.log("response:", response)
    
    if (response.messages && response.messages.length > 0) {
      const messages: Message[] = response.messages.map((msg: SessionMessage, index: number) => ({
        id: msg.id || `${sessionId}_${index}`,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime() || Date.now() - (response.messages.length - index) * 60000
      }))
      
      // 更新 messagesMap
      messagesMap.value = {
        ...messagesMap.value,
        [chatId]: messages
      }
      
      nextTick(() => {
        scrollToBottom()
        setupCopyButtons()
      })
    } else {
      messagesMap.value = {
        ...messagesMap.value,
        [chatId]: []
      }
    }
  } catch (error: any) {
    console.error('加载消息失败:', error)
    messagesMap.value = {
      ...messagesMap.value,
      [chatId]: []
    }
    
    if (error.response?.status !== 404) {
      ElMessage.error(`加载消息失败: ${error.message || '未知错误'}`)
    }
  } finally {
    loadingMessages.value = false
    delete loadingChats.value[chatId]
  }
}

// 选择对话
const selectChat = async (chatId: number | string) => {
  if (activeChatId.value === chatId || loadingChats.value[chatId]) return
  
  currentCancelStream.value?.()
  currentCancelStream.value = null
  
  activeChatId.value = chatId
  
  const chat = chatList.value.find(c => c.id === chatId)
  if (chat && chat.sessionId && (!messagesMap.value[chatId] || messagesMap.value[chatId].length === 0)) {
    await loadSessionMessages(chatId, chat.sessionId)
  } else {
    nextTick(() => {
      scrollToBottom()
      setupCopyButtons()
    })
  }
}

const startNewChat = async () => {
  console.log("开始创建新对话")
  
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    userStore.goToLogin()
    return
  }
  
  if (isCreatingChat.value) return
  
  isCreatingChat.value = true
  
  try {
    currentCancelStream.value?.()
    currentCancelStream.value = null
    
    const response = await createNewSession()
    console.log('API响应状态:', response)
    
    if (!response || !response.sessionId) {
      throw new Error('API响应无效或缺少sessionId')
    }
    
    console.log('创建会话响应:', response)
    
    const newChat: Chat = {
      id: response.sessionId,
      title: '新对话',
      createTime: Date.now(),
      sessionId: response.sessionId
    }
    
    // 添加到列表顶部
    chatList.value.unshift(newChat)
    
    // 初始化空消息数组
    messagesMap.value = {
      ...messagesMap.value,
      [response.sessionId]: []
    }
    
    activeChatId.value = response.sessionId
    
    nextTick(() => {
      scrollToBottom()
      ElMessage.success('已创建新对话')
    })
  } catch (error: any) {
    console.error('创建会话失败:', error)
    const newChatId = `temp_${Date.now()}`
    const newChat: Chat = {
      id: newChatId,
      title: '新对话',
      createTime: Date.now()
    }
    
    chatList.value.unshift(newChat)
    messagesMap.value = {
      ...messagesMap.value,
      [newChatId]: []
    }
    activeChatId.value = newChatId
    
    ElMessage.warning('创建会话失败，使用临时会话')
    nextTick(() => scrollToBottom())
  } finally {
    isCreatingChat.value = false
  }
}

// 删除对话
const deleteChat = async (chatId: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？删除后无法恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    if (activeChatId.value === chatId) {
      currentCancelStream.value?.()
      currentCancelStream.value = null
    }
    
    const chatToDelete = chatList.value.find(chat => chat.id === chatId)
    const index = chatList.value.findIndex(chat => chat.id === chatId)
    
    if (index !== -1) {
      // 删除本地数据
      chatList.value.splice(index, 1)
      
      // 删除 messagesMap 中的数据
      const newMessagesMap = { ...messagesMap.value }
      delete newMessagesMap[chatId]
      messagesMap.value = newMessagesMap
      
      // 如果删除的是当前激活的对话，切换到第一个对话
      if (activeChatId.value === chatId) {
        activeChatId.value = chatList.value[0]?.id || ''
        if (activeChatId.value) {
          const newActiveChat = chatList.value.find(c => c.id === activeChatId.value)
          if (newActiveChat?.sessionId) {
            await loadSessionMessages(activeChatId.value, newActiveChat.sessionId)
          }
        }
      }
      
      // 如果对话有sessionId，调用API删除
      if (chatToDelete?.sessionId) {
        try {
          await deleteSession(chatToDelete.sessionId)
        } catch (apiError) {
          console.error('API删除失败:', apiError)
        }
      }
      
      ElMessage.success('对话已删除')
    }
  } catch {
    // 用户取消删除
  }
}

// 更新对话标题
const updateChatTitle = async (chatId: number | string, newTitle: string) => {
  const chat = chatList.value.find(chat => chat.id === chatId)
  if (!chat) return
  
  if (!newTitle.trim()) {
    newTitle = '未命名对话'
  }
  
  const oldTitle = chat.title
  chat.title = newTitle
  
  // 如果对话有sessionId，调用API更新
  if (chat.sessionId) {
    try {
      await updateSessionTitle(chat.sessionId, newTitle)
      ElMessage.success('标题已更新')
    } catch (apiError) {
      console.error('API更新标题失败:', apiError)
      // 恢复原标题
      chat.title = oldTitle
      ElMessage.error('标题更新失败')
    }
  }
}

// 快速发送消息
const sendQuickMessage = (message: string) => {
  if (!activeChatId.value) {
    startNewChat().then(() => {
      setTimeout(() => {
        inputMessage.value = message
        sendMessage()
      }, 100)
    })
  } else {
    inputMessage.value = message
    sendMessage()
  }
}

// 发送消息
// 发送消息
// 发送消息
const sendMessage = async () => {
  console.log("1. 开始发送消息，当前activeChatId:", activeChatId.value)
  
  const messageContent = inputMessage.value.trim()
  if (!messageContent || isSending.value) return
  
  if (!activeChatId.value) {
    console.log("2. 没有activeChatId，创建新对话")
    await startNewChat()
    await nextTick()
  }
  
  if (!activeChatId.value) {
    console.log("3. 创建新对话失败，没有activeChatId")
    return
  }
  
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    userStore.goToLogin()
    return
  }
  
  console.log("4. 准备发送消息，内容:", messageContent)
  currentCancelStream.value?.()
  currentCancelStream.value = null
  
  isSending.value = true
  
  const userMessage: Message = {
    id: `user_${Date.now()}`,
    role: 'user',
    content: messageContent,
    timestamp: Date.now()
  }
  
  const chatId = activeChatId.value
  
  // 确保 chatId 在 messagesMap 中存在
  if (!messagesMap.value[chatId]) {
    messagesMap.value = {
      ...messagesMap.value,
      [chatId]: []
    }
  }
  
  // 添加用户消息
  messagesMap.value = {
    ...messagesMap.value,
    [chatId]: [...messagesMap.value[chatId], userMessage]
  }
  
  inputMessage.value = ''
  
  const aiMessageId = `ai_${Date.now()}`
  const aiMessage: Message = {
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  
  // 添加AI消息（初始为空）
  messagesMap.value = {
    ...messagesMap.value,
    [chatId]: [...messagesMap.value[chatId], aiMessage]
  }
  
  console.log("5. 用户消息已添加，等待AI响应")
  scrollToBottom()
  
  try {
    console.log("6. 开始调用 AI API")
    
    let cancelStream: (() => void) | null = null
    
    // 检查是否有选中的文件
    if (selectedFile.value) {
      console.log("6.1 使用带附件的API，文件:", selectedFile.value.name)
      // 调用带附件的流式聊天接口
      cancelStream = await sseChatWithAttachment(
        String(chatId),
        messageContent,
        selectedFile.value,
        (chunk) => {
          // 清空选中的文件
          selectedFile.value = null
          updateFileStatus()
          console.log("7. 收到流数据chunk:", chunk)
          console.log("   chunk长度:", chunk.length)
          console.log("   chunk类型:", typeof chunk)
          
          // 获取当前消息列表
          const currentMessages = messagesMap.value[chatId] || []
          const aiMessageIndex = currentMessages.findIndex(msg => msg.id === aiMessageId)
          
          console.log("   AI消息索引:", aiMessageIndex)
          console.log("  当前消息数:", currentMessages.length)
          
          if (aiMessageIndex !== -1) {
            // 创建新的消息列表
            const updatedMessages = [...currentMessages]
            const oldContent = updatedMessages[aiMessageIndex].content
            updatedMessages[aiMessageIndex] = {
              ...updatedMessages[aiMessageIndex],
              content: oldContent + chunk
            }
            
            console.log("   更新前内容长度:", oldContent.length)
            console.log("   更新后内容长度:", updatedMessages[aiMessageIndex].content.length)
            
            // 更新 messagesMap
            messagesMap.value = {
              ...messagesMap.value,
              [chatId]: updatedMessages
            }
            
            console.log("8. messagesMap 已更新")
            scrollToBottom()
          } else {
            console.error("  错误：未找到AI消息，ID:", aiMessageId)
          }
        },
        (error) => {
          console.error("9. SSE连接错误:", error)
          console.error("   错误详情:", error.message)
          console.error("   错误堆栈:", error.stack)
          ElMessage.error('AI服务连接错误：' + error.message)
          isSending.value = false
          
          // 移除空的AI消息
          const currentMessages = messagesMap.value[chatId] || []
          const aiMessageIndex = currentMessages.findIndex(
            msg => msg.id === aiMessageId && msg.content === ''
          )
          if (aiMessageIndex !== -1) {
            const updatedMessages = currentMessages.filter((_, index) => index !== aiMessageIndex)
            messagesMap.value = {
              ...messagesMap.value,
              [chatId]: updatedMessages
            }
          }
        },
        () => {
          console.log("10. SSE连接完成")
          isSending.value = false
          currentCancelStream.value = null
          
          // 更新对话标题（如果是新对话的第一条消息）
          const currentChat = chatList.value.find(chat => chat.id === chatId)
          if (currentChat && currentChat.title === '新对话') {
            const newTitle = messageContent.slice(0, 20) + (messageContent.length > 20 ? '...' : '')
            updateChatTitle(chatId, newTitle)
          }
          
          nextTick(() => setupCopyButtons())
        }
      )
    } else {
      console.log("6.2 使用普通API")
      // 调用普通流式聊天接口
      cancelStream = await sseChat(
        String(chatId),
        messageContent,
        (chunk) => {
          console.log("7. 收到流数据chunk:", chunk)
          console.log("   chunk长度:", chunk.length)
          console.log("   chunk类型:", typeof chunk)
          
          // 获取当前消息列表
          const currentMessages = messagesMap.value[chatId] || []
          const aiMessageIndex = currentMessages.findIndex(msg => msg.id === aiMessageId)
          
          if (aiMessageIndex !== -1) {
            // 创建新的消息列表
            const updatedMessages = [...currentMessages]
            const oldContent = updatedMessages[aiMessageIndex].content
            updatedMessages[aiMessageIndex] = {
              ...updatedMessages[aiMessageIndex],
              content: oldContent + chunk
            }
            
            // 更新 messagesMap
            messagesMap.value = {
              ...messagesMap.value,
              [chatId]: updatedMessages
            }
            
            scrollToBottom()
          } else {
            console.error("  错误：未找到AI消息，ID:", aiMessageId)
          }
        },
        (error) => {
          console.error("9. SSE连接错误:", error)
          ElMessage.error('AI服务连接错误：' + error.message)
          isSending.value = false
          
          // 移除空的AI消息
          const currentMessages = messagesMap.value[chatId] || []
          const aiMessageIndex = currentMessages.findIndex(
            msg => msg.id === aiMessageId && msg.content === ''
          )
          if (aiMessageIndex !== -1) {
            const updatedMessages = currentMessages.filter((_, index) => index !== aiMessageIndex)
            messagesMap.value = {
              ...messagesMap.value,
              [chatId]: updatedMessages
            }
          }
        },
        () => {
          console.log("10. SSE连接完成")
          isSending.value = false
          currentCancelStream.value = null
          
          // 更新对话标题（如果是新对话的第一条消息）
          const currentChat = chatList.value.find(chat => chat.id === chatId)
          if (currentChat && currentChat.title === '新对话') {
            const newTitle = messageContent.slice(0, 20) + (messageContent.length > 20 ? '...' : '')
            updateChatTitle(chatId, newTitle)
          }
          
          nextTick(() => setupCopyButtons())
        }
      )
    }
    
    console.log("11. sseChat 调用成功，返回取消函数")
    currentCancelStream.value = cancelStream
    
  } catch (error: any) {
    console.error("12. 发送消息失败：", error)
    console.error("   错误类型:", typeof error)
    console.error("   错误消息:", error.message)
    console.error("   错误响应:", error.response)
    console.error("   错误状态:", error.status)
    
    ElMessage.error('发送消息失败：' + (error.message || '未知错误'))
    isSending.value = false
    
    // 移除空的AI消息
    const currentMessages = messagesMap.value[chatId] || []
    const aiMessageIndex = currentMessages.findIndex(
      msg => msg.id === aiMessageId && msg.content === ''
    )
    if (aiMessageIndex !== -1) {
      const updatedMessages = currentMessages.filter((_, index) => index !== aiMessageIndex)
      messagesMap.value = {
        ...messagesMap.value,
        [chatId]: updatedMessages
      }
    }
  }
}

// 滚动到消息底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 渲染Markdown内容
const renderMarkdown = (content: string) => {
  const rendered = md.render(content)
  return rendered.replace(/<pre><code class="([^"]*language-([^"]*))"[^>]*>([\s\S]*?)<\/code><\/pre>/g, 
    (_, langClass, langName, codeContent) => {
      const displayLang = langName || '代码'
      return `<div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-language">${displayLang}</span>
          <button class="copy-btn">
            <span class="copy-icon">📋</span>
            <span class="copy-text">复制</span>
            <span class="copied-text">已复制</span>
          </button>
        </div>
        <pre><code class="${langClass}">${codeContent}</code></pre>
      </div>`
    }
  )
}

// 处理代码块的复制功能
const setupCopyButtons = () => {
  nextTick(() => {
    const copyButtons = document.querySelectorAll('.copy-btn')
    copyButtons.forEach(button => {
      button.removeEventListener('click', handleCopy)
      button.addEventListener('click', handleCopy)
    })
  })
}

// 复制按钮点击事件
const handleCopy = async function(this: HTMLButtonElement) {
  const codeBlock = this.closest('.code-block-wrapper')?.querySelector('code')
  if (!codeBlock) return
  
  const codeText = codeBlock.textContent?.trim()
  if (!codeText) return
  
  try {
    await navigator.clipboard.writeText(codeText)
    this.classList.add('copied')
    setTimeout(() => this.classList.remove('copied'), 2000)
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = codeText
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    
    this.classList.add('copied')
    setTimeout(() => this.classList.remove('copied'), 2000)
  }
}


// 新增：跳转到提问页面
const goToAskPage = (message: Message) => {
  // 可以在这里传递当前不满意的消息ID或内容作为参数
  router.push({
    path: '/ask',
    query: {
      unsatisfiedMessageId: message.id,
      sessionId: activeChatId.value,
      content: encodeURIComponent(message.content) // 编码消息内容
    }
  })
}

// 组件挂载时初始化
onMounted(async () => {
  // 检查用户是否登录
  if (userStore.token) {
    // 加载用户历史会话
    await loadUserSessions()
  } else {
    // 未登录状态，显示提示
    chatList.value = []
  }

  // 检测移动端
  checkMobile()
  window.addEventListener('resize', checkMobile)

  scrollToBottom()
  nextTick(() => setupCopyButtons())
})

// 监听登录状态变化
watch(() => userStore.token, (newToken) => {
  if (newToken) {
    // 用户登录了，加载历史会话
    loadUserSessions()
  } else {
    // 用户退出登录，清空数据
    chatList.value = []
    messagesMap.value = {}
    activeChatId.value = ''
  }
})

// 组件卸载时清理
onUnmounted(() => {
  currentCancelStream.value?.()
  const copyButtons = document.querySelectorAll('.copy-btn')
  copyButtons.forEach(button => {
    button.removeEventListener('click', handleCopy)
  })
  window.removeEventListener('resize', checkMobile)
})
</script>
<style scoped lang="scss">
.ai-chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  
  &.dark-theme {
    background-color: #1a1a1a;
    
    .chat-sidebar,
    .chat-main,
    .conversation-header,
    .input-area {
      background-color: #2d2d2d;
      border-color: #404040;
    }
    
    .chat-item {
      color: #e0e0e0;
      
      &:hover {
        background-color: #3d3d3d;
      }
      
      &.active {
        background-color: #404040;
        color: #409eff;
      }
    }
    
    .message-bubble {
      background-color: #3d3d3d;
      color: #e0e0e0;
    }
    
    .user .message-bubble {
      background-color: #409eff;
      color: white;
    }
  }
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 60px);
}

.chat-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &.sidebar-collapsed {
    width: 64px;
    
    .sidebar-top,
    .sidebar-footer {
      padding: 12px;
    }
    
    .new-chat-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      border-radius: 50%;
    }
    
    .collapse-btn {
      position: absolute;
      right: 8px;
      top: 60px;
    }
    
    .chat-list {
      padding: 8px;
    }
    
    .chat-item {
      justify-content: center;
      padding: 12px 8px;
      
      .chat-icon {
        margin: 0;
      }
      
      .chat-title {
        display: none;
      }
      
      .chat-actions {
        display: none;
      }
    }
  }
}

.sidebar-top {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  
  .new-chat-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .collapse-btn {
    flex-shrink: 0;
    border: 1px solid #e4e7ed;
    background: white;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f5f7fa;
      border-color: #409eff;
      color: #409eff;
    }
  }
}

.chat-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  
  .load-more,
  .loading-sessions {
    text-align: center;
    padding: 12px;
    color: #909399;
  }
  
  .loading-sessions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .empty-sessions {
    padding: 40px 0;
  }
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
    transition: height 0.3s ease;
  }
  
  &:hover {
    background: #f5f7fa;
    transform: translateX(2px);
    
    .chat-actions .delete-btn {
      opacity: 1;
    }
    
    &::before {
      height: 20px;
    }
  }
  
  &.active {
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    color: #667eea;
    
    &::before {
      height: 30px;
    }
    
    .chat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  }
  
  &.loading {
    opacity: 0.7;
    cursor: wait;
  }
  
  .chat-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #f5f7fa;
    color: #909399;
    font-size: 16px;
    margin-right: 10px;
    transition: all 0.3s ease;
  }
  
  .chat-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #303133;
    transition: color 0.3s ease;
  }
  
  .chat-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .delete-btn {
      opacity: 0;
      color: #909399;
      font-size: 14px;
      padding: 6px;
      border-radius: 6px;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, #f56c6c 0%, #e45454 100%);
        color: #fff;
        transform: scale(1.1);
      }
    }
    
    .loading-icon {
      animation: rotate 1s linear infinite;
      color: #409eff;
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
  transition: all 0.3s ease;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .mobile-menu-btn {
      display: none;
      font-size: 20px;
      color: #606266;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f5f7fa;
        color: #409eff;
      }
    }
    
    .chat-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-button {
      border: 1px solid #e4e7ed;
      background: white;
      color: #606266;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #409eff;
        color: #409eff;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
      }
    }
  }
}

.message-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  position: relative;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
    
    &:hover {
      background: #c0c4cc;
    }
  }
  
  .loading-messages,
  .empty-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: #909399;
  }
  
  .loading-messages {
    gap: 12px;
    
    .loading-icon {
      font-size: 24px;
      animation: rotate 1s linear infinite;
    }
  }
  
  .empty-messages {
    .empty-content {
      text-align: center;
      max-width: 500px;
      padding: 40px 20px;
      
      .empty-icon {
        font-size: 64px;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: float 3s ease-in-out infinite;
      }
      
      h2 {
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
      
      p {
        margin: 0 0 32px 0;
        color: #909399;
        font-size: 14px;
      }
      
      .suggestion-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        width: 100%;
        
        .suggestion-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: white;
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          
          &:hover {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
          }
          
          .el-icon {
            font-size: 20px;
            color: #667eea;
            flex-shrink: 0;
          }
          
          span {
            font-size: 14px;
            font-weight: 500;
            color: #303133;
          }
        }
      }
    }
  }
  
  .sending-message {
    .loading-bubble {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .typing-icon {
        animation: rotate 1s linear infinite;
      }
      
      .typing-text {
        opacity: 0.8;
      }
    }
  }
  
  .message {
    display: flex;
    margin-bottom: 24px;
    animation: fadeInUp 0.3s ease;
    
    &.user {
      flex-direction: row-reverse;
      
      .message-main {
        align-items: flex-end;
      }
      
      .message-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 18px 4px 18px 18px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        border: none;
        
        &:hover {
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          transform: translateY(-1px);
        }
      }
      
      .message-header {
        flex-direction: row-reverse;
        
        .message-role {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }
    
    &.assistant {
      .message-main {
        align-items: flex-start;
      }
      
      .message-content {
        background: #f5f7fa;
        color: #303133;
        border: 1px solid #e4e7ed;
        border-radius: 4px 18px 18px 18px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        
        &.markdown-content {
          :deep(*) {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          
          :deep(code) {
            background: rgba(0, 0, 0, 0.05);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
          }
          
          :deep(pre) {
            margin: 1em 0;
            border-radius: 8px;
            overflow: hidden;
          }
          
          :deep(blockquote) {
            border-left: 4px solid #667eea;
            background: rgba(102, 126, 234, 0.05);
            padding: 0.5em 1em;
            margin: 1em 0;
            border-radius: 0 8px 8px 0;
          }
          
          :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
            margin-top: 1.2em;
            margin-bottom: 0.6em;
            font-weight: 600;
          }
          
          :deep(a) {
            color: #667eea;
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
          
          :deep(ul), :deep(ol) {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }
          
          :deep(table) {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
            
            th, td {
              border: 1px solid #e4e7ed;
              padding: 0.5em 0.8em;
              text-align: left;
            }
            
            th {
              background: #f8f9fa;
              font-weight: 600;
            }
          }
        }
      }
      
      .message-header .message-role {
        color: #667eea;
        font-weight: 600;
      }
    }
  }
  
  .message-avatar {
    flex-shrink: 0;
    margin-top: 4px;
  }
  
  .message-main {
    display: flex;
    flex-direction: column;
    max-width: 60%;
    transition: all 0.3s ease;
  }
  
  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    
    .message-role {
      font-size: 12px;
      font-weight: 500;
      color: #606266;
    }
    
    .message-time {
      font-size: 11px;
      color: #909399;
      opacity: 0.8;
    }
  }
  
  .message-content {
    padding: 12px 16px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover::before {
      opacity: 1;
    }
  }
  
  .message-actions {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.3s ease;
        
     /*  hover 父元素 → 显示子元素按钮 */
  &:hover .message-actions {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 子元素：操作按钮组 */
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0; /* 默认隐藏 */
  transform: translateY(4px);
  transition: all 0.3s ease;

    
    .el-button {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      padding: 6px 10px;
      height: auto;
      min-height: auto;
      color: #606266;
      
      .el-icon {
        color: inherit;
        font-size: 16px;
      }
      
      &:hover {
        background: white;
        border-color: #667eea;
        color: #667eea;
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
        
        .el-icon {
          color: inherit;
        }
      }
    }
  }
}

.input-area {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  position: relative;
  
  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex: 1;
    max-width: 100%;
    background: #f5f7fa;
    border-radius: 24px;
    padding: 8px 16px;
    border: 1px solid #e4e7ed;
    transition: all 0.3s ease;
    
    &:focus-within {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .attach-btn {
      flex-shrink: 0;
      color: #909399;
      border: none;
      background: transparent;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
      }
    }
    
    .message-input {
      flex: 1;
      border: none;
      background: transparent;
      
      :deep(.el-textarea__inner) {
        border: none;
        background: transparent;
        box-shadow: none;
        padding: 8px 0;
        resize: none;
        font-size: 14px;
        line-height: 1.6;
        color: #303133;
        
        &::placeholder {
          color: #c0c4cc;
        }
        
        &:focus {
          outline: none;
        }
      }
    }
    
    .send-btn {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      transform: scale(1);
      
      &:hover:not(:disabled) {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      &:active:not(:disabled) {
        transform: scale(0.95);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
  
  .file-status {
    position: absolute;
    bottom: 80px;
    left: 24px;
    right: 24px;
    z-index: 10;
    
    .el-tag {
      background: rgba(102, 126, 234, 0.1);
      border-color: #667eea;
      color: #667eea;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
  
  .input-hint {
    text-align: center;
    font-size: 12px;
    color: #c0c4cc;
    margin-top: 8px;
  }
}

/* 深色主题适配 */
.dark-theme {
  .chat-sidebar,
  .chat-header,
  .input-area {
    background-color: #1e1e1e;
    border-color: #3d3d3d;
  }
  
  .chat-header {
    background: rgba(30, 30, 30, 0.9);
    
    .header-left {
      .chat-title {
        color: #e0e0e0;
      }
      
      .mobile-menu-btn:hover {
        background: #3d3d3d;
        color: #667eea;
      }
    }
    
    .header-actions .el-button {
      background: #2d2d2d;
      border-color: #404040;
      color: #e0e0e0;
      
      &:hover {
        border-color: #667eea;
        color: #667eea;
      }
    }
  }
  
  .message-container {
    .assistant .message-content {
      background-color: #2d2d2d;
      border-color: #404040;
      color: #e0e0e0;
      
      &.markdown-content {
        :deep(code) {
          background: rgba(255, 255, 255, 0.1);
        }
        
        :deep(blockquote) {
          background: rgba(102, 126, 234, 0.1);
          color: #a0a0a0;
        }
        
        :deep(h1),
        :deep(h2),
        :deep(h3) {
          color: #e0e0e0;
        }
        
        :deep(a) {
          color: #667eea;
        }
        
        :deep(th) {
          background: #3d3d3d;
          border-color: #404040;
        }
        
        :deep(td) {
          border-color: #404040;
        }
      }
    }
    
    .message-header .message-role {
      color: #e0e0e0;
    }
    
    .message-time {
      color: #a0a0a0;
    }
    
    .message-actions .el-button {
      background: rgba(45, 45, 45, 0.9);
      border: 1px solid #404040;
      border-radius: 6px;
      padding: 6px 10px;
      height: auto;
      min-height: auto;
      color: #a0a0a0;
      
      .el-icon {
        color: inherit;
        font-size: 16px;
      }
      
      &:hover {
        background: rgba(102, 126, 234, 0.15);
        border-color: #667eea;
        color: #667eea;
        
        .el-icon {
          color: inherit;
        }
      }
    }
    
    .empty-messages {
      .empty-content {
        h2 {
          color: #e0e0e0;
        }
        
        p {
          color: #a0a0a0;
        }
        
        .suggestion-grid .suggestion-card {
          background: #2d2d2d;
          border-color: #404040;
          
          &:hover {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.15);
          }
          
          span {
            color: #e0e0e0;
          }
        }
      }
    }
  }
  
  .input-area {
    background: #1e1e1e;
    
    .input-wrapper {
      background: #2d2d2d;
      border-color: #404040;
      
      &:focus-within {
        border-color: #667eea;
        background: #2d2d2d;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
      }
      
      .attach-btn {
        color: #a0a0a0;
        
        &:hover:not(:disabled) {
          color: #667eea;
          background: rgba(102, 126, 234, 0.15);
        }
      }
      
      .message-input :deep(.el-textarea__inner) {
        color: #e0e0e0;
        
        &::placeholder {
          color: #606266;
        }
      }
    }
    
    .input-hint {
      color: #606266;
    }
  }
  
  .sidebar-footer .user-info {
    .username {
      color: #e0e0e0;
    }
  }
}

/* Sidebar 底部用户区域样式 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background: #fafafa;
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .el-avatar {
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .username {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
    
    &.sidebar-collapsed {
      transform: translateX(-100%);
    }
  }
  
  .chat-header {
    .header-left .mobile-menu-btn {
      display: block;
    }
  }
  
  .message-container {
    padding: 16px;
  }
  
  .message-main {
    max-width: 85%;
  }
  
  .input-area {
    padding: 12px 16px;
    
    .input-wrapper {
      padding: 8px 12px;
    }
  }
  
  .empty-messages .empty-content {
    padding: 24px 16px;
    
    .suggestion-grid {
      grid-template-columns: 1fr;
      gap: 8px;
      
      .suggestion-card {
        padding: 12px;
      }
    }
  }
}

@media (max-width: 480px) {
  .message-main {
    max-width: 90%;
  }
  
  .chat-header {
    padding: 12px 16px;
    
    .header-left .chat-title {
      font-size: 14px;
    }
    
    .header-actions .el-button {
      width: 32px;
      height: 32px;
    }
  }
  
  .input-area .input-wrapper .send-btn {
    width: 36px;
    height: 36px;
  }
}
</style>

<!-- 全局样式 -->
<style>
/* 代码块整体样式 */
.code-block-wrapper {
  position: relative;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #282c34;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 代码块头部 */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #21252b;
  border-bottom: 1px solid #323842;
}

.code-language {
  font-size: 12px;
  color: #abb2bf;
  font-weight: 500;
  text-transform: uppercase;
}

/* 复制按钮样式 */
.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: #abb2bf;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background-color: #323842;
  color: #e0e0e0;
}

.copy-btn.copied {
  background-color: #10b981;
  color: white;
}

.copy-icon {
  font-size: 14px;
}

/* 复制/已复制文本切换 */
.copy-text,
.copy-btn.copied .copied-text {
  display: inline;
}

.copied-text,
.copy-btn.copied .copy-text {
  display: none;
}

/* 代码内容样式 */
.code-block-wrapper pre {
  padding: 16px;
  overflow-x: auto;
  margin: 0;
}

.code-block-wrapper code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
  background: transparent;
}

/* Typing Indicator 样式 */
.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #667eea;
      animation: typingBounce 1.4s ease-in-out infinite;
      
      &:nth-child(1) {
        animation-delay: 0s;
      }
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* 深色主题适配 */
.dark-theme .code-block-wrapper {
  background-color: #1e1e1e;
}

.dark-theme .code-header {
  background-color: #2d2d2d;
  border-color: #404040;
}

.dark-theme .code-language {
  color: #d4d4d4;
}

.dark-theme .copy-btn {
  color: #d4d4d4;
}

.dark-theme .copy-btn:hover {
  background-color: #404040;
}
</style>