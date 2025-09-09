import { ref, nextTick } from 'vue'
import type { ChatMessage } from '@/types/ai'
import { sleep, htmlAwareTokenize } from '@/utils/helpers'

export function useAutoScroll() {
  const listEl = ref<HTMLElement | null>(null)

  function isAtBottom(threshold = 100) {
    const el = listEl.value
    if (!el) return false
    
    const scrollTop = el.scrollTop
    const clientHeight = el.clientHeight
    const scrollHeight = el.scrollHeight
    
    return Math.ceil(scrollTop + clientHeight) >= Math.floor(scrollHeight - threshold)
  }

  function scrollToBottom(onlyIfAtBottom = false, threshold = 100) {
    nextTick(() => {
      const el = listEl.value
      if (el && (!onlyIfAtBottom || isAtBottom(threshold))) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }

  // 串流顯示訊息
  async function streamToMessage(
    targetMessage: ChatMessage, 
    html: string, 
    delayMs = 20, 
    mode: 'auto' | 'word' | 'char' = 'auto'
  ) {
    const tokens = htmlAwareTokenize(html, mode)
    for (let i = 0; i < tokens.length; i++) {
      targetMessage.content += tokens[i]
      if (i % 3 === 0) {
        scrollToBottom(true) // 直接呼叫滾動
      }
      await sleep(delayMs)
    }
    scrollToBottom(true) // 最後一次滾動
  }

  return {
    listEl,
    isAtBottom,
    scrollToBottom,
    streamToMessage
  }
}

