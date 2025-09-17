<script setup lang="ts">
import { createAllProviderUIs } from '@/providers/ui/factory'
import { ref, onMounted, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatInput from '@/components/ChatInput.vue'

const providers = createAllProviderUIs()

const store = useChatStore()
const modelsLoaded = computed(() => store.isModelsLoaded)

// 統一輸入框
const globalInput = ref('')
const chatWindowRefs = ref<Array<{ send: (text: string) => void } | null>>([])

onMounted(async () => {
  await store.initData()
})

// 統一發送訊息到所有子元件
async function sendToAll(text?: string) {
  const msg = (typeof text === 'string' ? text : globalInput.value).trim()
  if (!msg) return
  globalInput.value = ''
  chatWindowRefs.value.forEach(chatWindow => {
    if (chatWindow && chatWindow.send) {
      chatWindow.send(msg)
    }
  })
}
</script>

<template>
  <div class="container">
    <h1 style="margin-bottom: 8px">AI Chatbot Compare</h1>
    <p style="margin-top: 0">簡易版 ChatGPT 介面（之後再依 type 微調主題）</p>

    <div class="grid-3">
      <ChatWindow 
        v-if="modelsLoaded" 
        v-for="(p, index) in providers" 
        :key="p.type" 
        :provider="p"
        :ref="(el) => { if (el) chatWindowRefs[index] = el as unknown as { send: (text: string) => void } }"
      />
    </div>

    <!-- 統一 GlobalInput 元件 -->
    <ChatInput
      :placeholder="'輸入訊息同時發送給所有 AI...'"
      :send="async (text: string) => { await sendToAll(text) }"
      sendLabel="發送"
    />
  </div>
</template>

<style lang="scss" scoped>
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
}

.global-input {
  display: flex;
  gap: 12px;
  margin: 16px 0;
  padding: 12px;
  background: #2a2d36;
  border: 1px solid #373a46;
  border-radius: 8px;
}

.global-input__field {
  flex: 1;
  background: transparent;
  border: none;
  color: #e6e6e6;
  outline: none;
  font-size: 14px;
}

.global-input__button {
  padding: 8px 16px;
  background: #1e3a5f;
  color: #e6e6e6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.global-input__button:hover {
  background: #2a4a6f;
}

.actions {
  margin: 12px 0;
}

.grid-3 {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
  flex: 1;
  min-height: 0;
  height: 0;
  grid-auto-rows: 1fr;
}

.grid-3 > * { 
  min-height: 0;
  height: 100%;
}

/* ChatWindow 控制內部樣式，這裡只保留網格布局 */
</style>