<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'
import IconButton from '@/components/common/IconButton.vue'
import FileUploadDropdown from '@/components/common/FileUploadDropdown.vue'
import FilePreview from '@/components/common/FilePreview.vue'

const props = withDefaults(defineProps<{
    placeholder?: string
    send: (text: string, imgUrls: string[]) => Promise<any> | any
    sendLabel?: string
    loading?: boolean //loading若外面沒給則用裡面loading判斷
    modelValue?: string // 外部 v-model 綁定
    supportsImages?: boolean // 是否支援圖片
}>(), {
    supportsImages: false
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'file-selected': [files: FileList]
}>()

const internalInput = ref('')
const input = computed({
    get: () => props.modelValue !== undefined ? props.modelValue : internalInput.value,
    set: (value: string) => {
        if (props.modelValue !== undefined) {
            emit('update:modelValue', value)
        } else {
            internalInput.value = value
        }
    }
})
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selfLoading = ref(false)
const isComposing = ref(false) // 新增：追蹤是否正在輸入法輸入中
const selectedFiles = ref<File[]>([]) // 新增：追蹤選中的檔案

// loading 若外面沒給 (有給的話會是 boolean) 則用內部 selfLoading
const isLoading = computed(() => typeof props.loading === 'boolean' ? props.loading : selfLoading.value)

// 監聽 supportsImages 變化，當不支援圖片時清空 selectedFiles
watch(() => props.supportsImages, (newValue) => {
  if (newValue === false) {
    selectedFiles.value = []
  }
}, { immediate: true })

async function handleSend() {
    const text = input.value.trim()
    if (!text || selfLoading.value || isComposing.value) return
    
    // 準備圖片 URLs
    const imgUrls: string[] = []
    for (const file of selectedFiles.value) {
        if (file.type.startsWith('image/')) {
            const base64 = await fileToBase64(file)
            imgUrls.push(base64)
        }
    }
    
    input.value = ''
    selectedFiles.value = [] // 清空選中的檔案
    adjustTextareaHeight()
    selfLoading.value = true
    try {
        await (typeof props.send === 'function' ? props.send(text, imgUrls) : undefined)
    } finally {
        selfLoading.value = false
        await nextTick()
    }
}

function adjustTextareaHeight() {
    nextTick(() => {
        const textarea = textareaRef.value
        if (textarea) {
            textarea.style.height = 'auto'
            const newHeight = Math.min(textarea.scrollHeight, 120)
            textarea.style.height = `${newHeight}px`
        }
    })
}

// 新增：處理輸入法開始
function handleCompositionStart() {
    isComposing.value = true
}

// 新增：處理輸入法結束
function handleCompositionEnd() {
    isComposing.value = false
}

// 新增：處理 Enter 鍵，考慮輸入法狀態和 loading 狀態
function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (!isComposing.value && !isLoading.value) {
            event.preventDefault()
            handleSend()
        }
    }
}

// 處理檔案選擇
function handleFileSelected(files: FileList) {
    // 將 FileList 轉換為 File 陣列並添加到選中檔案列表
    const newFiles = Array.from(files)
    selectedFiles.value.push(...newFiles)
    emit('file-selected', files)
}

// 移除檔案
function removeFile(index: number) {
    selectedFiles.value.splice(index, 1)
}

// 檔案轉 Base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

</script>

<template>
    <div class="chat-input">
        <!-- 檔案預覽區域 -->
        <div v-if="selectedFiles.length > 0" class="file-preview-container">
            <div class="file-preview-list">
                <FilePreview
                    v-for="(file, index) in selectedFiles"
                    :key="`${file.name}-${file.size}-${index}`"
                    :file="file"
                    @remove="removeFile(index)"
                />
            </div>
        </div>
        
        <!-- 輸入區域 -->
        <div class="composer">
            <FileUploadDropdown 
                v-if="supportsImages"
                icon="mdi:plus" 
                :size="30" 
                aria-label="新增" 
                @file-selected="handleFileSelected" 
            />
            <textarea 
                class="composer__input" 
                v-model="input" 
                :placeholder="isLoading ? '請稍候…' : placeholder"
                @keydown="handleKeydown"
                @compositionstart="handleCompositionStart"
                @compositionend="handleCompositionEnd"
                rows="1" 
                ref="textareaRef" 
                @input="adjustTextareaHeight" 
            />
            <div class="composer__actions">
                <!-- 語音按鈕暫時隱藏 -->
                <!-- <IconButton icon="mdi:microphone" :size="30" ariaLabel="語音" /> -->
                <IconButton 
                    :icon="isLoading ? 'mdi:loading' : 'mdi:send'" 
                    variant="primary" 
                    :size="30" 
                    :class="{ 'spinning': isLoading }"
                    :disabled="!input.trim() || isLoading"
                    @click="handleSend" 
                    :ariaLabel="props.sendLabel || '送出'" 
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

.icon-btn {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
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
    max-height: 120px;
    overflow-y: auto;
    line-height: 1.4;
    font-family: inherit;
}

.composer__actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

// 檔案預覽區域樣式
.chat-input {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 8px;
}

.file-preview-container {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.file-preview-list {
    display: flex;
    gap: 8px;
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
    }
}

</style>