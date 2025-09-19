<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import IconButton from './IconButton.vue'

const props = defineProps<{
  file: File
  onRemove?: () => void
}>()

const emit = defineEmits<{
  remove: []
}>()

const isImage = computed(() => {
  return props.file?.type?.startsWith('image/') || false
})

const fileSize = computed(() => {
  const bytes = props.file?.size || 0
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
})

const imageUrl = computed(() => {
  if (isImage.value && props.file) {
    return URL.createObjectURL(props.file)
  }
  return null
})

function handleRemove() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  emit('remove')
}
</script>

<template>
  <div class="file-preview" :class="{ 'file-preview--image': isImage, 'file-preview--document': !isImage }">
    <div class="file-preview__content">
      <!-- 圖片預覽 -->
      <div v-if="isImage" class="file-preview__image">
        <img :src="imageUrl || ''" :alt="file.name" class="file-preview__img" />
      </div>
      
      <!-- 文件預覽 -->
      <div v-else class="file-preview__document">
        <Icon :icon="getFileIcon(file.type)" class="file-preview__icon" />
      </div>
      
      <!-- 檔案資訊 -->
      <div class="file-preview__info">
        <div class="file-preview__name" :title="file.name">{{ file.name }}</div>
        <div class="file-preview__size">{{ fileSize }}</div>
      </div>
    </div>
    
    <!-- 移除按鈕 -->
    <IconButton 
      icon="mdi:close"
      :size="12"
      :aria-label="`移除 ${file.name}`"
      class="file-preview__remove"
      @click="handleRemove"
    />
  </div>
</template>

<script lang="ts">
// 根據檔案類型返回對應的圖標
function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'mdi:file'
  if (mimeType.includes('pdf')) return 'mdi:file-pdf-box'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'mdi:file-word-box'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'mdi:file-excel-box'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'mdi:file-powerpoint-box'
  if (mimeType.includes('text')) return 'mdi:file-document-outline'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'mdi:file-archive'
  if (mimeType.includes('video')) return 'mdi:file-video'
  if (mimeType.includes('audio')) return 'mdi:file-music'
  return 'mdi:file'
}
</script>

<style scoped lang="scss">
.file-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #373a46;
  border-radius: 8px;
  position: relative;
  /* min-width: 200px; */
  /* max-width: 200px; */
  flex-shrink: 0;
}

.file-preview--image {
  padding: 4px;
}

.file-preview--document {
  padding: 8px 12px;
}

.file-preview__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-preview__image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.file-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview__document {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3d4a;
  border-radius: 6px;
  flex-shrink: 0;
}

.file-preview__icon {
  font-size: 20px;
  color: #cfd2dc;
}

.file-preview__info {
  flex: 1;
  min-width: 0;
}

.file-preview__name {
  font-size: 13px;
  color: #e6e6e6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.file-preview__size {
  font-size: 11px;
  color: #9ca3af;
}

.file-preview__remove {
  position: absolute;
  top: 2px;
  right: 2px;
}
</style>
