import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import ChatWindow from './ChatWindow.vue'
import { AIProviderType } from '@/types/ai'
import { OpenAIProviderUI, GeminiProviderUI, DeepseekProviderUI } from '@/providers/ui/providers'
import '@testing-library/jest-dom'

// Mock the store
const mockStore = {
  getMessages: vi.fn(() => []) as any,
  isLoading: vi.fn(() => false) as any,
  send: vi.fn() as any,
  getModels: vi.fn(() => []) as any,
  loadModels: vi.fn() as any
}

const mockScrollComposable = {
  listEl: { value: null },
  scrollToBottom: vi.fn() as any,
  streamToMessage: vi.fn() as any
}

describe('ChatWindow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    
    // Setup mocks
    ;(global as any).useChatStore = vi.fn(() => mockStore)
    ;(global as any).useAutoScroll = vi.fn(() => mockScrollComposable)
  })

  it('should render with provider title', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
  })

  it('should render with correct title from provider object', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
  })

  it('should display placeholder when no messages', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByText('輸入訊息開始對話')).toBeInTheDocument()
  })

  it('should render input field and send button', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByPlaceholderText('詢問任何問題')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
  })

  it('should disable send button when input is empty', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const sendButton = screen.getByRole('button', { name: '送出' })
    expect(sendButton).toBeDisabled()
  })

  it('should enable send button when input has text', async () => {
    // Ensure loading is false
    mockStore.isLoading.mockReturnValue(false)
    
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    const sendButton = screen.getByRole('button', { name: '送出' })

    await fireEvent.update(input, 'Hello world')

    expect(sendButton).not.toBeDisabled()
  })

  it('should call store.send when form is submitted', async () => {
    mockStore.isLoading.mockReturnValue(false)
    mockStore.send.mockResolvedValue({ message: { id: '1', role: 'assistant', content: '' }, content: 'Test response' })

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    const sendButton = screen.getByRole('button', { name: '送出' })

    await fireEvent.update(input, 'Hello world')
    await fireEvent.click(sendButton)

    expect(mockStore.send).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello world')
  })

  it('should clear input after sending message', async () => {
    mockStore.isLoading.mockReturnValue(false)
    mockStore.send.mockResolvedValue({ message: { id: '1', role: 'assistant', content: '' }, content: 'Test response' })

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    const sendButton = screen.getByRole('button', { name: '送出' })

    await fireEvent.update(input, 'Hello world')
    await fireEvent.click(sendButton)

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('should display loading state when store is loading', () => {
    mockStore.isLoading.mockReturnValue(true)

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByPlaceholderText('請稍候…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
  })

  it('should display messages from store', () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'Hello' },
      { id: '2', role: 'assistant' as const, content: 'Hi there!' }
    ]
    mockStore.getMessages.mockReturnValue(messages as any)

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('should handle Enter key press to send message', async () => {
    mockStore.isLoading.mockReturnValue(false)
    mockStore.send.mockResolvedValue({ message: { id: '1', role: 'assistant', content: '' }, content: 'Test response' })

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    await fireEvent.update(input, 'Hello world')
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockStore.send).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello world')
  })

  it('should not send empty message', async () => {
    mockStore.isLoading.mockReturnValue(false)
    
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockStore.send).not.toHaveBeenCalled()
  })

  it('should not send message with only whitespace', async () => {
    mockStore.isLoading.mockReturnValue(false)
    
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    const sendButton = screen.getByRole('button', { name: '送出' })

    await fireEvent.update(input, '   ')
    await fireEvent.click(sendButton)

    expect(mockStore.send).not.toHaveBeenCalled()
  })

  it('should call store.send when button is clicked', async () => {
    mockStore.isLoading.mockReturnValue(false)
    mockStore.send.mockResolvedValue({ message: { id: '1', role: 'assistant', content: '' }, content: 'Test response' })

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const input = screen.getByPlaceholderText('詢問任何問題')
    const sendButton = screen.getByRole('button', { name: '送出' })

    await fireEvent.update(input, 'Hello')
    await fireEvent.click(sendButton)

    expect(mockStore.send).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello')
  })

  it('should display different provider titles correctly', () => {
    const providers = [new OpenAIProviderUI(), new GeminiProviderUI(), new DeepseekProviderUI()]
    
    providers.forEach(p => {
      const { unmount } = render(ChatWindow, {
        props: {
          provider: p
        }
      })

      expect(screen.getByText(p.getTitle())).toBeInTheDocument()
      unmount()
    })
  })

  it('should have proper accessibility attributes', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '語音' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should display model dropdown when models are loaded', async () => {
    const models = [{ id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }]
    mockStore.getModels.mockReturnValue(models)

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    // 等待 onMounted 執行完成
    await nextTick()
    
    expect(screen.getByText('GPT-4o mini')).toBeInTheDocument()
  })

  it('should not call loadModels on mount (handled by parent)', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    expect(mockStore.loadModels).not.toHaveBeenCalled()
  })

  it('should render a model dropdown in header on the right of title', () => {
    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    const titleEl = screen.getByText('ChatGPT')
    const dropdownBtn = screen.getByRole('button', { name: '模型選擇' })
    expect(dropdownBtn).toBeInTheDocument()

    const headerEl = titleEl.closest('.chat__header')
    expect(headerEl).not.toBeNull()
    // ensure dropdown is placed within header (to the right in layout)
    expect(headerEl).toContainElement(dropdownBtn)
  })

  it('should allow selecting a model option and update the trigger label', async () => {
    const models = [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true },
      { id: 'gpt-4o', label: 'GPT-4o', default: false }
    ]
    mockStore.getModels.mockReturnValue(models)

    render(ChatWindow, {
      props: {
        provider: new OpenAIProviderUI()
      }
    })

    // 等待 onMounted 執行完成
    await nextTick()

    const dropdownBtn = screen.getByRole('button', { name: '模型選擇' })
    await fireEvent.click(dropdownBtn)

    const option = await screen.findByRole('option', { name: 'GPT-4o' })
    await fireEvent.click(option)

    expect(dropdownBtn).toHaveTextContent('GPT-4o')
  })
})
