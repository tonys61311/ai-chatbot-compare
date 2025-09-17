import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { waitFor } from '@testing-library/vue'
import ChatInput from './ChatInput.vue'

describe('ChatInput', () => {
  it('應顯示 placeholder', () => {
    const send = vi.fn()
    const wrapper = mount(ChatInput, {
      props: { placeholder: '請輸入訊息', send }
    })
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('請輸入訊息')
  })

  it('send callback 應被呼叫 (同步)', async () => {
    const send = vi.fn()
    const wrapper = mount(ChatInput, {
      props: { send }
    })
    await wrapper.find('textarea').setValue('hello')
    await wrapper.find('textarea').trigger('keydown.enter')
    expect(send).toHaveBeenCalledWith('hello')
  })

  it('send callback 支援 async/await', async () => {
    const send = vi.fn(() => Promise.resolve())
    const wrapper = mount(ChatInput, {
      props: { send }
    })
    
    // 設置 input 值
    await wrapper.find('textarea').setValue('async test')
    
    // 觸發發送
    await wrapper.find('textarea').trigger('keydown.enter')
    
    // 檢查 send 被調用
    expect(send).toHaveBeenCalledWith('async test')
    
    // 等待異步操作完成
    await waitFor(() => {
      expect(send).toHaveBeenCalledTimes(1)
    })
  })

  it('input 為空時 send 按鈕 disabled', async () => {
    const send = vi.fn()
    const wrapper = mount(ChatInput, {
      props: { send }
    })
    expect(wrapper.find('[aria-label="送出"]').attributes('disabled')).toBeDefined()
    await wrapper.find('textarea').setValue('not empty')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[aria-label="送出"]').attributes('disabled')).toBeUndefined()
  })
})
