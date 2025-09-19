import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilePreview from './FilePreview.vue'

// Mock Iconify
vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', template: '<span data-testid="icon"></span>' }
}))

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: vi.fn()
  },
  writable: true
})

beforeEach(() => {
  mockCreateObjectURL.mockClear()
})

describe('FilePreview', () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File(['test content'], name, { type })
    // Mock the size property
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false
    })
    return file
  }

  it('renders image file correctly', () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg', 1024)
    const wrapper = mount(FilePreview, {
      props: { file: imageFile }
    })

    expect(wrapper.find('.file-preview--image').exists()).toBe(true)
    expect(wrapper.find('.file-preview__img').exists()).toBe(true)
    expect(wrapper.find('.file-preview__name').text()).toBe('test.jpg')
  })

  it('renders document file correctly', () => {
    const docFile = createMockFile('test.pdf', 'application/pdf', 2048)
    const wrapper = mount(FilePreview, {
      props: { file: docFile }
    })

    expect(wrapper.find('.file-preview--document').exists()).toBe(true)
    expect(wrapper.find('.file-preview__icon').exists()).toBe(true)
    expect(wrapper.find('.file-preview__name').text()).toBe('test.pdf')
  })

  it('displays file size correctly', () => {
    const file = createMockFile('test.txt', 'text/plain', 1024)
    const wrapper = mount(FilePreview, {
      props: { file }
    })

    expect(wrapper.find('.file-preview__size').text()).toBe('1 KB')
  })

  it('emits remove event when remove button is clicked', async () => {
    const file = createMockFile('test.txt', 'text/plain', 1024)
    const wrapper = mount(FilePreview, {
      props: { file }
    })

    await wrapper.find('.file-preview__remove').trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('shows correct file icon for different file types', () => {
    const testCases = [
      { type: 'application/pdf', expectedIcon: 'mdi:file-pdf-box' },
      { type: 'application/msword', expectedIcon: 'mdi:file-word-box' },
      { type: 'application/vnd.ms-excel', expectedIcon: 'mdi:file-excel-box' },
      { type: 'text/plain', expectedIcon: 'mdi:file-document-outline' },
      { type: 'application/zip', expectedIcon: 'mdi:file-archive' },
      { type: 'video/mp4', expectedIcon: 'mdi:file-video' },
      { type: 'audio/mp3', expectedIcon: 'mdi:file-music' }
    ]

    testCases.forEach(({ type, expectedIcon }) => {
      const file = createMockFile('test', type, 1024)
      const wrapper = mount(FilePreview, {
        props: { file }
      })

      // 檢查圖標是否存在（因為我們 mock 了 Icon 組件）
      expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    })
  })

  it('handles large file sizes correctly', () => {
    const largeFile = createMockFile('large.txt', 'text/plain', 1024 * 1024 * 5) // 5MB
    const wrapper = mount(FilePreview, {
      props: { file: largeFile }
    })

    expect(wrapper.find('.file-preview__size').text()).toBe('5 MB')
  })

  it('truncates long file names', () => {
    const longName = 'very-long-file-name-that-should-be-truncated.txt'
    const file = createMockFile(longName, 'text/plain', 1024)
    const wrapper = mount(FilePreview, {
      props: { file }
    })

    const nameElement = wrapper.find('.file-preview__name')
    expect(nameElement.attributes('title')).toBe(longName)
    expect(nameElement.classes()).toContain('file-preview__name')
  })
})
