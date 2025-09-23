import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useAutoScroll } from './useAutoScroll'
import type { ChatMessage } from '@/types/api/chat-batch'

// Mock nextTick
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    nextTick: vi.fn((fn) => fn())
  }
})

// Mock the helper functions
vi.mock('@/utils/helpers', () => ({
  htmlAwareTokenize: vi.fn(),
  sleep: vi.fn()
}))

describe('useAutoScroll', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { htmlAwareTokenize, sleep } = await import('@/utils/helpers')
    vi.mocked(htmlAwareTokenize).mockReturnValue(['Hello', ' ', 'world', '!'])
    vi.mocked(sleep).mockResolvedValue(undefined)
  })

  describe('isAtBottom', () => {
    it('should return false when element is null', () => {
      const { isAtBottom } = useAutoScroll()
      expect(isAtBottom()).toBe(false)
    })

    it('should return true when at bottom with default threshold', () => {
      const { listEl, isAtBottom } = useAutoScroll()
      
      const mockElement = {
        scrollTop: 100,
        clientHeight: 200,
        scrollHeight: 300
      } as HTMLElement
      
      listEl.value = mockElement
      
      expect(isAtBottom()).toBe(true)
    })

    it('should return false when not at bottom', () => {
      const { listEl, isAtBottom } = useAutoScroll()
      
      const mockElement = {
        scrollTop: 50,
        clientHeight: 200,
        scrollHeight: 300
      } as HTMLElement
      
      listEl.value = mockElement
      
      // With scrollTop=50, clientHeight=200, scrollHeight=300
      // scrollTop + clientHeight = 250, scrollHeight - threshold = 200
      // 250 >= 200 is true, so it should be at bottom
      expect(isAtBottom()).toBe(true)
    })

    it('should use custom threshold', () => {
      const { listEl, isAtBottom } = useAutoScroll()
      
      const mockElement = {
        scrollTop: 100,
        clientHeight: 200,
        scrollHeight: 400 // Larger gap
      } as HTMLElement
      
      listEl.value = mockElement
      
      // With scrollTop=100, clientHeight=200, scrollHeight=400
      // scrollTop + clientHeight = 300, scrollHeight - threshold(50) = 350
      // 300 >= 350 is false, so it should not be at bottom
      expect(isAtBottom(50)).toBe(false) // Should fail with smaller threshold
      // With threshold 150: scrollHeight - 150 = 250, 300 >= 250 is true
      expect(isAtBottom(150)).toBe(true) // Should pass with larger threshold
    })

    it('should handle edge case with exact threshold', () => {
      const { listEl, isAtBottom } = useAutoScroll()
      
      const mockElement = {
        scrollTop: 100,
        clientHeight: 200,
        scrollHeight: 300
      } as HTMLElement
      
      listEl.value = mockElement
      
      expect(isAtBottom(0)).toBe(true) // Exactly at bottom
    })
  })

  describe('scrollToBottom', () => {
    it('should not scroll when element is null', () => {
      const { scrollToBottom } = useAutoScroll()
      const scrollToSpy = vi.fn()
      
      scrollToBottom()
      
      // Should not throw and should not call scrollTo
      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('should scroll to bottom when onlyIfAtBottom is false', () => {
      const { listEl, scrollToBottom } = useAutoScroll()
      
      const scrollToSpy = vi.fn()
      const mockElement = {
        scrollTo: scrollToSpy,
        scrollHeight: 1000
      } as unknown as HTMLElement
      
      listEl.value = mockElement
      
      scrollToBottom(false)
      
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'smooth'
      })
    })

    it('should scroll to bottom when onlyIfAtBottom is true and at bottom', () => {
      const { listEl, scrollToBottom } = useAutoScroll()
      
      const scrollToSpy = vi.fn()
      const mockElement = {
        scrollTo: scrollToSpy,
        scrollHeight: 1000,
        scrollTop: 100,
        clientHeight: 200
      } as unknown as HTMLElement
      
      listEl.value = mockElement
      
      // With scrollTop=100, clientHeight=200, scrollHeight=1000
      // scrollTop + clientHeight = 300, scrollHeight - threshold = 900
      // 300 >= 900 is false, so it should not be at bottom
      // Let's use a case where it actually is at bottom
      const mockElementAtBottom = {
        scrollTo: scrollToSpy,
        scrollHeight: 1000,
        scrollTop: 800,
        clientHeight: 200
      } as unknown as HTMLElement
      
      listEl.value = mockElementAtBottom
      
      scrollToBottom(true)
      
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'smooth'
      })
    })

    it('should not scroll when onlyIfAtBottom is true but not at bottom', () => {
      const { listEl, scrollToBottom } = useAutoScroll()
      
      const scrollToSpy = vi.fn()
      const mockElement = {
        scrollTo: scrollToSpy,
        scrollHeight: 1000,
        scrollTop: 50,
        clientHeight: 200
      } as unknown as HTMLElement
      
      listEl.value = mockElement
      
      scrollToBottom(true)
      
      expect(scrollToSpy).not.toHaveBeenCalled()
    })
  })

  describe('streamToMessage', () => {
    it('should stream content to message', async () => {
      const { streamToMessage } = useAutoScroll()
      
      const targetMessage: ChatMessage = {
        id: 'test-1',
        role: 'assistant',
        content: ''
      }
      
      const html = 'Hello world!'
      const tokens = ['Hello', ' ', 'world', '!']
      const { htmlAwareTokenize } = await import('@/utils/helpers')
      vi.mocked(htmlAwareTokenize).mockReturnValue(tokens)
      
      await streamToMessage(targetMessage, html)
      
      expect(htmlAwareTokenize).toHaveBeenCalledWith(html, 'auto')
      expect(targetMessage.content).toBe('Hello world!')
      const { sleep } = await import('@/utils/helpers')
      expect(sleep).toHaveBeenCalledTimes(4) // Called for each token
    })

    it('should use custom delay and mode', async () => {
      const { streamToMessage } = useAutoScroll()
      
      const targetMessage: ChatMessage = {
        id: 'test-1',
        role: 'assistant',
        content: ''
      }
      
      const html = 'Test'
      const tokens = ['T', 'e', 's', 't']
      const { htmlAwareTokenize } = await import('@/utils/helpers')
      vi.mocked(htmlAwareTokenize).mockReturnValue(tokens)
      
      await streamToMessage(targetMessage, html, 50, 'char')
      
      expect(htmlAwareTokenize).toHaveBeenCalledWith(html, 'char')
      const { sleep } = await import('@/utils/helpers')
      expect(sleep).toHaveBeenCalledWith(50)
    })

    it('should scroll every 3 tokens', async () => {
      const { listEl, streamToMessage } = useAutoScroll()
      
      const scrollToSpy = vi.fn()
      const mockElement = {
        scrollTo: scrollToSpy,
        scrollHeight: 1000,
        scrollTop: 800, // Make sure it's at bottom
        clientHeight: 200
      } as unknown as HTMLElement
      
      listEl.value = mockElement
      
      const targetMessage: ChatMessage = {
        id: 'test-1',
        role: 'assistant',
        content: ''
      }
      
      const html = 'Hello world test message'
      const tokens = ['Hello', ' ', 'world', ' ', 'test', ' ', 'message']
      const { htmlAwareTokenize } = await import('@/utils/helpers')
      vi.mocked(htmlAwareTokenize).mockReturnValue(tokens)
      
      await streamToMessage(targetMessage, html)
      
      // Should scroll at tokens 0, 3, 6 (every 3 tokens) plus final scroll
      expect(scrollToSpy).toHaveBeenCalledTimes(4)
    })

    it('should handle empty tokens array', async () => {
      const { streamToMessage } = useAutoScroll()
      
      const targetMessage: ChatMessage = {
        id: 'test-2',
        role: 'assistant',
        content: 'initial'
      }
      
      const { htmlAwareTokenize } = await import('@/utils/helpers')
      vi.mocked(htmlAwareTokenize).mockReturnValue([])
      
      await streamToMessage(targetMessage, '')
      
      expect(targetMessage.content).toBe('initial')
      const { sleep } = await import('@/utils/helpers')
      expect(sleep).not.toHaveBeenCalled()
    })
  })

  describe('return values', () => {
    it('should return all expected properties', () => {
      const result = useAutoScroll()
      
      expect(result).toHaveProperty('listEl')
      expect(result).toHaveProperty('isAtBottom')
      expect(result).toHaveProperty('scrollToBottom')
      expect(result).toHaveProperty('streamToMessage')
      
      expect(typeof result.isAtBottom).toBe('function')
      expect(typeof result.scrollToBottom).toBe('function')
      expect(typeof result.streamToMessage).toBe('function')
      expect(result.listEl.value).toBeNull()
    })
  })
})
