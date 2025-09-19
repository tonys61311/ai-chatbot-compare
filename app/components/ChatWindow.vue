<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CodeMarkdown from '@/components/CodeMarkdown.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import ChatInput from '@/components/ChatInput.vue'
import { BaseAIProviderUI } from '@/providers/ui/base'
import type { ProviderModel } from '@/types/ai'

const props = defineProps<{ provider: BaseAIProviderUI }>()
const store = useChatStore()
const selectedModel = ref('')

// 模型下拉資料
const modelItems = computed(() => {
  const models = store.getModels(props.provider.type)
  return models.map((m: ProviderModel) => ({ label: m.label, value: m.id }))
})

// 設定預設選中的模型
onMounted(() => {
  const models = store.getModels(props.provider.type)
  const defaultModel = models.find(m => m.default) || models[0]
  if (defaultModel) {
    selectedModel.value = defaultModel.id
  }
})

// 使用滾動 composable
const { listEl, scrollToBottom, streamToMessage } = useAutoScroll()

const messages = computed(() => store.getMessages(props.provider.type))
const loading = ref(false)
const isThinking = ref(false)
const useStreaming = ref(true) // 預設啟用串流

// 核心發送邏輯
async function sendMessage(text: string, imgUrls: string[] = []) {
  if (!text || loading.value) return
  loading.value = true
  isThinking.value = true
  // 用戶發送訊息時立即滾動到底部
  scrollToBottom()
  
  // 準備訊息內容
  let messageContent: string | Array<any>
  
  if (imgUrls.length === 0) {
    // 只有文字
    messageContent = text
  } else {
    // 文字 + 圖片
    messageContent = [
      { type: 'text', text: text }
    ]
    
    // 添加圖片
    for (const imgUrl of imgUrls) {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: imgUrl,
          detail: 'auto'
        }
      })
    }
  }
  
  if (useStreaming.value) {
    // 使用串流模式
    const result = await store.sendStream(props.provider.type, messageContent, selectedModel.value, () => {
      if (isThinking.value) isThinking.value = false
    })
    if (result?.message && result?.content) {
      // 串流模式下，內容會即時更新，不需要額外的串流顯示
      scrollToBottom()
    }
  } else {
    // 使用傳統模式
    const result = await store.send(props.provider.type, messageContent, selectedModel.value)
    isThinking.value = false
    if (result?.message && result?.content) {
      // 使用串流顯示回應（word 模式保留空白與縮排）
      await streamToMessage(result.message, result.content, 20, 'word')
    }
  }
  loading.value = false
}


// 外部調用的 send 方法（由父元件使用）
async function sendExternal(externalText: string) {
  await sendMessage(externalText)
}

// 暴露 sendExternal 方法給父元件使用
defineExpose({
  send: sendExternal
})

</script>

<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__title">{{ props.provider.getTitle() }}</div>
      <Dropdown v-model="selectedModel" :data="modelItems" aria-label="模型選擇" />
      <div v-if="false" class="chat__controls">
        <button 
          class="stream-toggle" 
          :class="{ active: useStreaming }"
          @click="useStreaming = !useStreaming"
          :title="useStreaming ? '關閉串流' : '開啟串流'"
        >
          {{ useStreaming ? '串流' : '等待' }}
        </button>
      </div>
    </div>
    <div ref="listEl" class="chat__list">
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
        <!-- 顯示圖片（如果是多媒體內容） -->
        <div v-if="Array.isArray(m.content)" class="message-images">
          <div 
            v-for="(item, index) in m.content.filter(c => c.type === 'image_url')" 
            :key="index"
            class="message-image"
          >
            <img :src="item.image_url?.url" :alt="`圖片 ${index + 1}`" />
          </div>
        </div>
        
        <!-- 顯示文字內容（在圖片下方） -->
        <div v-if="Array.isArray(m.content) ? m.content.find(c => c.type === 'text')?.text : m.content" class="bubble">
          <CodeMarkdown 
            :content="Array.isArray(m.content) ? m.content.find(c => c.type === 'text')?.text || '' : m.content" 
          />
        </div>
      </div>
      <div v-if="!messages.length" class="placeholder">輸入訊息開始對話</div>
      <!-- <div v-if="isThinking && !useStreaming" class="loading-indicator">
        <span>AI 思考中...</span>
        <div class="loading-spinner"></div>
      </div> -->
      <div v-if="isThinking" class="streaming-indicator">
        <span>AI 正在回應...</span>
        <div class="streaming-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    <div class="chat__input">
      <ChatInput
        :placeholder="'詢問任何問題'"
        :send="async (text: string, imgUrls: string[]) => await sendMessage(text, imgUrls)"
        sendLabel="送出"
        :loading="loading"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
// ===== 主容器 =====
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  background: #0f1115;
  color: #e6e6e6;
  border: 1px solid #23252b;
  border-radius: 12px;
  overflow: hidden;
}

// ===== 標題區域 =====
.chat__header {
  padding: 10px 12px;
  border-bottom: 1px solid #23252b;
  display: flex;
  align-items: center;
  gap: 12px;
  /* justify-content: space-between; */
}

.chat__title {
  font-weight: 600;
}

.chat__controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stream-toggle {
  background: #2a2d36;
  border: 1px solid #373a46;
  color: #e6e6e6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3a3f55;
  }

  &.active {
    background: #1e3a5f;
    border-color: #4a7c9d;
    color: #87ceeb;
  }
}

// ===== 圖片顯示樣式 =====
.message-images {
  display: flex;
  flex-direction: row-reverse; // 反向排列，讓圖片從右邊開始
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 12px; // 與 bubble 對齊
  overflow-x: auto; // 如果圖片太多，可以水平滾動
  scrollbar-width: none; // 隱藏滾動條
  -ms-overflow-style: none;
  width: 100%; // 確保有足夠寬度
  max-width: 100%; // 限制最大寬度
  align-self: flex-end; // 與父容器的 align-items: flex-end 一致
  
  &::-webkit-scrollbar {
    display: none; // 隱藏滾動條
  }
}

.message-image {
  min-width: 120px; // 最小寬度
  max-width: 200px;
  width: 120px; // 固定寬度
  height: 120px; // 固定高度，保持正方形
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0; // 防止被壓縮
  
  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover; // 保持比例並填滿容器
    border-radius: 8px;
  }
}

// ===== 可重用的滾動條樣式 =====
%custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #3a3f55 transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #3a3f55;
    border-radius: 3px;

    &:hover {
      background: #4a5068;
    }
  }
}

// ===== 訊息列表區域 =====
.chat__list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  scroll-behavior: smooth;
  @extend %custom-scrollbar;
}

// ===== 訊息樣式 =====
.placeholder {
  color: #777;
  text-align: center;
  margin-top: 20px;
}

// ===== Loading 指示器 =====
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 16px;
  color: #777;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #3a3f55;
  border-top: 2px solid #4a5068;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// ===== 串流指示器 =====
.streaming-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #87ceeb;
  font-size: 14px;
}

.streaming-dots {
  display: flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    background: #87ceeb;
    border-radius: 50%;
    animation: streaming-dot 1.4s infinite ease-in-out both;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0s; }
  }
}

@keyframes streaming-dot {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.msg {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin: 6px 0;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }
}


.bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  background: #1a1d24;
  word-wrap: break-word;
  overflow-wrap: break-word;

  .msg.user & {
    background: #1e3a5f;
  }

  .msg.assistant & {
    max-width: 100%;
  }
}

// ===== 輸入區域 =====
.chat__input {
  padding: 10px;
  border-top: 1px solid #23252b;
  display: flex;
}

.composer {
  display: flex;
  align-items: flex-end;
  width: 100%;
  background: #2a2d36;
  border: 1px solid #373a46;
  border-radius: 28px;
  padding: 5px;
}

.composer__input {
  flex: 1;
  min-width: 0;
  background: transparent;
  color: #e6e6e6;
  border: 0;
  padding: 5px;
  outline: none;
  font-size: 14px;
  resize: none;
  /* min-height: 20px; */
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.4;
  font-family: inherit;
  @extend %custom-scrollbar;
}

.composer__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

// ===== 按鈕樣式 =====
/* 使用 IconButton 元件，移除本地按鈕樣式 */
</style>

