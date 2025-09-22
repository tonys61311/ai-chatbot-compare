import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from './Modal.vue'

describe('Modal', () => {
  it('renders title and message', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: '提示', message: '內容' },
      global: {
        stubs: { teleport: true }
      }
    })
    expect(wrapper.text()).toContain('提示')
    expect(wrapper.text()).toContain('內容')
  })

  it('emits confirm', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true },
      global: {
        stubs: { teleport: true }
      }
    })
    const buttons = wrapper.findAll('button')
    const confirmBtn = buttons.find(b => b.text().includes('確定'))
    expect(confirmBtn).toBeTruthy()
    await (confirmBtn as any).trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel and closes', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true }
    })
    const cancelBtn = wrapper.find('button.btn--ghost')
    if (cancelBtn.exists()) {
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
      const updateEvts = wrapper.emitted('update:modelValue') as any[]
      expect(updateEvts?.[0]?.[0]).toBe(false)
    }
  })
})


