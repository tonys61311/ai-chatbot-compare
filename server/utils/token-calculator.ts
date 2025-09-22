import { encode, encodeChat } from 'gpt-tokenizer'

/**
 * 估算訊息的 token 數量
 */
export function estimateTokens(message: { role: string; content: any }, model: string): number {
  // 處理不同類型的 content
  let contentStr = ''
  if (typeof message.content === 'string') {
    contentStr = message.content
  } else if (Array.isArray(message.content)) {
    // 處理多媒體內容
    contentStr = message.content
      .map((item: any) => {
        if (item.type === 'text') return item.text
        if (item.type === 'image_url') return '[IMAGE]' // 圖片佔用固定 token
        return ''
      })
      .join('')
  } else {
    contentStr = JSON.stringify(message.content)
  }
  
  // 計算 role + content 的總 token 數
  const fullMessage = `${message.role}: ${contentStr}`
  return encode(fullMessage).length
}

/**
 * 估算多個訊息的 token 數量
 */
export function estimateMessagesTokens(messages: Array<{ role: string; content: any }>, model: string): number {
  if (messages.length === 0) {
    return 0
  }
  
  // 使用 gpt-tokenizer 的 encodeChat 函數來計算對話的 token 數
  try {
    const chatMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' 
        ? msg.content 
        : Array.isArray(msg.content) 
          ? msg.content.map((item: any) => item.type === 'text' ? item.text : '[IMAGE]').join('')
          : JSON.stringify(msg.content)
    }))
    
    const tokens = encodeChat(chatMessages)
    return tokens.length
  } catch (error) {
    // 如果 encodeChat 失敗，回退到逐個計算
    let totalTokens = 0
    
    for (const message of messages) {
      totalTokens += estimateTokens(message, model)
    }
    
    // 添加系統 token 開銷
    const systemTokens = 4
    totalTokens += systemTokens
    
    return totalTokens
  }
}

/**
 * 計算訊息的 token 數量（通用函數，適用於任何文字內容）
 */
export function countMessageTokens(text: string, model: string): number {
  return encode(text).length
}
