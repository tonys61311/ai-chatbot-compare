import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider, GeminiProvider, DeepseekProvider } from './providers'
import { AIProviderType } from '@/types/ai'
import type { ModelChat, ChatMessageAPI } from '@/types/api/chat-batch'

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
}

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}))

// Mock Google Generative AI
const mockGeminiModel = {
  generateContent: vi.fn(),
  generateContentStream: vi.fn()
}

const mockGeminiAI = {
  getGenerativeModel: vi.fn(() => mockGeminiModel)
}

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => mockGeminiAI)
}))

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OpenAIProvider', () => {
    let provider: OpenAIProvider

    beforeEach(() => {
      provider = new OpenAIProvider('test-openai-key')
    })

    it('should create provider with correct type', () => {
      expect(provider.type).toBe(AIProviderType.OpenAI)
      // apiKey is protected, so we can't access it directly in tests
    })

    describe('chat', () => {
      it('should handle successful chat request', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 1000
        }

        const mockResponse = {
          choices: [{ message: { content: 'Hello there!' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Hello there!')
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      it('should handle string content messages', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Test message' }],
          model: 'gpt-4o'
        }

        const mockResponse = {
          choices: [{ message: { content: 'Response' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Response')
      })

      it('should handle array content messages', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Hello' },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }
            ]
          }],
          model: 'gpt-4o'
        }

        const mockResponse = {
          choices: [{ message: { content: 'Response' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Response')
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Hello' },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }
            ]
          }]
        })
      })

      it('should handle missing API key', async () => {
        const providerWithoutKey = new OpenAIProvider('')
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        }

        await expect(providerWithoutKey.chat(mockRequest)).rejects.toThrow('Missing OpenAI API key')
      })

      it('should handle empty response', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        }

        const mockResponse = {
          choices: [{ message: { content: '' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        await expect(provider.chat(mockRequest)).rejects.toThrow('Empty response from OpenAI')
      })

      it('should handle API errors with code', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        }

        const error = new Error('API Error')
        ;(error as any).code = 429
        ;(error as any).error = { message: 'Rate limit exceeded' }

        mockOpenAI.chat.completions.create.mockRejectedValue(error)

        await expect(provider.chat(mockRequest)).rejects.toThrow('Rate limit exceeded (code: 429)')
      })

      it('should handle API errors without code', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.OpenAI,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gpt-4o'
        }

        const error = new Error('Network error')
        mockOpenAI.chat.completions.create.mockRejectedValue(error)

        await expect(provider.chat(mockRequest)).rejects.toThrow('Network error')
      })
    })

    describe('streamChat', () => {
      it('should handle successful stream', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const mockStream = [
          { choices: [{ delta: { content: 'Hello' } }] },
          { choices: [{ delta: { content: ' there' } }] },
          { choices: [{ delta: { content: '!' } }] }
        ]

        const mockAsyncGenerator = {
          [Symbol.asyncIterator]: async function* () {
            for (const chunk of mockStream) {
              yield chunk
            }
          }
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockAsyncGenerator)

        const chunks = []
        for await (const chunk of provider.streamChat(messages, 'gpt-4o')) {
          chunks.push(chunk)
        }

        expect(chunks).toEqual([
          { content: 'Hello' },
          { content: ' there' },
          { content: '!' }
        ])
      })

      it('should handle stream errors', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const error = new Error('Stream error')
        ;(error as any).code = 500

        mockOpenAI.chat.completions.create.mockRejectedValue(error)

        await expect(async () => {
          for await (const _ of provider.streamChat(messages, 'gpt-4o')) {
            // This should not be reached
          }
        }).rejects.toThrow('Stream error (code: 500)')
      })
    })
  })

  describe('GeminiProvider', () => {
    let provider: GeminiProvider

    beforeEach(() => {
      provider = new GeminiProvider('test-gemini-key')
    })

    it('should create provider with correct type', () => {
      expect(provider.type).toBe(AIProviderType.Gemini)
      // apiKey is protected, so we can't access it directly in tests
    })

    describe('chat', () => {
      it('should handle successful chat request', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro'
        }

        const mockResponse = {
          text: vi.fn(() => 'Hello there!')
        }

        mockGeminiModel.generateContent.mockResolvedValue({
          response: mockResponse
        })

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Hello there!')
        expect(mockGeminiAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' })
      })

      it('should handle string content messages', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{ role: 'user', content: 'Test message' }],
          model: 'gemini-pro'
        }

        const mockResponse = {
          text: vi.fn(() => 'Response')
        }

        mockGeminiModel.generateContent.mockResolvedValue({
          response: mockResponse
        })

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Response')
      })

      it('should handle array content messages with text and images', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Hello' },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,test' } }
            ]
          }],
          model: 'gemini-pro'
        }

        const mockResponse = {
          text: vi.fn(() => 'Response')
        }

        mockGeminiModel.generateContent.mockResolvedValue({
          response: mockResponse
        })

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Response')
      })

      it('should handle missing API key', async () => {
        const providerWithoutKey = new GeminiProvider('')
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro'
        }

        await expect(providerWithoutKey.chat(mockRequest)).rejects.toThrow('Missing Gemini API key')
      })

      it('should handle empty response', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro'
        }

        const mockResponse = {
          text: vi.fn(() => '')
        }

        mockGeminiModel.generateContent.mockResolvedValue({
          response: mockResponse
        })

        await expect(provider.chat(mockRequest)).rejects.toThrow('Empty response from Gemini')
      })

      it('should handle API errors', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.Gemini,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'gemini-pro'
        }

        const error = new Error('API Error')
        mockGeminiModel.generateContent.mockRejectedValue(error)

        await expect(provider.chat(mockRequest)).rejects.toThrow('API Error')
      })
    })

    describe('streamChat', () => {
      it('should handle successful stream', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const mockStream = [
          { text: vi.fn(() => 'Hello') },
          { text: vi.fn(() => ' there') },
          { text: vi.fn(() => '!') }
        ]

        const mockAsyncGenerator = {
          [Symbol.asyncIterator]: async function* () {
            for (const chunk of mockStream) {
              yield chunk
            }
          }
        }

        mockGeminiModel.generateContentStream.mockResolvedValue({
          stream: mockAsyncGenerator
        })

        const chunks = []
        for await (const chunk of provider.streamChat(messages, 'gemini-pro')) {
          chunks.push(chunk)
        }

        expect(chunks).toEqual([
          { content: 'Hello' },
          { content: ' there' },
          { content: '!' }
        ])
      })

      it('should handle stream errors', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const error = new Error('Stream error')

        mockGeminiModel.generateContentStream.mockRejectedValue(error)

        await expect(async () => {
          for await (const _ of provider.streamChat(messages, 'gemini-pro')) {
            // This should not be reached
          }
        }).rejects.toThrow('Stream error')
      })
    })
  })

  describe('DeepseekProvider', () => {
    let provider: DeepseekProvider

    beforeEach(() => {
      provider = new DeepseekProvider('test-deepseek-key')
    })

    it('should create provider with correct type', () => {
      expect(provider.type).toBe(AIProviderType.DeepSeek)
      // apiKey is protected, so we can't access it directly in tests
    })

    describe('chat', () => {
      it('should handle successful chat request', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.DeepSeek,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'deepseek-chat',
          temperature: 0.7,
          maxTokens: 1000
        }

        const mockResponse = {
          choices: [{ message: { content: 'Hello there!' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        const result = await provider.chat(mockRequest)

        expect(result).toBe('Hello there!')
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      it('should handle missing API key', async () => {
        const providerWithoutKey = new DeepseekProvider('')
        const mockRequest: ModelChat = {
          provider: AIProviderType.DeepSeek,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'deepseek-chat'
        }

        await expect(providerWithoutKey.chat(mockRequest)).rejects.toThrow('Missing DeepSeek API key')
      })

      it('should handle empty response', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.DeepSeek,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'deepseek-chat'
        }

        const mockResponse = {
          choices: [{ message: { content: '' } }]
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse)

        await expect(provider.chat(mockRequest)).rejects.toThrow('Empty response from DeepSeek')
      })

      it('should handle API errors', async () => {
        const mockRequest: ModelChat = {
          provider: AIProviderType.DeepSeek,
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'deepseek-chat'
        }

        const error = new Error('API Error')
        ;(error as any).code = 429

        mockOpenAI.chat.completions.create.mockRejectedValue(error)

        await expect(provider.chat(mockRequest)).rejects.toThrow('API Error (code: 429)')
      })
    })

    describe('streamChat', () => {
      it('should handle successful stream', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const mockStream = [
          { choices: [{ delta: { content: 'Hello' } }] },
          { choices: [{ delta: { content: ' there' } }] }
        ]

        const mockAsyncGenerator = {
          [Symbol.asyncIterator]: async function* () {
            for (const chunk of mockStream) {
              yield chunk
            }
          }
        }

        mockOpenAI.chat.completions.create.mockResolvedValue(mockAsyncGenerator)

        const chunks = []
        for await (const chunk of provider.streamChat(messages, 'deepseek-chat')) {
          chunks.push(chunk)
        }

        expect(chunks).toEqual([
          { content: 'Hello' },
          { content: ' there' }
        ])
      })

      it('should handle stream errors', async () => {
        const messages: ChatMessageAPI[] = [{ role: 'user', content: 'Hello' }]
        const error = new Error('Stream error')

        mockOpenAI.chat.completions.create.mockRejectedValue(error)

        await expect(async () => {
          for await (const _ of provider.streamChat(messages, 'deepseek-chat')) {
            // This should not be reached
          }
        }).rejects.toThrow('Stream error')
      })
    })
  })
})
