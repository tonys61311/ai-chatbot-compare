import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import CodeMarkdown from './CodeMarkdown.vue'

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

describe('CodeMarkdown', () => {
  it('should render basic markdown content', () => {
    const { getByText, container } = render(CodeMarkdown, {
      props: {
        content: '# Hello World\n\nThis is a **bold** text.'
      }
    })

    expect(getByText('Hello World')).toBeInTheDocument()
    expect(container.textContent).toContain('This is a bold text.')
  })

  it('should render code blocks with copy button', () => {
    const { container } = render(CodeMarkdown, {
      props: {
        content: '```javascript\nconsole.log("hello");\n```'
      }
    })

    const codeWrapper = container.querySelector('.code-wrapper')
    const copyBtn = container.querySelector('.copy-btn')
    
    expect(codeWrapper).toBeInTheDocument()
    expect(copyBtn).toBeInTheDocument()
    expect(copyBtn).toHaveTextContent('複製')
  })

  it('should render inline code', () => {
    const { container } = render(CodeMarkdown, {
      props: {
        content: 'Use `const x = 1` for variables'
      }
    })

    const inlineCode = container.querySelector('.code-inline')
    expect(inlineCode).toBeInTheDocument()
    expect(inlineCode).toHaveTextContent('const x = 1')
  })

  it('should render links', () => {
    const { getByRole } = render(CodeMarkdown, {
      props: {
        content: '[Google](https://google.com)'
      }
    })

    const link = getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://google.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveTextContent('Google')
  })

  it('should render lists', () => {
    const { container } = render(CodeMarkdown, {
      props: {
        content: '* Item 1\n* Item 2\n* Item 3'
      }
    })

    const list = container.querySelector('ul')
    const items = container.querySelectorAll('li')
    
    expect(list).toBeInTheDocument()
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Item 1')
  })

  it('should sanitize dangerous HTML', () => {
    const { container } = render(CodeMarkdown, {
      props: {
        content: '<script>alert("xss")</script>Safe content'
      }
    })

    expect(container.innerHTML).not.toContain('<script>')
    expect(container.innerHTML).toContain('Safe content')
  })

  it('should handle empty content', () => {
    const { container } = render(CodeMarkdown, {
      props: {
        content: ''
      }
    })

    expect(container.textContent?.trim()).toBe('')
  })
})
