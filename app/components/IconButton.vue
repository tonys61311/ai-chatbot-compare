<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  icon: string
  variant?: 'default' | 'primary'
  // 單一尺寸（px）：同時決定按鈕直徑與圖標大小（圖標約為 55%）
  size?: number
  disabled?: boolean
  ariaLabel?: string
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'default',
  size: 16,
  disabled: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

function onClick(event: MouseEvent) {
  if (props.disabled) return
  emit('click', event)
}

const iconFontSizePx = computed(() => Math.max(Math.round(props.size * 0.55), 1))
const paddingPx = computed(() => Math.max(Math.floor((props.size - iconFontSizePx.value) / 2), 0))
const buttonStyle = computed(() => ({ padding: `${paddingPx.value}px` }))
const iconStyle = computed(() => ({ fontSize: `${iconFontSizePx.value}px` }))
</script>

<template>
  <button
    :type="props.type"
    class="ibtn"
    :class="[`ibtn--${props.variant}`]"
    :disabled="props.disabled"
    :aria-label="props.ariaLabel"
    :style="buttonStyle"
    @click="onClick"
  >
    <Icon :icon="props.icon" :style="iconStyle" />
    <slot />
  </button>
  
</template>

<style scoped lang="scss">
.ibtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 9999px;
  background: #24262f;
  border: 1px solid #343848;
  color: #cfd2dc;
  line-height: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.08s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #2a2d36;
    border-color: #4a5068;
  }

  &:not(:disabled):focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(74, 80, 104, 0.35);
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }
}

.ibtn--primary {
  background: #3a3f55;
  border: 1px solid #4a5068;
  color: #ffffff;

  &:not(:disabled):hover {
    background: #4a5068;
    border-color: #5a6282;
  }

  &:not(:disabled):focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(58, 63, 85, 0.35);
  }
}
</style>


