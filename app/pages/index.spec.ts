import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import { defineComponent, ref, computed } from 'vue'
import Index from '@/pages/index.vue'
import '@testing-library/jest-dom'

// Mock the store
const mockStore = {
  initData: vi.fn(),
  isModelsLoaded: ref(true),
  getModels: vi.fn(() => [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', default: true }
  ]),
  send: vi.fn()
}

vi.mock('@/stores/chat', () => ({
  useChatStore: () => mockStore
}))

describe('Index page', () => {
  it('should render global input and send button', async () => {
    render(Index)
    
    expect(screen.getByPlaceholderText('輸入訊息同時發送給所有 AI...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '發送' })).toBeInTheDocument()
  })

  it('should clear input after sending', async () => {
    render(Index)
    
    const input = screen.getByPlaceholderText('輸入訊息同時發送給所有 AI...')
    const sendButton = screen.getByRole('button', { name: '發送' })
    
    await fireEvent.update(input, 'Test message')
    await fireEvent.click(sendButton)
    
    // 這裡會失敗，因為我們還沒有實現清空輸入功能
    expect(input).toHaveValue('')
  })
})
