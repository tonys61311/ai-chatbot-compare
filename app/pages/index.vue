<script setup lang="ts">
import { createAllProviderUIs } from '@/providers/ui/factory'
import { ref, onMounted, computed } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatInput from '@/components/ChatInput.vue'

const providers = createAllProviderUIs()

const store = useChatStore()
const modelsLoaded = computed(() => store.isModelsLoaded)

// 統一輸入框
const chatWindowRefs = ref<Array<{ send: (text: string, imgUrls: string[]) => void } | null>>([])

onMounted(async () => {
  await store.initData()
})

// 統一發送訊息到所有子元件
function sendToAll(text: string, imgUrls: string[]) {
  const msg = text.trim()
  if (!msg) return
  chatWindowRefs.value.forEach(chatWindow => {
    if (chatWindow && chatWindow.send) {
      chatWindow.send(msg, imgUrls || [])
    }
  })
}
</script>

<template>
  <div class="container">
    <h1>AI Chatbot Compare</h1>

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
      :send="sendToAll"
      sendLabel="發送"
      :supportsImages="true"
    />
  </div>
</template>

<style lang="scss" scoped>
// ===== 主容器 =====
.container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 10px;
  box-sizing: border-box;
  background: #0f1115;
  color: #e6e6e6;
}

// ===== 標題區域 =====
h1 {
  color: #e6e6e6;
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 8px;
}

p {
  color: #777;
  font-size: 14px;
  margin-top: 0;
}


// ===== 網格布局 =====
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