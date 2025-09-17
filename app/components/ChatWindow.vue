<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import CodeMarkdown from '@/components/CodeMarkdown.vue'
import Dropdown from '@/components/common/Dropdown.vue'
import ChatInput from '@/components/ChatInput.vue'
import { BaseAIProviderUI } from '@/providers/ui/base'
import type { ProviderModel } from '@/types/ai'

const props = defineProps<{ provider: BaseAIProviderUI }>()
const store = useChatStore()
const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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


function adjustTextareaHeight() {
  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      // 重置高度以計算正確的 scrollHeight
      textarea.style.height = 'auto'
      // 設定新高度，最大 120px
      const newHeight = Math.min(textarea.scrollHeight, 120)
      textarea.style.height = `${newHeight}px`
    }
  })
}

const messages = computed(() => store.getMessages(props.provider.type))
const loading = ref(false)
const isThinking = ref(false)
// 核心發送邏輯
async function sendMessage(text: string) {
  if (!text || loading.value) return
  loading.value = true
  isThinking.value = true
  // 用戶發送訊息時立即滾動到底部
  scrollToBottom()
  const result = await store.send(props.provider.type, text)
  isThinking.value = false
  if (result?.message && result?.content) {
    // 使用串流顯示回應（word 模式保留空白與縮排）
    await streamToMessage(result.message, result.content, 20, 'word')
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

// 監聽輸入變化，自動調整 textarea 高度
watch(input, () => {
  adjustTextareaHeight()
})

</script>

<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__title">{{ props.provider.getTitle() }}</div>
      <Dropdown v-model="selectedModel" :data="modelItems" aria-label="模型選擇" />
    </div>
    <div ref="listEl" class="chat__list">
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
        <div class="bubble">
          <CodeMarkdown :content="m.content" />
        </div>
      </div>
      <div v-if="!messages.length" class="placeholder">輸入訊息開始對話</div>
      <div v-if="isThinking" class="loading-indicator">
        <span>AI 思考中...</span>
        <div class="loading-spinner"></div>
      </div>
    </div>
    <div class="chat__input">
      <ChatInput
        :placeholder="'詢問任何問題'"
        :send="async (text: string) => await sendMessage(text)"
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
  //justify-content: space-between;
}

.chat__title {
  font-weight: 600;
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

.msg {
  display: flex;
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

