<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'

// durationMs?: number 預設1000
const props = withDefaults(defineProps<{
  used: number
  limit: number
  exceeded: boolean
  durationMs?: number 
}>(), {
  durationMs: 1000
})

const { displayed, animateTo, isAnimating } = useAnimatedNumber(props.used ?? 0, {
  durationMs: props.durationMs
})

watch(
  () => props.used,
  (next) => {
    animateTo(Math.max(0, Math.min(next, props.limit)))
  }
)

const usageText = computed(() => `${displayed.value} / ${props.limit} tokens`)
</script>

<template>
  <div class="usage-container">
    <span class="usage" :class="{ exceeded: props.exceeded, animating: isAnimating }" aria-live="polite">{{ usageText }}</span>
    <div v-if="props.exceeded" role="alert" class="limit-alert">已達使用上限</div>
  </div>
  
</template>

<style scoped>
.usage-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage {
  color: #9aa0aa;
  font-size: 14px;
  transform: scale(1);
  transition: transform 300ms ease-out;
  will-change: transform;
}

.usage.exceeded {
  color: #ff6b6b;
  font-weight: 600;
}

.usage.animating {
  font-weight: 600;
  transform: scale(1.06);
}

.limit-alert {
  background: #3a1111;
  color: #ffb3b3;
  border: 1px solid #5a1a1a;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
}
</style>


