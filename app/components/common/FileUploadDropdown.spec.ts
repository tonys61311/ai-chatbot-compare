import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUploadDropdown from './FileUploadDropdown.vue'

// Mock Iconify
vi.mock('@iconify/vue', () => ({
  Icon: { name: 'Icon', template: '<span data-testid="icon"></span>' }
}))

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  generateId: vi.fn(() => 'test-id-123')
}))

describe('FileUploadDropdown', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(FileUploadDropdown, {
      props: {
        icon: 'mdi:plus',
        size: 30,
        ariaLabel: '新增'
      }
    })
  })

  it('renders trigger button with correct props', () => {
    const trigger = wrapper.findComponent({ name: 'IconButton' })
    expect(trigger.exists()).toBe(true)
    expect(trigger.props('ariaLabel')).toBe('新增')
    expect(trigger.props('icon')).toBe('mdi:plus')
    expect(trigger.props('size')).toBe(30)
  })

  it('opens menu when trigger is clicked', async () => {
    const trigger = wrapper.findComponent({ name: 'IconButton' })
    await trigger.trigger('click')
    
    expect(wrapper.find('.file-upload-dropdown__menu').exists()).toBe(true)
  })

  it('shows menu options when open', async () => {
    await wrapper.findComponent({ name: 'IconButton' }).trigger('click')
    
    const options = wrapper.findAll('.file-upload-dropdown__option')
    expect(options).toHaveLength(1)
    
    expect(options[0].text()).toContain('新增照片')
  })

  it('should set file input accept to specific image types only', async () => {
    const selectFilesSpy = vi.spyOn(wrapper.vm, 'selectFiles')
    
    await wrapper.findComponent({ name: 'IconButton' }).trigger('click')
    await wrapper.find('.file-upload-dropdown__option').trigger('click')
    
    expect(selectFilesSpy).toHaveBeenCalled()
    
    // 檢查 file input 的 accept 屬性
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('accept')).toBe('image/jpeg,image/png,image/webp')
  })

  it('should only accept jpeg, png, webp files when file input is triggered', async () => {
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('accept')).toBe('image/jpeg,image/png,image/webp')
  })

  it('should have multiple attribute for selecting multiple files', () => {
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('multiple')).toBeDefined()
  })

  it('should be hidden from view', () => {
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('style')).toContain('display: none')
  })

  it('closes menu when clicking outside', async () => {
    await wrapper.findComponent({ name: 'IconButton' }).trigger('click')
    expect(wrapper.find('.file-upload-dropdown__menu').exists()).toBe(true)
    
    // Simulate clicking outside
    const outsideClick = new MouseEvent('mousedown', { bubbles: true })
    Object.defineProperty(outsideClick, 'target', {
      value: document.createElement('div')
    })
    
    window.dispatchEvent(outsideClick)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.file-upload-dropdown__menu').exists()).toBe(false)
  })

  it('calls selectFiles when option is clicked', async () => {
    const selectFilesSpy = vi.spyOn(wrapper.vm, 'selectFiles')
    
    await wrapper.findComponent({ name: 'IconButton' }).trigger('click')
    await wrapper.find('.file-upload-dropdown__option').trigger('click')
    
    expect(selectFilesSpy).toHaveBeenCalled()
  })

  it('handles file selection and emits fileSelected event', async () => {
    const mockFiles = {
      length: 2,
      0: { name: 'test1.jpg' },
      1: { name: 'test2.png' }
    } as unknown as FileList

    const fileInput = wrapper.find('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      value: mockFiles,
      writable: false
    })

    await fileInput.trigger('change')
    
    expect(wrapper.emitted('fileSelected')).toBeTruthy()
    expect(wrapper.emitted('fileSelected')[0]).toEqual([mockFiles])
  })

  it('closes menu after selecting an option', async () => {
    const mockFileInput = {
      accept: '',
      click: vi.fn(),
      value: ''
    }
    wrapper.vm.fileInputRef = mockFileInput
    
    await wrapper.findComponent({ name: 'IconButton' }).trigger('click')
    expect(wrapper.find('.file-upload-dropdown__menu').exists()).toBe(true)
    
    await wrapper.find('.file-upload-dropdown__option').trigger('click')
    expect(wrapper.find('.file-upload-dropdown__menu').exists()).toBe(false)
  })

  it('uses default props when not provided', () => {
    const defaultWrapper = mount(FileUploadDropdown)
    const trigger = defaultWrapper.findComponent({ name: 'IconButton' })
    
    expect(trigger.props('ariaLabel')).toBe('新增')
  })
})
