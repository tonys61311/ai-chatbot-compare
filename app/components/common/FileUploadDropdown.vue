<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { generateId } from '@/utils/helpers'
import IconButton from './IconButton.vue'

const props = withDefaults(defineProps<{
  icon?: string
  size?: number
  ariaLabel?: string
  variant?: 'default' | 'primary'
}>(), {
  icon: 'mdi:plus',
  size: 30,
  ariaLabel: '新增',
  variant: 'default'
})

const emit = defineEmits<{
  (e: 'fileSelected', files: FileList): void
}>()

const open = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const panelId = `file-upload-panel-${generateId()}`

function toggle() {
  open.value = !open.value
}

function onClickOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node | null
  const trigger = (triggerRef.value as any)?.$el || triggerRef.value
  if (trigger && target && !trigger.contains(target)) {
    const panel = document.getElementById(panelId)
    if (panel && panel.contains(target)) return
    open.value = false
  }
}

function selectFiles() {
  if (fileInputRef.value) {
    // accept 屬性已經在模板中設定為 'image/*'，這裡不需要重複設定
    fileInputRef.value.click()
  }
  open.value = false
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('fileSelected', target.files)
  }
  // 清空 input 值，讓同一個檔案可以再次選擇
  target.value = ''
}

onMounted(() => {
  window.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onClickOutside)
})
</script>

<template>
  <div class="file-upload-dropdown">
    <IconButton
      ref="triggerRef"
      :icon="icon"
      :size="size"
      :aria-label="ariaLabel"
      :variant="variant"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="toggle"
    />

    <ul
      v-if="open"
      :id="panelId"
      class="file-upload-dropdown__menu"
      role="menu"
    >
      <li
        role="menuitem"
        class="file-upload-dropdown__option"
        @click="selectFiles"
      >
        <Icon icon="mdi:file-plus" class="file-upload-dropdown__icon" aria-hidden="true" />
        <span>新增照片</span>
      </li>
    </ul>

    <!-- 隱藏的檔案輸入 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<style scoped lang="scss">
.file-upload-dropdown {
  position: relative;
}


.file-upload-dropdown__menu {
  position: absolute;
  bottom: 100%;
  margin-bottom: 12px;
  min-width: 170px;
  background: #2a2d36;
  border: 1px solid #373a46;
  border-radius: 8px;
  padding: 6px;
  font-size: 13px;
  z-index: 10;
  list-style: none;
}

.file-upload-dropdown__option {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: #3a3d4a;
  }
}

.file-upload-dropdown__icon {
  color: inherit;
  font-size: 16px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
