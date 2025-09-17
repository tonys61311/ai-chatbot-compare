<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import IconButton from '@/components/common/IconButton.vue'

const props = defineProps<{
    placeholder?: string
    send: (text: string) => Promise<any> | any
    sendLabel?: string
    loading?: boolean //loading若外面沒給則用裡面loading判斷
}>()

const input = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selfLoading = ref(false)
const isComposing = ref(false) // 新增：追蹤是否正在輸入法輸入中

// loading 若外面沒給 (有給的話會是 boolean) 則用內部 selfLoading
const isLoading = computed(() => typeof props.loading === 'boolean' ? props.loading : selfLoading.value)

async function handleSend() {
    const text = input.value.trim()
    if (!text || selfLoading.value || isComposing.value) return
    input.value = ''
    selfLoading.value = true
    try {
        await (typeof props.send === 'function' ? props.send(text) : undefined)
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
</script>

<template>
    <div class="composer">
        <IconButton icon="mdi:plus" :size="30" ariaLabel="新增" />
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
            <IconButton icon="mdi:microphone" :size="30" ariaLabel="語音" />
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
</style>