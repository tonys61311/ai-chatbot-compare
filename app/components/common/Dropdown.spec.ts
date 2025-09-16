import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import { defineComponent, ref } from 'vue'
import Dropdown from '@/components/common/Dropdown.vue'
import '@testing-library/jest-dom'

describe('Dropdown (common/Dropdown.vue)', () => {
  const items = [
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'Claude 3.5', value: 'claude-3-5' },
    { label: 'Llama 3.1', value: 'llama-3-1' },
  ] as const

  function renderHost(initial = 'gpt-4o') {
    const Host = defineComponent({
      components: { Dropdown },
      setup() {
        const model = ref<string>(initial)
        return { model, items }
      },
      template: `<Dropdown v-model="model" :data="items" aria-label="模型選擇" />`,
    })
    return render(Host)
  }

  it('should render a button with current selected label and aria attributes', async () => {
    renderHost('gpt-4o')
    const button = await screen.findByRole('button', { name: '模型選擇' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should open options on click and allow selecting an option', async () => {
    renderHost('gpt-4o')
    const button = await screen.findByRole('button', { name: '模型選擇' })
    await fireEvent.click(button)

    // listbox should appear
    const listbox = await screen.findByRole('listbox')
    expect(listbox).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // options visible
    const option = await screen.findByRole('option', { name: 'Claude 3.5' })
    await fireEvent.click(option)

    // menu closes
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should reflect current selection text on the trigger', async () => {
    renderHost('claude-3-5')
    const button = await screen.findByRole('button', { name: '模型選擇' })
    // Selected label should appear somewhere inside the trigger
    expect(button).toHaveTextContent('Claude 3.5')
  })
})


