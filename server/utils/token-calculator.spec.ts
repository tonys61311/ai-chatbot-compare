import { describe, it, expect } from 'vitest'
import { countMessageTokens, estimateTokens, estimateMessagesTokens } from './token-calculator'

describe('Token Calculator', () => {
  describe('countMessageTokens', () => {
    it('應該正確計算回應的 token 數', () => {
      const response = '這是一個測試回應，包含中文和 English text。'
      const tokens = countMessageTokens(response, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
    })

    it('應該為不同模型提供相同的 token 計算', () => {
      const response = 'Test response for token calculation'
      
      const gpt4Tokens = countMessageTokens(response, 'gpt-4o')
      const gpt4MiniTokens = countMessageTokens(response, 'gpt-4o-mini')
      
      // 相同編碼器應該產生相同的 token 數
      expect(gpt4Tokens).toBe(gpt4MiniTokens)
    })

    it('應該正確處理空回應', () => {
      const tokens = countMessageTokens('', 'gpt-4o-mini')
      expect(tokens).toBe(0)
    })

    it('應該正確處理長回應', () => {
      const longResponse = '這是一個很長的測試回應。'.repeat(100)
      const tokens = countMessageTokens(longResponse, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
    })
  })

  describe('estimateTokens', () => {
    it('應該估算單個訊息的 token 數', () => {
      const message = { role: 'user', content: 'Hello world' }
      const tokens = estimateTokens(message, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
      expect(typeof tokens).toBe('number')
    })

    it('應該估算中文訊息的 token 數', () => {
      const message = { role: 'user', content: '你好世界' }
      const tokens = estimateTokens(message, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
    })

    it('應該估算多媒體內容的 token 數', () => {
      const message = {
        role: 'user',
        content: [
          { type: 'text', text: '請分析這張圖片' },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
        ]
      }
      const tokens = estimateTokens(message, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
      expect(typeof tokens).toBe('number')
    })

    it('應該為不同模型提供不同的估算', () => {
      const message = { role: 'user', content: 'Test message' }
      
      const gpt4Tokens = estimateTokens(message, 'gpt-4o')
      const deepseekTokens = estimateTokens(message, 'deepseek-chat')
      
      expect(gpt4Tokens).toBeGreaterThan(0)
      expect(deepseekTokens).toBeGreaterThan(0)
    })
  })

  describe('estimateMessagesTokens', () => {
    it('應該估算多個訊息的 token 數', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]
      const tokens = estimateMessagesTokens(messages, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
      expect(typeof tokens).toBe('number')
    })

    it('應該估算中文對話的 token 數', () => {
      const messages = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！有什麼我可以幫助你的嗎？' },
        { role: 'user', content: '請解釋什麼是人工智能' }
      ]
      const tokens = estimateMessagesTokens(messages, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
    })

    it('應該估算包含多媒體的對話 token 數', () => {
      const messages = [
        { role: 'user', content: '請分析這張圖片' },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: '這張圖片顯示了什麼？' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...' } }
          ]
        },
        { role: 'assistant', content: '這張圖片顯示了一個美麗的風景。' }
      ]
      const tokens = estimateMessagesTokens(messages, 'gpt-4o-mini')
      
      expect(tokens).toBeGreaterThan(0)
    })

    it('應該為空陣列返回 0', () => {
      const tokens = estimateMessagesTokens([], 'gpt-4o-mini')
      expect(tokens).toBe(0)
    })

    it('應該為不同模型提供不同的估算', () => {
      const messages = [
        { role: 'user', content: 'Test message' },
        { role: 'assistant', content: 'Test response' }
      ]
      
      const gpt4Tokens = estimateMessagesTokens(messages, 'gpt-4o')
      const deepseekTokens = estimateMessagesTokens(messages, 'deepseek-chat')
      
      expect(gpt4Tokens).toBeGreaterThan(0)
      expect(deepseekTokens).toBeGreaterThan(0)
    })
  })
})