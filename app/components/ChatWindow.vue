<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import IconButton from '@/components/IconButton.vue'
import CodeMarkdown from '@/components/CodeMarkdown.vue'
import { AIProviderType } from '@/types/ai'

const props = defineProps<{ type: AIProviderType; title?: string }>()
const store = useChatStore()
const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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

const messages = computed(() => store.getMessages(props.type))
const loading = computed(() => store.isLoading(props.type))

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  input.value = ''
  // 用戶發送訊息時立即滾動到底部
  scrollToBottom()
  
  const result = await store.send(props.type, text)
  if (result?.message && result?.content) {
    // 使用串流顯示回應（word 模式保留空白與縮排）
    await streamToMessage(result.message, result.content, 20, 'word')
  }
}

// 監聽輸入變化，自動調整 textarea 高度
watch(input, () => {
  adjustTextareaHeight()
})

</script>

<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__title">{{ title || props.type.toUpperCase() }}</div>
    </div>
    <div ref="listEl" class="chat__list">
      <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
        <div class="bubble">
          <CodeMarkdown :content="m.content" />
        </div>
      </div>
      <div v-if="!messages.length" class="placeholder">輸入訊息開始對話</div>
    </div>
    <div class="chat__input">
      <div class="composer">
        <IconButton icon="mdi:plus" :size="30" :disabled="loading" aria-label="新增" />
        <textarea
          class="composer__input"
          v-model="input"
          :placeholder="loading ? '請稍候…' : '詢問任何問題'"
          :disabled="loading"
          @keydown.enter.exact.prevent="send"
          rows="1"
          ref="textareaRef"
        />
        <div class="composer__actions">
          <IconButton icon="mdi:microphone" :size="30" :disabled="loading" aria-label="語音" />
          <IconButton icon="mdi:send" variant="primary" :size="30" :disabled="!input.trim() || loading" @click="send" aria-label="送出" />
        </div>
      </div>
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


