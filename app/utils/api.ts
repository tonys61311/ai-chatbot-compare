import { ofetch } from 'ofetch'
import type { AIProviderType } from '@/types/ai'
import type { ChatBatchResponse, ModelChat, ChatResult } from '@/types/api/chat-batch'
import type { ProviderModels } from '@/types/api/provider-models'
import type { ChatStreamRequest, ChatStreamChunk } from '@/types/api/chat-stream'

interface RequestOptions {
  method: string
  body?: any
  headers?: Record<string, string>
  [key: string]: any
}

class ApiRequestBuilder {
  private url: string
  private method: string = 'GET'
  private body?: any
  private headers: Record<string, string> = {}
  private isStream: boolean = false
  private onChunk?: (chunk: any) => void
  
  constructor(url: string) {
    this.url = url
  }
  
  post(body: any): this {
    this.method = 'POST'
    this.body = body
    return this
  }
  
  stream(onChunk: (chunk: any) => void): this {
    this.isStream = true
    this.onChunk = onChunk
    return this
  }
  
  private logRequest(): void {
    console.log('🚀 API Request:', {
      url: this.url,
      method: this.method,
      body: this.body,
      isStream: this.isStream,
      timestamp: new Date().toISOString()
    })
  }

  private logResponse<T>(data: T): void {
    console.log('✅ API Response:', {
      url: this.url,
      data,
      timestamp: new Date().toISOString()
    })
  }

  private logError(error: Error): void {
    console.error('❌ API Error:', {
      url: this.url,
      error,
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
  
  async execute<T>(): Promise<T> {
    this.logRequest()
    
    if (this.isStream) {
      return this.executeStream() as Promise<T>
    }
    return this.executeStandard() as Promise<T>
  }
  
  private async executeStandard<T>(): Promise<T> {
    try {
      const response = await ofetch<{ data: T } | T>(this.url, {
        method: this.method,
        body: this.body,
        headers: this.headers
      })

      this.logResponse(response)

      if (response && typeof response === 'object' && 'data' in (response as any)) {
        return (response as any).data as T
      }
      return response as T
    } catch (error) {
      this.logError(error as Error)
      throw error
    }
  }
  
  private async executeStream(): Promise<void> {
    try {
      const response = await fetch(this.url, {
        method: this.method,
        headers: { 
          'Content-Type': 'application/json', 
          ...this.headers 
        },
        body: JSON.stringify(this.body)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let provider: string | undefined
      let content = ''
      let error: string | undefined

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            // Stream 結束時一次性打印完整回應
            this.logResponse({
              provider,
              content: content,
              error: error
            })
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6) // Remove 'data: ' prefix
              
              if (data === '[DONE]') {
                continue
              }

              try {
                const parsed: ChatStreamChunk = JSON.parse(data)
                
                // 收集 API 回應信息
                if (!provider && parsed.provider) {
                  provider = parsed.provider
                }
                if (parsed.type === 'content' && parsed.content) {
                  content += parsed.content
                }
                if (parsed.type === 'error' && parsed.error) {
                  error = parsed.error
                }
                
                this.onChunk?.(parsed)
              } catch (e) {
                console.warn('Failed to parse chunk:', data)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      this.logError(error as Error)
      throw error
    }
  }
}

class ApiClient {
  private createBuilder(url: string): ApiRequestBuilder {
    return new ApiRequestBuilder(url)
  }

  async chatBatch(chats: ModelChat[]): Promise<ChatResult[]> {
    return this.createBuilder('/api/chat-batch')
      .post(chats)
      .execute<ChatResult[]>()
  }

  async getProviderModels(providers: AIProviderType[]): Promise<ProviderModels[]> {
    return this.createBuilder('/api/provider-models')
      .post({ providers })
      .execute<ProviderModels[]>()
  }

  async chatStream(request: ChatStreamRequest, onChunk: (chunk: ChatStreamChunk) => void): Promise<void> {
    return this.createBuilder('/api/chat-stream')
      .post(request)
      .stream(onChunk)
      .execute()
  }
}

export const apiClient = new ApiClient()
