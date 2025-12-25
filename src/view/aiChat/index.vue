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
            <span class="logo-text">deepseek</span>
          </div>
          <el-button class="new-chat-btn" @click="startNewChat">
            <el-icon><Plus /></el-icon>
            开启新对话
          </el-button>
        </div>

        <!-- 对话列表 -->
        <div class="chat-list">
          <div 
            v-for="chat in chatList" 
            :key="chat.id"
            :class="['chat-item', { active: activeChatId === chat.id }]"
            @click="selectChat(chat.id)"
          >
            <el-icon><ChatLineRound /></el-icon>
            <span class="chat-title">{{ chat.title }}</span>
            <el-icon 
              class="delete-btn" 
              @click.stop="deleteChat(chat.id)"
              v-show="activeChatId === chat.id || isHoveredChat === chat.id"
            >
              <Close />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 右侧对话内容区 -->
      <div class="chat-main">
        <!-- 标题栏 -->
        <div class="conversation-header">
          <h3 class="conversation-title">
            {{ currentChatTitle }}
          </h3>
          <el-button class="share-btn" circle>
            <el-icon><Share /></el-icon>
          </el-button>
        </div>

        <!-- 消息容器 -->
        <div class="message-container" ref="messageContainer">
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
                <el-tooltip content="刷新" placement="top">
                  <el-button size="small" circle @click="regenerateMessage(message)">
                    <el-icon><Refresh /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="点赞" placement="top">
                  <el-button size="small" circle @click="likeMessage(message)">
                    <el-icon><Star /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="点踩" placement="top">
                  <el-button size="small" circle @click="dislikeMessage(message)">
                    <el-icon><Thumb /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="分享" placement="top">
                  <el-button size="small" circle @click="shareMessage(message)">
                    <el-icon><Share /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
              
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            placeholder="给 DeepSeek 发送消息"
            :rows="2"
            type="textarea"
            resize="none"
            @keydown.enter.prevent="sendMessage"
            class="message-input"
          />
          <div class="input-actions">
            <el-button size="small" @click="setThinkingMode('deep')">
              <el-icon><Brain /></el-icon>
              深度思考
            </el-button>
            <el-button size="small" @click="setThinkingMode('web')">
              <el-icon><Search /></el-icon>
              联网搜索
            </el-button>
          </div>
          <el-button 
            type="primary" 
            :loading="isSending"
            @click="sendMessage"
            class="send-btn"
            circle
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ChatLineRound, Close, Promotion, DocumentCopy, Refresh, Star, Thumb, Share, Brain, Search, Sunny, Moon } from '@element-plus/icons-vue'
import { sseChat } from '../../api/ai'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css' // 改用深色主题，匹配图2样式

// 类型定义
interface Chat {
  id: number | string
  title: string
  createTime: number
}

interface Message {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// 静态资源路径
const userAvatar = '/src/assets/image/user-avatar.png'
const aiAvatar = '/src/assets/image/ai-avatar.png'

// 响应式数据
const isDarkTheme = ref(false)
const isHoveredChat = ref<number | string | null>(null)
const thinkingMode = ref('normal')

const chatList = ref<Chat[]>([
  { id: 1, title: '关于项目开发的讨论', createTime: Date.now() - 3600000 },
  { id: 2, title: '技术问题咨询', createTime: Date.now() - 7200000 },
  { id: 3, title: '学习建议', createTime: Date.now() - 10800000 }
])

const messagesMap = ref<Record<number | string, Message[]>>({
  1: [
    { id: 1, role: 'user', content: '你好，我想了解如何优化前端性能？', timestamp: Date.now() - 3500000 },
    { id: 2, role: 'assistant', content: '前端性能优化可以从以下几个方面入手：\n1. 代码压缩和合并\n2. 图片优化\n3. 使用CDN\n4. 懒加载\n5. 缓存策略', timestamp: Date.now() - 3400000 },
    { id: 3, role: 'user', content: '能具体说说代码压缩吗？', timestamp: Date.now() - 3300000 },
    { id: 4, role: 'assistant', content: '代码压缩可以通过Webpack、Vite等构建工具实现，常用的插件有TerserWebpackPlugin等。', timestamp: Date.now() - 3200000 }
  ],
  2: [
    { id: 1, role: 'user', content: 'Vue3和Vue2有什么区别？', timestamp: Date.now() - 7100000 },
    { id: 2, role: 'assistant', content: 'Vue3主要改进包括：Composition API、更好的TypeScript支持、性能优化等。', timestamp: Date.now() - 7000000 }
  ],
  3: [
    { id: 1, role: 'user', content: '如何学习前端开发？', timestamp: Date.now() - 10700000 },
    { id: 2, role: 'assistant', content: '建议从HTML、CSS、JavaScript基础开始，然后学习框架如Vue或React。', timestamp: Date.now() - 10600000 }
  ]
})

const activeChatId = ref<number | string>(1)
const inputMessage = ref('')
const isSending = ref(false)
const messageContainer = ref<HTMLElement | null>(null)

// 计算属性
const currentMessages = computed(() => {
  return messagesMap.value[activeChatId.value] || []
})

const currentChatTitle = computed(() => {
  const chat = chatList.value.find(chat => chat.id === activeChatId.value)
  return chat ? chat.title : '新对话'
})

// 方法
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

const setThinkingMode = (mode: string) => {
  thinkingMode.value = mode
  ElMessage.success(`已切换到${mode === 'deep' ? '深度思考' : '联网搜索'}模式`)
}

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



const deleteChat = async (chatId: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = chatList.value.findIndex(chat => chat.id === chatId)
    if (index !== -1) {
      chatList.value.splice(index, 1)
    }
    
    delete messagesMap.value[chatId]
    
    if (activeChatId.value === chatId) {
      activeChatId.value = chatList.value[0]?.id || ''
    }
    
    ElMessage.success('对话已删除')
  } catch {
    // 用户取消删除
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isSending.value) return
  
  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  }
  
  // 添加到当前对话
  if (!messagesMap.value[activeChatId.value]) {
    messagesMap.value[activeChatId.value] = []
  }
  messagesMap.value[activeChatId.value].push(userMessage)
  
  const tempInput = inputMessage.value
  inputMessage.value = ''
  isSending.value = true
  
  try {
    // 模拟AI回复
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now(),
        role: 'assistant',
        content: `这是对"${tempInput}"的回复。思考模式：${thinkingMode.value}`,
        timestamp: Date.now()
      }
      
      messagesMap.value[activeChatId.value].push(aiMessage)
      isSending.value = false
      
      // 更新对话标题（如果是新对话的第一条消息）
      if (messagesMap.value[activeChatId.value].length === 2) {
        const chat = chatList.value.find(chat => chat.id === activeChatId.value)
        if (chat && chat.title === '新对话') {
          chat.title = tempInput.slice(0, 20) + (tempInput.length > 20 ? '...' : '')
        }
      }
      
      nextTick(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      })
    }, 1000)
  } catch (error) {
    isSending.value = false
    ElMessage.error('发送失败')
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const renderMarkdown = (content: string) => {
  const md = new MarkdownIt({
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
        } catch (__) {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  })
  
  return md.render(content)
}
const currentCancelStream = ref<(() => void) | null>(null)

// 计算属性：当前激活对话的消息列表
const currentMessages = computed(() => 
  messagesMap.value[activeChatId.value] || []
)

// 选择对话
const selectChat = (chatId: number | string) => {
  currentCancelStream.value?.()
  currentCancelStream.value = null
  activeChatId.value = chatId
  nextTick(() => {
    scrollToBottom()
    setupCopyButtons()
  })
}

// 新建对话
const startNewChat = () => {
  currentCancelStream.value?.()
  currentCancelStream.value = null
  
  const newChatId = Date.now()
  const newChat: Chat = {
    id: newChatId,
    title: '新对话',
    createTime: Date.now()
  }
  
  chatList.value.unshift(newChat)
  messagesMap.value[newChatId] = []
  activeChatId.value = newChatId
  
  ElMessage.success('已创建新对话')
  nextTick(() => scrollToBottom())
}

// 删除对话
const deleteChat = async (chatId: number | string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    if (activeChatId.value === chatId) {
      currentCancelStream.value?.()
      currentCancelStream.value = null
    }
    
    const index = chatList.value.findIndex(chat => chat.id === chatId)
    if (index !== -1) {
      chatList.value.splice(index, 1)
      delete messagesMap.value[chatId]
      
      if (activeChatId.value === chatId) {
        activeChatId.value = chatList.value[0]?.id || ''
      }
      
      ElMessage.success('对话已删除')
      nextTick(() => scrollToBottom())
    }
  } catch {
    // 用户取消删除
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  
  if (!activeChatId.value) {
    ElMessage.warning('请先选择或创建一个对话')
    return
  }
  
  currentCancelStream.value?.()
  currentCancelStream.value = null
  
  isSending.value = true
  
  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: Date.now()
  }
  
  if (!messagesMap.value[activeChatId.value]) {
    messagesMap.value[activeChatId.value] = []
  }
  
  messagesMap.value[activeChatId.value].push(userMessage)
  const inputVal = inputMessage.value.trim()
  inputMessage.value = ''
  
  const aiMessageId = Date.now() + 1
  const aiMessage: Message = {
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  
  messagesMap.value[activeChatId.value].push(aiMessage)
  scrollToBottom()
  
  try {
    const cancelStream = await sseChat(
      String(activeChatId.value),
      inputVal,
      (chunk) => {
        const aiMessageIndex = messagesMap.value[activeChatId.value].findIndex(
          msg => msg.id === aiMessageId
        )
        if (aiMessageIndex !== -1) {
          messagesMap.value[activeChatId.value][aiMessageIndex].content += chunk
          scrollToBottom()
        }
      },
      (error) => {
        ElMessage.error('AI服务连接错误：' + error.message)
        isSending.value = false
        
        const aiMessageIndex = messagesMap.value[activeChatId.value].findIndex(
          msg => msg.id === aiMessageId && msg.content === ''
        )
        if (aiMessageIndex !== -1) {
          messagesMap.value[activeChatId.value].splice(aiMessageIndex, 1)
        }
      },
      () => {
        isSending.value = false
        currentCancelStream.value = null
        
        const currentChat = chatList.value.find(chat => chat.id === activeChatId.value)
        if (currentChat && currentChat.title === '新对话') {
          currentChat.title = inputVal.slice(0, 20) + (inputVal.length > 20 ? '...' : '')
        }
        nextTick(() => setupCopyButtons()) // 确保DOM更新后再绑定
      }
    )
    
    currentCancelStream.value = cancelStream
  } catch (error) {
    ElMessage.error('发送消息失败：' + (error as Error).message)
    isSending.value = false
    
    const aiMessageIndex = messagesMap.value[activeChatId.value].findIndex(
      msg => msg.id === aiMessageId && msg.content === ''
    )
    if (aiMessageIndex !== -1) {
      messagesMap.value[activeChatId.value].splice(aiMessageIndex, 1)
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

// Markdown解析器实例（集成代码高亮）
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

// 渲染Markdown内容（添加代码块头部+复制按钮）
const renderMarkdown = (content: string) => {
  const rendered = md.render(content)
  // 匹配代码块并添加包装结构
  return rendered.replace(/<pre><code class="([^"]*language-([^"]*))"[^>]*>([\s\S]*?)<\/code><\/pre>/g, 
    (_, langClass, langName, codeContent) => {
      const displayLang = langName || '代码'
      return `<div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-language">${displayLang}</span>
          <button class="copy-btn">
            <el-icon class="copy-icon"><DocumentCopy /></el-icon>
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
      // 先移除旧事件，避免重复绑定
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
    // 降级方案
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

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 加载用户历史会话
    const sessionsResponse = await getUserSessions()
    const sessions: Chat[] = sessionsResponse.sessions.map(session => ({
      id: session.sessionId,
      title: session.title,
      createTime: new Date(session.createdAt).getTime(),
      sessionId: session.sessionId
    }))
    
    chatList.value = sessions
    
    if (sessions.length > 0) {
      activeChatId.value = sessions[0].id
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
    ElMessage.error('加载会话列表失败')
  }
  
  scrollToBottom()
  nextTick(() => setupCopyButtons())
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
}

.chat-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    color: #303133;
    font-size: 18px;
    font-weight: 600;
  }
}

.chat-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.chat-list {
  padding: 16px;
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
    
    .delete-btn {
      opacity: 1;
    }
  }
  
  &.active {
    background: #ecf5ff;
    color: #409eff;
  }
  
  .chat-title {
    flex: 1;
    margin-left: 8px;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
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
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.message-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  
  .message {
    display: flex;
    margin-bottom: 24px;
    
    &.user {
      flex-direction: row-reverse;
      
      .message-content {
        margin-right: 12px;
        margin-left: 0;
      }
      
      .message-bubble {
        background: #409eff;
        color: #fff;
        border-top-right-radius: 0;
      }
    }
    
    &.assistant {
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
    margin-left: 12px;
    max-width: 60%;
  }
  
  .message-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }

  /* Markdown内容样式 */
  .markdown-content {
    // 覆盖默认样式，统一用代码块包装器的样式
    pre {
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border-radius: 0 !important;
    }
    code {
      background: transparent !important;
      padding: 0 !important;
    }
    ul, ol {
      padding-left: 20px;
      margin: 8px 0;
    }
    h1, h2, h3 {
      margin: 12px 0 8px;
      font-weight: 600;
    }
  }
  
  .message-time {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    text-align: center;
  }
}

.input-area {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  
  :deep(.el-textarea__inner) {
    resize: none;
    box-shadow: none;
    border-radius: 8px;
    
    &:focus {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      border-color: #409eff;
    }
  }
  
  .send-btn {
    height: 56px;
    padding: 0 20px;
    border-radius: 8px;
  }
}
</style>

<!-- 全局样式（解决scoped作用域问题） -->
<style>
/* 代码块整体样式（匹配图2深色主题） */
.code-block-wrapper {
  position: relative;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #282c34; /* 深色背景 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* 代码块头部（语言+复制按钮） */
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
}

/* 复制按钮样式 */
.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
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
  width: 14px;
  height: 14px;
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
}

.code-block-wrapper code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
}
</style>