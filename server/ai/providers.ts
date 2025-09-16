import { BaseAIProvider } from './base'
import { AIProviderType } from '@/types/ai'
import type { ModelChat } from '@/types/api/chat-batch'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export class OpenAIProvider extends BaseAIProvider {
  private apiKey: string
  constructor(apiKey: string) {
    super(AIProviderType.OpenAI)
    this.apiKey = apiKey
  }
  async chat(request: ModelChat): Promise<string> {
    if (!this.apiKey) throw new Error('Missing OpenAI API key')

    try {
      const client = new OpenAI({ apiKey: this.apiKey })
      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: request.messages as any,
        ...(typeof request.temperature === 'number' ? { temperature: request.temperature } : {}),
        ...(typeof request.maxTokens === 'number' ? { max_tokens: request.maxTokens } : {})
      })

      const text = resp.choices?.[0]?.message?.content || ''
      if (!text) throw new Error('Empty response from OpenAI')
      return text
    } catch (err: any) {
      const code = err?.code || err?.status || err?.response?.status
      const apiMsg = err?.error?.message || err?.response?.data?.error?.message || err?.message
      const msg = apiMsg || 'OpenAI request failed'
      throw new Error(code ? `${msg} (code: ${code})` : msg)
    }
  }
  
}

export class GeminiProvider extends BaseAIProvider {
  private apiKey: string
  constructor(apiKey: string) {
    super(AIProviderType.Gemini)
    this.apiKey = apiKey
  }
  async chat(request: ModelChat): Promise<string> {
    if (!this.apiKey) throw new Error('Missing Gemini API key')

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const lastMessage = request.messages[request.messages.length - 1]
      if (!lastMessage) throw new Error('No messages provided')

      const result = await model.generateContent(lastMessage.content)
      const response = await result.response
      const text = response.text()

      if (!text) throw new Error('Empty response from Gemini')
      return text
    } catch (err: any) {
      const message = err?.message || err?.error?.message || 'Gemini request failed'
      throw new Error(message)
    }
  }
  
}

export class DeepseekProvider extends BaseAIProvider {
  private apiKey: string
  constructor(apiKey: string) {
    super(AIProviderType.DeepSeek)
    this.apiKey = apiKey
  }
  async chat(request: ModelChat): Promise<string> {
    if (!this.apiKey) throw new Error('Missing DeepSeek API key')

    try {
      const client = new OpenAI({ 
        apiKey: this.apiKey,
        baseURL: 'https://api.deepseek.com/v1'
      })
      
      const resp = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: request.messages as any,
        ...(typeof request.temperature === 'number' ? { temperature: request.temperature } : {}),
        ...(typeof request.maxTokens === 'number' ? { max_tokens: request.maxTokens } : {})
      })

      const text = resp.choices?.[0]?.message?.content || ''
      if (!text) throw new Error('Empty response from DeepSeek')
      return text
    } catch (err: any) {
      const code = err?.code || err?.status || err?.response?.status
      const apiMsg = err?.error?.message || err?.response?.data?.error?.message || err?.message
      const msg = apiMsg || 'DeepSeek request failed'
      throw new Error(code ? `${msg} (code: ${code})` : msg)
    }
  }
  
}


