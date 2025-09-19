import { BaseAIProvider, StreamChunk } from './base'
import { AIProviderType } from '@/types/ai'
import type { ModelChat } from '@/types/api/chat-batch'
import type { ChatMessageAPI } from '@/types/api/chat-batch'
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
      
      // 處理多媒體內容
      const processedMessages = request.messages.map(msg => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content }
        }
        
        // 處理多媒體內容
        return {
          role: msg.role,
          content: msg.content.map(item => {
            if (item.type === 'text') {
              return { type: 'text', text: item.text }
            } else if (item.type === 'image_url') {
              return {
                type: 'image_url',
                image_url: { url: item.image_url?.url }
              }
            }
            return item
          })
        }
      })
      
      const resp = await client.chat.completions.create({
        model: request.model,
        messages: processedMessages as any,
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

  async *streamChat(messages: ChatMessageAPI[], model: string, options?: { temperature?: number; maxTokens?: number }): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) throw new Error('Missing OpenAI API key')

    try {
      const client = new OpenAI({ apiKey: this.apiKey })
      
      // 處理多媒體內容
      const processedMessages = messages.map(msg => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content }
        }
        
        // 處理多媒體內容
        return {
          role: msg.role,
          content: msg.content.map(item => {
            if (item.type === 'text') {
              return { type: 'text', text: item.text }
            } else if (item.type === 'image_url') {
              return {
                type: 'image_url',
                image_url: { url: item.image_url?.url }
              }
            }
            return item
          })
        }
      })
      
      const stream = await client.chat.completions.create({
        model,
        messages: processedMessages as any,
        stream: true,
        ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options?.maxTokens === 'number' ? { max_tokens: options.maxTokens } : {})
      })

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          yield { content }
        }
      }
    } catch (err: any) {
      const code = err?.code || err?.status || err?.response?.status
      const apiMsg = err?.error?.message || err?.response?.data?.error?.message || err?.message
      const msg = apiMsg || 'OpenAI stream request failed'
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
      const model = genAI.getGenerativeModel({ model: request.model })

      const lastMessage = request.messages[request.messages.length - 1]
      if (!lastMessage) throw new Error('No messages provided')

      // 處理多媒體內容
      let content
      if (typeof lastMessage.content === 'string') {
        content = lastMessage.content
      } else {
        // 轉換為 Gemini 格式
        const parts = []
        for (const item of lastMessage.content) {
          if (item.type === 'text' && item.text) {
            parts.push({ text: item.text })
          } else if (item.type === 'image_url') {
            // 從 data URL 中提取 base64 和 mime type
            const dataUrl = item.image_url?.url || ''
            const [header, base64Data] = dataUrl.split(',')
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
            
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            })
          }
        }
        content = parts
      }

      const result = await model.generateContent(content)
      const response = await result.response
      const text = response.text()

      if (!text) throw new Error('Empty response from Gemini')
      return text
    } catch (err: any) {
      const message = err?.message || err?.error?.message || 'Gemini request failed'
      throw new Error(message)
    }
  }

  async *streamChat(messages: ChatMessageAPI[], model: string, options?: { temperature?: number; maxTokens?: number }): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) throw new Error('Missing Gemini API key')

    try {
      const genAI = new GoogleGenerativeAI(this.apiKey)
      const genModel = genAI.getGenerativeModel({ 
        model,
        generationConfig: {
          ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
          ...(typeof options?.maxTokens === 'number' ? { maxOutputTokens: options.maxTokens } : {})
        }
      })

      const lastMessage = messages[messages.length - 1]
      if (!lastMessage) throw new Error('No messages provided')

      // 處理多媒體內容
      let content
      if (typeof lastMessage.content === 'string') {
        content = lastMessage.content
      } else {
        // 轉換為 Gemini 格式
        const parts = []
        for (const item of lastMessage.content) {
          if (item.type === 'text' && item.text) {
            parts.push({ text: item.text })
          } else if (item.type === 'image_url') {
            // 從 data URL 中提取 base64 和 mime type
            const dataUrl = item.image_url?.url || ''
            const [header, base64Data] = dataUrl.split(',')
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
            
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            })
          }
        }
        content = parts
      }

      const result = await genModel.generateContentStream(content)
      
      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          yield { content: text }
        }
      }
    } catch (err: any) {
      const message = err?.message || err?.error?.message || 'Gemini stream request failed'
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
      
      // 處理多媒體內容
      const processedMessages = request.messages.map(msg => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content }
        }
        
        // 處理多媒體內容
        return {
          role: msg.role,
          content: msg.content.map(item => {
            if (item.type === 'text') {
              return { type: 'text', text: item.text }
            } else if (item.type === 'image_url') {
              return {
                type: 'image_url',
                image_url: { url: item.image_url?.url }
              }
            }
            return item
          })
        }
      })
      
      const resp = await client.chat.completions.create({
        model: request.model,
        messages: processedMessages as any,
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

  async *streamChat(messages: ChatMessageAPI[], model: string, options?: { temperature?: number; maxTokens?: number }): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) throw new Error('Missing DeepSeek API key')

    try {
      const client = new OpenAI({ 
        apiKey: this.apiKey,
        baseURL: 'https://api.deepseek.com/v1'
      })
      
      // 處理多媒體內容
      const processedMessages = messages.map(msg => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, content: msg.content }
        }
        
        // 處理多媒體內容
        return {
          role: msg.role,
          content: msg.content.map(item => {
            if (item.type === 'text') {
              return { type: 'text', text: item.text }
            } else if (item.type === 'image_url') {
              return {
                type: 'image_url',
                image_url: { url: item.image_url?.url }
              }
            }
            return item
          })
        }
      })
      
      const stream = await client.chat.completions.create({
        model,
        messages: processedMessages as any,
        stream: true,
        ...(typeof options?.temperature === 'number' ? { temperature: options.temperature } : {}),
        ...(typeof options?.maxTokens === 'number' ? { max_tokens: options.maxTokens } : {})
      })

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          yield { content }
        }
      }
    } catch (err: any) {
      const code = err?.code || err?.status || err?.response?.status
      const apiMsg = err?.error?.message || err?.response?.data?.error?.message || err?.message
      const msg = apiMsg || 'DeepSeek stream request failed'
      throw new Error(code ? `${msg} (code: ${code})` : msg)
    }
  }
  
}


