<script setup lang="ts">
import { createAllProviderUIs } from '@/providers/ui/factory'

const providers = createAllProviderUIs()
</script>

<template>
  <div class="container">
    <h1 style="margin-bottom: 8px">AI Chatbot Compare</h1>
    <p style="margin-top: 0">簡易版 ChatGPT 介面（之後再依 type 微調主題）</p>

    <div class="grid-3">
      <ChatWindow v-for="p in providers" :key="p.type" :provider="p" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  height: 100vh;             /* 固定視窗高度 */
  display: flex;             /* 讓下方區塊可用 flex:1 撐滿 */
  flex-direction: column;
  padding: 24px;             /* 明確設定 padding */
  box-sizing: border-box;    /* 包含 padding 在高度內 */
}
.actions {
  margin: 12px 0;
}

.grid-3 {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, 1fr);
  flex: 1;                 /* 使用剩餘空間 */
  min-height: 0;           /* 允許內部正確溢出/收縮 */
  height: 0;               /* 強制使用 flex 高度 */
  grid-auto-rows: 1fr;     /* 每格同高 */
}
.grid-3 > * { 
  min-height: 0;           /* 允許子元素正確收縮 */
  height: 100%;            /* 填滿 grid 格子 */
}

/* ChatWindow 控制內部樣式，這裡只保留網格布局 */
</style>