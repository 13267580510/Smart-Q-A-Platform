
<template>
  <div class="ai-chat-container" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 主题切换按钮 -->
    <div class="theme-toggle">
      <el-tooltip :content="isDarkTheme ? '切换到浅色主题' : '切换到深色主题'" placement="bottom">
        <el-button @click="toggleTheme" circle>
          <el-icon v-if="isDarkTheme"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <div class="chat-layout">
      <!-- 左侧对话列表区 -->
      <div class="chat-sidebar">
        <!-- 品牌Logo和新建对话按钮 -->
        <div class="sidebar-header">
          <div class="brand-logo">
            <span class="logo-text">小智AI助手</span>
          </div>
          <el-button class="new-chat-btn" @click="startNewChat" :loading="isCreatingChat">
            <el-icon><Plus /></el-icon>
            开启新对话
          </el-button>
        </div>

        <!-- 对话列表 -->
        <div class="chat-list">
          <div 
            v-for="chat in chatList" 
            :key="chat.id"
            :class="['chat-item', { active: activeChatId === chat.id, 'loading': loadingChats[chat.id] }]"
            @click="selectChat(chat.id)"
            @mouseenter="isHoveredChat = chat.id"
            @mouseleave="isHoveredChat = null"
          >
            <el-icon><ChatLineRound /></el-icon>
            <span class="chat-title">{{ chat.title }}</span>
            <div class="chat-actions">
              <el-icon 
                class="delete-btn" 
                @click.stop="deleteChat(chat.id)"
                v-show="activeChatId === chat.id || isHoveredChat === chat.id"
              >
                <Close />
              </el-icon>
              <el-icon class="loading-icon" v-if="loadingChats[chat.id]">
                <Loading />
              </el-icon>
            </div>
          </div>
          
          <!-- 加载更多提示 -->
          <div class="load-more" v-if="hasMoreSessions && !isLoadingSessions">
            <el-button link @click="loadMoreSessions">加载更多...</el-button>
          </div>
          <div class="loading-sessions" v-if="isLoadingSessions">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <div class="empty-sessions" v-if="chatList.length === 0 && !isLoadingSessions">
            <el-empty description="暂无对话记录" />
          </div>
        </div>
      </div>

      <!-- 右侧对话内容区 -->
      <div class="chat-main">
        <!-- 标题栏 -->
        <div class="conversation-header">
          <div class="title-section">
            <h3 class="conversation-title">
              {{ currentChatTitle }}
            </h3>
            <el-button class="edit-title-btn" size="small" circle @click="editChatTitle">
              <el-icon><Edit /></el-icon>
            </el-button>
          </div>
          
          <!-- 文件选择状态显示 -->
          <div class="file-status" v-if="selectedFile">
            <el-tag type="success" closable @close="clearSelectedFile">
              <el-icon><Document /></el-icon>
              已选择: {{ selectedFile.name }}
            </el-tag>
          </div>
          <el-button class="share-btn" circle @click="shareConversation">
            <el-icon><Share /></el-icon>
          </el-button>
        </div>

        <!-- 消息容器 -->
        <div class="message-container" ref="messageContainer">
          <!-- 消息加载提示 -->
          <div class="loading-messages" v-if="loadingMessages">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span>正在加载消息...</span>
          </div>
          
          <!-- 无消息提示 -->
          <div class="empty-messages" v-if="!loadingMessages && currentMessages.length === 0">
            <div class="empty-content">
              <el-icon class="empty-icon"><ChatLineSquare /></el-icon>
              <h4>开始新的对话</h4>
              <p>输入消息开始与AI对话，或者从左侧选择历史对话</p>
              <div class="quick-starts">
                <el-button @click="sendQuickMessage('帮我写一个Vue组件的示例')" text>
                  ✨ 帮我写一个Vue组件的示例
                </el-button>
                <el-button @click="sendQuickMessage('解释一下什么是闭包')" text>
                  🤔 解释一下什么是闭包
                </el-button>
                <el-button @click="sendQuickMessage('如何优化前端性能')" text>
                  ⚡ 如何优化前端性能
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 消息列表 -->
          <div 
            v-for="message in currentMessages" 
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="avatar">
              <el-avatar 
                :size="40" 
                :src="message.role === 'user' ? userAvatar : aiAvatar"
              />
            </div>
            <div class="message-content">
              <div 
                class="message-bubble"
                :class="{ 'markdown-content': message.role === 'assistant' }"
              >
                <div v-if="message.role === 'assistant'" v-html="renderMarkdown(message.content)"></div>
                <template v-else>{{ message.content }}</template>
              </div>
              
              <!-- 消息操作按钮 -->
              <div class="message-actions" v-if="message.role === 'assistant'">
                <el-tooltip content="复制" placement="top">
                  <el-button size="small" circle @click="copyMessage(message)">
                    <el-icon><DocumentCopy /></el-icon>
                  </el-button>
                </el-tooltip>
                 <el-tooltip content="不满意此回答，前往提问" placement="top">
                  <el-button size="small" circle @click="goToAskPage(message)">
                    <el-icon><Position /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
          
          <!-- 发送中提示 -->
          <div class="sending-message" v-if="isSending">
            <div class="message assistant">
              <div class="avatar">
                <el-avatar :size="40" :src="aiAvatar" />
              </div>
              <div class="message-content">
                <div class="message-bubble loading-bubble">
                  <el-icon class="typing-icon"><Loading /></el-icon>
                  <span class="typing-text">正在思考中...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            placeholder="给 小智 发送消息"
            :rows="2"
            type="textarea"
            resize="none"
            @keydown.enter.prevent="sendMessage"
            class="message-input"
            :disabled="isSending"
          />
          <div class="input-actions">
            <el-button size="small" @click="handleFileUpload" :disabled="isSending">
              <el-icon><Upload /></el-icon>
              上传附件
            </el-button>
          </div>
          
          <!-- 文件选择状态显示 -->
          <div class="file-status" v-if="selectedFile">
            <el-tag type="success" closable @close="clearSelectedFile">
              <el-icon><Document /></el-icon>
              已选择: {{ selectedFile.name }}
            </el-tag>
          </div>
          <el-button 
            type="primary" 
            :loading="isSending"
            @click="sendMessage"
            class="send-btn"
            circle
            :disabled="!inputMessage.trim() || isSending"
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
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
  Loading, ChatLineSquare, Position, Picture, Upload
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

// 静态资源路径
const userAvatar = '/src/assets/image/user-avatar.png'
const aiAvatar = 'src/assets/icons/ai_avat.svg'

// 响应式数据
const isDarkTheme = ref(false)
const isHoveredChat = ref<number | string | null>(null)
const thinkingMode = ref('normal')
const userStore = useUserStore()

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
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  
  .brand-logo {
    margin-bottom: 16px;
    
    .logo-text {
      font-size: 20px;
      font-weight: bold;
      color: #409eff;
    }
  }
  
  .new-chat-btn {
    width: 100%;
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
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  
  &:hover {
    background: #f5f7fa;
    
    .chat-actions .delete-btn {
      opacity: 1;
    }
  }
  
  &.active {
    background: #ecf5ff;
    color: #409eff;
  }
  
  &.loading {
    opacity: 0.7;
    cursor: wait;
  }
  
  .chat-title {
    flex: 1;
    margin-left: 8px;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .chat-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .delete-btn {
      opacity: 0;
      color: #909399;
      font-size: 12px;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.3s;
      
      &:hover {
        background: #f56c6c;
        color: #fff;
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
}

.conversation-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .title-section {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .conversation-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .edit-title-btn {
      width: 28px;
      height: 28px;
      opacity: 0.7;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

.message-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  position: relative;
  
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
      max-width: 400px;
      
      .empty-icon {
        font-size: 48px;
        color: #c0c4cc;
        margin-bottom: 16px;
      }
      
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
      }
      
      p {
        margin: 0 0 24px 0;
        color: #909399;
      }
      
      .quick-starts {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        
        .el-button {
          justify-content: flex-start;
          padding: 12px 16px;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          text-align: left;
          color: #303133;
          
          &:hover {
            background: #f5f7fa;
            border-color: #409eff;
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
    
    &.user {
      flex-direction: row-reverse;
      
      .message-content {
        margin-right: 12px;
        margin-left: 0;
        align-items: flex-end;
      }
      
      .message-bubble {
        background: #409eff;
        color: #fff;
        border-top-right-radius: 0;
      }
    }
    
    &.assistant {
      .message-content {
        margin-left: 12px;
        align-items: flex-start;
      }
      
      .message-bubble {
        background: #f5f7fa;
        color: #303133;
        border-top-left-radius: 0;
      }
    }
  }
  
  .avatar {
    flex-shrink: 0;
  }
  
  .message-content {
    display: flex;
    flex-direction: column;
    max-width: 60%;
  }
  
  .message-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
    margin-bottom: 8px;
  }
  
  .message-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    opacity: 1;
    transition: opacity 0.3s;
    
    .message:hover & {
      opacity: 1;
    }
  }
  
  .message-time {
    font-size: 12px;
    color: #909399;
  }
}

.input-area {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  
  .message-input {
    flex: 1;
  }
  
  .input-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-right: 12px;
  }
  
  .send-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
  }
}

/* 深色主题适配 */
.dark-theme {
  .conversation-header {
    .conversation-title {
      color: #e0e0e0;
    }
  }
  
  .message-container {
    .assistant .message-bubble {
      background-color: #3d3d3d;
      color: #e0e0e0;
    }
    
    .message-time {
      color: #a0a0a0;
    }
    
    .empty-messages {
      .empty-content {
        h4 {
          color: #e0e0e0;
        }
        
        p {
          color: #a0a0a0;
        }
        
        .quick-starts .el-button {
          border-color: #404040;
          color: #e0e0e0;
          
          &:hover {
            background: #3d3d3d;
            border-color: #409eff;
          }
        }
      }
    }
  }
  
  .input-area {
    :deep(.el-textarea__inner) {
      background-color: #3d3d3d;
      border-color: #404040;
      color: #e0e0e0;
      
      &::placeholder {
        color: #a0a0a0;
      }
    }
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