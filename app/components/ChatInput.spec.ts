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
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter' })
    expect(send).toHaveBeenCalledWith('hello', [])
  })

  it('send callback 支援 async/await', async () => {
    const send = vi.fn(() => Promise.resolve())
    const wrapper = mount(ChatInput, {
      props: { send }
    })
    
    // 設置 input 值
    await wrapper.find('textarea').setValue('async test')
    
    // 觸發發送
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter' })
    
    // 檢查 send 被調用
    expect(send).toHaveBeenCalledWith('async test', [])
    
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

  // ===== 中文輸入法測試 =====
  describe('中文輸入法 (IME) 測試', () => {
    it('輸入法輸入過程中按 Enter 不應發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      
      // 模擬輸入法開始
      await textarea.trigger('compositionstart')
      
      // 設置輸入值
      await textarea.setValue('你好')
      
      // 在輸入法輸入過程中按 Enter
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 應該不會發送
      expect(send).not.toHaveBeenCalled()
    })

    it('輸入法結束後按 Enter 應該發送完整文字', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      
      // 模擬輸入法開始
      await textarea.trigger('compositionstart')
      
      // 設置輸入值
      await textarea.setValue('你好')
      
      // 模擬輸入法結束
      await textarea.trigger('compositionend')
      
      // 輸入法結束後按 Enter
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 應該發送完整文字
      expect(send).toHaveBeenCalledWith('你好', [])
    })

    it('混合中英文輸入應該正確處理', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      
      // 先輸入英文
      await textarea.setValue('hello')
      
      // 模擬輸入法開始輸入中文
      await textarea.trigger('compositionstart')
      await textarea.setValue('hello你好')
      
      // 輸入法結束
      await textarea.trigger('compositionend')
      
      // 按 Enter 發送
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 應該發送完整文字
      expect(send).toHaveBeenCalledWith('hello你好', [])
    })

    it('Shift+Enter 應該換行而不發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('hello')
      
      // 按 Shift+Enter
      await textarea.trigger('keydown', { 
        key: 'Enter', 
        shiftKey: true 
      })
      
      // 應該不會發送
      expect(send).not.toHaveBeenCalled()
    })

    it('Ctrl+Enter 應該不發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('hello')
      
      // 按 Ctrl+Enter
      await textarea.trigger('keydown', { 
        key: 'Enter', 
        ctrlKey: true 
      })
      
      // 應該不會發送
      expect(send).not.toHaveBeenCalled()
    })

    it('loading 狀態下不應發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send, loading: true }
      })
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('hello')
      
      // 按 Enter
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 應該不會發送
      expect(send).not.toHaveBeenCalled()
    })

    it('空文字時不應發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('   ') // 只有空白
      
      // 按 Enter
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 應該不會發送
      expect(send).not.toHaveBeenCalled()
    })
  })

  // ===== v-model 測試 =====
  describe('v-model 測試', () => {
    it('應該支援外部 v-model 綁定', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { 
          send,
          modelValue: '外部輸入值'
        }
      })
      
      const textarea = wrapper.find('textarea')
      expect(textarea.element.value).toBe('外部輸入值')
      
      // 修改輸入值
      await textarea.setValue('修改後的值')
      
      // 檢查是否觸發了 update:modelValue 事件
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['修改後的值'])
    })

    it('沒有 v-model 時應該使用內部狀態', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      
      // 修改輸入值
      await textarea.setValue('內部輸入值')
      
      // 檢查內部狀態
      expect(textarea.element.value).toBe('內部輸入值')
      
      // 不應該觸發 update:modelValue 事件
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('v-model 綁定時發送後應該清空外部值', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { 
          send,
          modelValue: '要發送的值'
        }
      })
      
      const textarea = wrapper.find('textarea')
      
      // 發送訊息
      await textarea.trigger('keydown', { key: 'Enter' })
      
      // 檢查是否觸發了清空事件
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    })
  })

  // ===== 按鈕測試 =====
  describe('按鈕功能測試', () => {
    it('點擊發送按鈕應該發送', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const textarea = wrapper.find('textarea')
      await textarea.setValue('hello')
      
      // 點擊發送按鈕
      await wrapper.find('[aria-label="送出"]').trigger('click')
      
      // 應該發送
      expect(send).toHaveBeenCalledWith('hello', [])
    })

    it('loading 狀態下按鈕應該顯示 loading 圖標', () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send, loading: true }
      })
      
      const button = wrapper.find('[aria-label="送出"]')
      expect(button.classes()).toContain('spinning')
    })

    it('loading 狀態下按鈕應該被禁用', () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send, loading: true }
      })
      
      const button = wrapper.find('[aria-label="送出"]')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  // ===== 檔案上傳測試 =====
  describe('檔案上傳功能測試', () => {
    it('應該渲染 FileUploadDropdown 組件', () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const fileUploadDropdown = wrapper.findComponent({ name: 'FileUploadDropdown' })
      expect(fileUploadDropdown.exists()).toBe(true)
      expect(fileUploadDropdown.props('icon')).toBe('mdi:plus')
      expect(fileUploadDropdown.props('size')).toBe(30)
      expect(fileUploadDropdown.props('ariaLabel')).toBe('新增')
    })

    it('檔案選擇時應該觸發 file-selected 事件', async () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const mockFiles = {
        length: 2,
        0: { name: 'test1.jpg' },
        1: { name: 'test2.png' }
      } as unknown as FileList
      
      // 通過 FileUploadDropdown 組件觸發檔案選擇事件
      const fileUploadDropdown = wrapper.findComponent({ name: 'FileUploadDropdown' })
      await fileUploadDropdown.vm.$emit('file-selected', mockFiles)
      
      // 檢查是否觸發了 file-selected 事件
      expect(wrapper.emitted('file-selected')).toBeTruthy()
      expect(wrapper.emitted('file-selected')?.[0]).toEqual([mockFiles])
    })

    it('FileUploadDropdown 應該正確傳遞 props', () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      const fileUploadDropdown = wrapper.findComponent({ name: 'FileUploadDropdown' })
      expect(fileUploadDropdown.props()).toMatchObject({
        icon: 'mdi:plus',
        size: 30,
        ariaLabel: '新增'
      })
    })
  })

  describe('語音按鈕測試', () => {
    it('語音按鈕應該被隱藏', () => {
      const send = vi.fn()
      const wrapper = mount(ChatInput, {
        props: { send }
      })
      
      // 檢查語音按鈕不存在
      const microphoneButtons = wrapper.findAllComponents({ name: 'IconButton' }).filter(btn => 
        btn.props('icon') === 'mdi:microphone'
      )
      expect(microphoneButtons).toHaveLength(0)
    })
  })
})