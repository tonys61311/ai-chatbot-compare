// 工具函數

/**
 * 延遲執行
 * @param ms 延遲毫秒數
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * HTML 感知的文本分詞
 * @param text 要分詞的文本
 * @param mode 分詞模式
 * @returns 分詞後的字符串數組
 */
export function htmlAwareTokenize(text: string, mode: 'auto' | 'word' | 'char'): string[] {
  if (mode === 'char') return text.split('')
  if (mode === 'word') return text.split(/(\s+)/).filter(Boolean)
  
  // auto mode: 智能分詞
  const tokens: string[] = []
  let current = ''
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!
    current += char
    
    // 遇到標點符號、空格、換行時分割
    if (/[。！？，、；：\s\n]/.test(char)) {
      if (current.trim()) tokens.push(current)
      current = ''
    }
    // 中文字符每2-3個字分割一次
    else if (/[\u4e00-\u9fff]/.test(char) && current.length >= 2) {
      tokens.push(current)
      current = ''
    }
  }
  
  if (current.trim()) tokens.push(current)
  return tokens
}

/**
 * 生成唯一 ID
 * @returns 基於時間戳的字符串 ID
 */
export function generateId(): string {
  return Date.now().toString()
}

/**
 * HTML 轉義
 * @param s 要轉義的字符串
 * @returns 轉義後的字符串
 */
export function escapeHtml(s: string): string {
  return s
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;')
    .replaceAll(/\"/g, '&quot;')
    .replaceAll(/'/g, '&#39;')
}

/**
 * 轉換響應文本格式
 * @param text 原始文本
 * @returns 轉換後的 HTML 文本
 */
export function transformResponse(text: string): string {
  const responseArray = text.split('**')
  const newResponse = responseArray.map((e, i) => (i === 0 || i % 2 !== 1) ? e : ('<b>' + e + '</b>')).join('')
  const newResponse2 = newResponse.split('*').join('<br/>')
  return newResponse2
}

/**
 * 保留空格的詞彙分詞
 * @param text 要分詞的文本
 * @returns 分詞後的字符串數組
 */
export function tokenizeWordsPreserveSpaces(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0)
}
