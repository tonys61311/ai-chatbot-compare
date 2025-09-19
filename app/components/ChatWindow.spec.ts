import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import ChatWindow from './ChatWindow.vue'
import { AIProviderType } from '@/types/ai'
import { OpenAIProviderUI, GeminiProviderUI, DeepseekProviderUI } from '@/providers/ui/providers'
import '@testing-library/jest-dom'

// Mock the store
const mockStore = {
  getMessages: vi.fn(() => []) as any,
  isLoading: vi.fn(() => false) as any,
  isStreaming: vi.fn(() => false) as any,
  send: vi.fn().mockResolvedValue({ message: { id: '1', role: 'assistant', content: 'Hello' }, content: 'Hello' }) as any,
  sendStream: vi.fn().mockResolvedValue({ message: { id: '1', role: 'assistant', content: 'Hello' }, content: 'Hello' }) as any,
  getModels: vi.fn(() => [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true, supportsImages: true },
    { id: 'gpt-4o', label: 'GPT-4o', default: false, supportsImages: true }
  ]) as any,
  loadModels: vi.fn() as any
}

const mockScrollComposable = {
  listEl: ref(null),
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

    expect(mockStore.sendStream).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello world', 'gpt-4o-mini', expect.any(Function))
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

    // 檢查按鈕是否存在（loading 狀態下按鈕應該被 disabled）
    const sendButton = screen.getByRole('button', { name: '送出' })
    expect(sendButton).toBeInTheDocument()
    expect(sendButton).toBeDisabled()
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

    expect(mockStore.sendStream).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello world', 'gpt-4o-mini', expect.any(Function))
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

    expect(mockStore.sendStream).toHaveBeenCalledWith(AIProviderType.OpenAI, 'Hello', 'gpt-4o-mini', expect.any(Function))
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
    // 語音按鈕已被隱藏，所以不應該存在
    expect(screen.queryByRole('button', { name: '語音' })).not.toBeInTheDocument()
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

  // ===== 檔案上傳測試 =====
  describe('檔案上傳功能測試', () => {
    // 注意：FileUploadDropdown 顯示測試已在 ChatInput.spec.ts 中涵蓋

    it('當模型不支援圖片時，應該隱藏 FileUploadDropdown', async () => {
      // 設置不支援圖片的模型
      mockStore.getModels.mockReturnValue([
        { id: 'deepseek-chat', label: 'DeepSeek Chat', default: true, supportsImages: false }
      ])
      
      const { container } = render(ChatWindow, {
        props: {
          provider: new OpenAIProviderUI()
        }
      })

      // 等待組件渲染完成
      await waitFor(() => {
        const fileUploadElements = container.querySelectorAll('[aria-label="新增"]')
        expect(fileUploadElements.length).toBe(0)
      })
    })
  })

  describe('圖片顯示功能測試', () => {
    it('應該顯示多媒體訊息中的圖片', () => {
      // 準備多媒體訊息數據
      const multimediaMessage = {
        id: '1',
        role: 'user' as const,
        content: [
          { type: 'text', text: '幫我描述這張圖片' },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' 
            } 
          }
        ]
      }

      mockStore.getMessages.mockReturnValue([multimediaMessage])

      const { container } = render(ChatWindow, {
        props: {
          provider: new OpenAIProviderUI()
        }
      })

      // 檢查圖片容器是否存在
      const messageImages = container.querySelector('.message-images')
      expect(messageImages).toBeInTheDocument()

      // 檢查圖片元素是否存在
      const images = container.querySelectorAll('.message-image img')
      expect(images).toHaveLength(1)
      const imageUrl = multimediaMessage.content[1]
      if (imageUrl && 'image_url' in imageUrl && imageUrl.image_url?.url) {
        expect(images[0]).toHaveAttribute('src', imageUrl.image_url.url)
      }
    })

    it('應該支援多張圖片的水平滾動', () => {
      // 準備包含多張圖片的訊息
      const multiImageMessage = {
        id: '1',
        role: 'user' as const,
        content: [
          { type: 'text', text: '這些圖片' },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,image1' 
            } 
          },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,image2' 
            } 
          },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,image3' 
            } 
          }
        ]
      }

      mockStore.getMessages.mockReturnValue([multiImageMessage])

      const { container } = render(ChatWindow, {
        props: {
          provider: new OpenAIProviderUI()
        }
      })

      // 檢查圖片容器
      const messageImages = container.querySelector('.message-images')
      expect(messageImages).toBeInTheDocument()

      // 檢查所有圖片都存在
      const images = container.querySelectorAll('.message-image')
      expect(images).toHaveLength(3)

      // 檢查圖片容器有正確的 class
      expect(messageImages).toHaveClass('message-images')
      
      // 檢查圖片元素有正確的 class
      images.forEach(img => {
        expect(img).toHaveClass('message-image')
      })
    })

    it('應該隱藏滾動條樣式', () => {
      const multimediaMessage = {
        id: '1',
        role: 'user' as const,
        content: [
          { type: 'text', text: '測試滾動條' },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,test' 
            } 
          }
        ]
      }

      mockStore.getMessages.mockReturnValue([multimediaMessage])

      const { container } = render(ChatWindow, {
        props: {
          provider: new OpenAIProviderUI()
        }
      })

      const messageImages = container.querySelector('.message-images')
      expect(messageImages).toBeInTheDocument()

      // 檢查圖片容器存在且有正確的 class
      expect(messageImages).toHaveClass('message-images')
    })

    it('應該正確顯示文字內容在圖片下方', () => {
      const multimediaMessage = {
        id: '1',
        role: 'user' as const,
        content: [
          { type: 'text', text: '這是文字內容' },
          { 
            type: 'image_url', 
            image_url: { 
              url: 'data:image/png;base64,test' 
            } 
          }
        ]
      }

      mockStore.getMessages.mockReturnValue([multimediaMessage])

      const { container } = render(ChatWindow, {
        props: {
          provider: new OpenAIProviderUI()
        }
      })

      // 檢查圖片容器存在
      const messageImages = container.querySelector('.message-images')
      expect(messageImages).toBeInTheDocument()

      // 檢查文字 bubble 存在
      const bubble = container.querySelector('.bubble')
      expect(bubble).toBeInTheDocument()
      expect(bubble).toHaveTextContent('這是文字內容')

      // 檢查圖片在文字上方（DOM 順序）
      const msg = container.querySelector('.msg')
      expect(msg).toBeInTheDocument()
      
      const imagesElement = msg!.querySelector('.message-images')
      const bubbleElement = msg!.querySelector('.bubble')
      
      expect(imagesElement).toBeInTheDocument()
      expect(bubbleElement).toBeInTheDocument()
    })
  })
})
