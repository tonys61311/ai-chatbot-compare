import { encoding_for_model, get_encoding } from 'tiktoken'

// 模型對應的 tiktoken 編碼器
const MODEL_ENCODINGS: Record<string, string> = {
  // OpenAI models
  'gpt-4o': 'o200k_base',
  'gpt-4o-mini': 'o200k_base',
  'gpt-4': 'cl100k_base',
  'gpt-3.5-turbo': 'cl100k_base',
  
  // DeepSeek models (使用 GPT-4 編碼器)
  'deepseek-chat': 'cl100k_base',
  'deepseek-coder': 'cl100k_base',
  
  // Gemini models (使用通用編碼器)
  'gemini-1.5-flash': 'cl100k_base',
  'gemini-1.5-pro': 'cl100k_base'
}

// 緩存編碼器實例
const encodingCache = new Map<string, any>()

function getEncoding(model: string) {
  if (encodingCache.has(model)) {
    return encodingCache.get(model)
  }
  
  try {
    const encodingName = MODEL_ENCODINGS[model] || 'cl100k_base'
    // 直接使用編碼器名稱，而不是嘗試通過模型名稱獲取
    const encoding = get_encoding(encodingName as any)
    encodingCache.set(model, encoding)
    return encoding
  } catch (error) {
    // 如果編碼器不支援，使用通用編碼器
    console.warn(`Encoding ${MODEL_ENCODINGS[model] || 'cl100k_base'} not supported for model ${model}, using cl100k_base encoding`)
    const fallbackEncoding = get_encoding('cl100k_base')
    encodingCache.set(model, fallbackEncoding)
    return fallbackEncoding
  }
}

/**
 * 估算訊息的 token 數量
 */
export function estimateTokens(message: { role: string; content: any }, model: string): number {
  const encoding = getEncoding(model)
  
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
  return encoding.encode(fullMessage).length
}

/**
 * 估算多個訊息的 token 數量
 */
export function estimateMessagesTokens(messages: Array<{ role: string; content: any }>, model: string): number {
  if (messages.length === 0) {
    return 0
  }
  
  let totalTokens = 0
  
  // 計算每個訊息的 token 數
  for (const message of messages) {
    totalTokens += estimateTokens(message, model)
  }
  
  // 添加系統提示的 token 數（通常約 4-10 tokens）
  const systemTokens = 4
  totalTokens += systemTokens
  
  return totalTokens
}

/**
 * 計算訊息的 token 數量（通用函數，適用於任何文字內容）
 */
export function countMessageTokens(text: string, model: string): number {
  const encoding = getEncoding(model)
  return encoding.encode(text).length
}