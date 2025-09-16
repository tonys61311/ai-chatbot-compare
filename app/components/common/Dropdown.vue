<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { generateId } from '@/utils/helpers'

type Option = { label: string; value: string }

const props = withDefaults(defineProps<{
  modelValue: string
  data: ReadonlyArray<Option>
  ariaLabel?: string
  triggerRole?: 'button' | 'combobox'
}>(), {
  triggerRole: 'button'
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)

const selected = computed(() => props.data.find(o => o.value === props.modelValue))

function toggle() {
  open.value = !open.value
}

function select(value: string) {
  if (value !== props.modelValue) emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node | null
  const trigger = triggerRef.value
  if (trigger && target && !trigger.contains(target)) {
    const panel = document.getElementById(panelId)
    if (panel && panel.contains(target)) return
    open.value = false
  }
}

const panelId = `dropdown-panel-${generateId()}`

onMounted(() => {
  window.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onClickOutside)
})

watch(() => props.modelValue, () => {
  // keep open state unchanged; tests don't require side effects here
})
</script>

<template>
  <div class="dropdown">
    <button
      ref="triggerRef"
      class="dropdown__trigger"
      type="button"
      :aria-label="ariaLabel || '選擇'"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      :role="triggerRole"
      @click="toggle"
    >
      <span class="dropdown__label">{{ selected?.label || '—' }}</span>
      <span class="dropdown__chevron" aria-hidden="true">▾</span>
    </button>

    <ul
      v-if="open"
      :id="panelId"
      class="dropdown__menu"
      role="listbox"
    >
      <li
        v-for="opt in data"
        :key="opt.value"
        role="option"
        :aria-selected="opt.value === modelValue ? 'true' : 'false'"
        class="dropdown__option"
        @click="select(opt.value)"
      >
        <span>{{ opt.label }}</span>
        <Icon v-if="opt.value === modelValue" icon="mdi:check" class="dropdown__check" aria-hidden="true" />
      </li>
    </ul>
  </div>
  
</template>

<style scoped lang="scss">
.dropdown {
  position: relative;
}

.dropdown__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 18px;
  border: 1px solid #373a46;
  background: #2a2d36;
  color: #e6e6e6;
  font-size: 13px;
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.dropdown__trigger:hover {
  background: #3a3d4a;
}

.dropdown__menu {
  position: absolute;
  margin-top: 6px;
  min-width: 170px;
  background: #2a2d36;
  border: 1px solid #373a46;
  border-radius: 8px;
  padding: 6px 6px;
  font-size: 13px;
  z-index: 10;
}

.dropdown__option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  list-style: none;
  transition: background-color 0.15s ease;
}

.dropdown__option:hover {
  background: #3a3d4a;
}

.dropdown__check {
  color: inherit;
  font-size: 16px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>


