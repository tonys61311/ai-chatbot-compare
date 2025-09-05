<script setup lang="ts">
import { AIProviderType } from '@/types/ai'
import { getThemeVars } from '@/utils/theme'
import { computed } from 'vue'

const props = defineProps<{ type: AIProviderType; title?: string; messages?: { role: 'user'|'assistant'; content: string }[]; loading?: boolean; text?: string; error?: string; elapsedMs?: number }>()

const vars = computed(() => getThemeVars(props.type))
</script>

<template>
  <div class="panel" :data-provider="props.type" :style="vars">
    <div class="panel__header">
      <h3>{{ title || props.type.toUpperCase() }}<small v-if="elapsedMs"> ({{ elapsedMs }}ms)</small></h3>
    </div>
    <div class="panel__body">
      <div v-if="error" class="text error">{{ error }}</div>
      <div v-else-if="loading" class="text">載入中…</div>
      <pre v-else class="text">{{ text }}</pre>
    </div>
  </div>
  
</template>

<style scoped lang="scss">
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  padding: 12px;
}
.panel__header h3 {
  color: var(--panel-title);
  margin: 0 0 8px;
}
.text {
  color: var(--panel-text);
  white-space: pre-wrap;
}
.error { color: #b00; }
</style>


