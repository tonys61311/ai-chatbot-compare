import { vi } from 'vitest'

// Mock Vue functions
global.nextTick = vi.fn((fn) => Promise.resolve().then(fn))

// Mock global functions that Nuxt auto-imports
global.useChatStore = vi.fn(() => ({
  getMessages: vi.fn(() => []),
  isLoading: vi.fn(() => false),
  send: vi.fn()
}))

global.useAutoScroll = vi.fn(() => ({
  listEl: { value: null },
  scrollToBottom: vi.fn(),
  streamToMessage: vi.fn()
}))

// Mock ref function
global.ref = vi.fn((val) => ({ value: val }))
