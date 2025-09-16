import { ofetch } from 'ofetch'
import type { AIProviderType } from '@/types/ai'
import type { ChatBatchResponse, ModelChat, ChatResult } from '@/types/api/chat-batch'
import type { ProviderModels } from '@/types/api/provider-models'

interface ApiRequest {
  url: string
  method: string
  body?: any
}

interface ApiResponse<T = any> {
  url: string
  data: T
}

interface ApiError {
  url: string
  error: Error
}

class ApiClient {
  private logRequest(request: ApiRequest): void {
    console.log('🚀 API Request:', {
      url: request.url,
      method: request.method,
      body: request.body,
      timestamp: new Date().toISOString()
    })
  }

  private logResponse<T>(response: ApiResponse<T>): void {
    console.log('✅ API Response:', {
      url: response.url,
      data: response.data,
      timestamp: new Date().toISOString()
    })
  }

  private logError(error: ApiError): void {
    console.error('❌ API Error:', {
      url: error.url,
      error: error.error,
      message: error.error.message,
      timestamp: new Date().toISOString()
    })
  }

  private async makeRequest<T>(
    url: string, 
    method: string, 
    body?: any, 
    options?: any
  ): Promise<T> {
    const request: ApiRequest = {
      url,
      method,
      body
    }

    this.logRequest(request)

    try {
      const response = await ofetch<{ data: T } | T>(url, {
        method,
        body,
        ...options
      })

      this.logResponse({
        url,
        data: response
      })

      if (response && typeof response === 'object' && 'data' in (response as any)) {
        return (response as any).data as T
      }
      return response as T
    } catch (error) {
      this.logError({
        url,
        error: error as Error
      })
      throw error
    }
  }

  async chatBatch(chats: ModelChat[]): Promise<ChatResult[]> {
    return this.makeRequest<ChatResult[]>('/api/chat-batch', 'POST', chats)
  }

  async getProviderModels(providers: AIProviderType[]): Promise<ProviderModels[]> {
    return this.makeRequest<ProviderModels[]>('/api/provider-models', 'POST', {
      providers
    })
  }
}

export const apiClient = new ApiClient()
