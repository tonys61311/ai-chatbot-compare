import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/vue'
import CodeMarkdown from './CodeMarkdown.vue'

// Mock navigator.clipboard
const mockWriteText = vi.fn(() => Promise.resolve())
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText
  }
})

// Mock useModal
const mockModal = {
  alert: vi.fn()
}

vi.mock('@/composables/useModal', () => ({
  useModal: () => mockModal
}))

describe('CodeMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  describe('copy functionality', () => {
    it('should copy code to clipboard when copy button is clicked', async () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '```javascript\nconsole.log("hello");\n```'
        }
      })

      const copyBtn = container.querySelector('.copy-btn')
      expect(copyBtn).toBeInTheDocument()

      await fireEvent.click(copyBtn!)

      expect(mockWriteText).toHaveBeenCalledWith('console.log("hello");')
    })

    it('should show success message after copying', async () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '```javascript\nconsole.log("hello");\n```'
        }
      })

      const copyBtn = container.querySelector('.copy-btn')
      await fireEvent.click(copyBtn!)

      // Check that the button text changes to indicate success
      expect(copyBtn).toHaveTextContent('已複製!')
    })

    it('should handle copy error', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Copy failed'))

      const { container } = render(CodeMarkdown, {
        props: {
          content: '```javascript\nconsole.log("hello");\n```'
        }
      })

      const copyBtn = container.querySelector('.copy-btn')
      await fireEvent.click(copyBtn!)

      // Check that the button text changes to indicate error
      expect(copyBtn).toHaveTextContent('複製失敗')
    })

    it('should handle multiple code blocks', async () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '```javascript\nconsole.log("hello");\n```\n\n```python\nprint("world")\n```'
        }
      })

      const copyBtns = container.querySelectorAll('.copy-btn')
      expect(copyBtns).toHaveLength(2)

      await fireEvent.click(copyBtns[0]!)
      expect(mockWriteText).toHaveBeenCalledWith('console.log("hello");')

      await fireEvent.click(copyBtns[1]!)
      expect(mockWriteText).toHaveBeenCalledWith('print("world")')
    })
  })

  describe('markdown features', () => {
    it('should autolink bare URLs in paragraph and table cells', () => {
      const content = `請參考 https://picsum.photos/600/400 取得圖片\n\n| 名稱 | 連結 |\n| --- | --- |\n| Picsum | https://picsum.photos/200/300 |`

      const { container } = render(CodeMarkdown, {
        props: { content }
      })

      const pLink = container.querySelector('a[href="https://picsum.photos/600/400"]')
      expect(pLink).toBeInTheDocument()
      expect(pLink).toHaveTextContent('https://picsum.photos/600/400')

      const tLink = container.querySelector('a[href="https://picsum.photos/200/300"]')
      expect(tLink).toBeInTheDocument()
      expect(tLink).toHaveTextContent('https://picsum.photos/200/300')
    })

    it('should autolink URL inside inline code (backticks) but not code blocks', () => {
      const content = 'URL: `https://placehold.co/600x400`\n\n```\nhttps://placehold.co/700x500\n```'

      const { container } = render(CodeMarkdown, {
        props: { content }
      })

      // Inline code should contain clickable link
      const inlineLink = container.querySelector('code.code-inline a[href="https://placehold.co/600x400"]')
      expect(inlineLink).toBeInTheDocument()

      // Code block should remain plain text (no links)
      const blockLink = container.querySelector('pre.code-block a[href="https://placehold.co/700x500"]')
      expect(blockLink).not.toBeInTheDocument()
    })

    it('should autolink multiple inline-code URLs in sequence within blockquotes', () => {
      const content = `> \`https://via.placeholder.com/300x200\`\n\n> \`https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Hello+World\``

      const { container } = render(CodeMarkdown, { props: { content } })

      const a1 = container.querySelector('a[href="https://via.placeholder.com/300x200"]')
      const a2 = container.querySelector('a[href="https://via.placeholder.com/600x400/FF5733/FFFFFF?text=Hello+World"]')

      expect(a1).toBeInTheDocument()
      expect(a2).toBeInTheDocument()
    })
    it('should render deepseek table content without [object Object]', () => {
      const content = `這些服務可以讓你透過調整網址中的尺寸參數來獲得任意大小的圖片。

| 服務名稱 | 範例 URL | 說明 |
| :--- | :--- | :--- |
| **Picsum.photos** | https://picsum.photos/200/300 | 傳回一張 200x300 像素的隨機圖片。 |
|  | https://picsum.photos/seed/picsum/600/400 | 傳回一張基於特定種子（seed）的固定圖片，尺寸為 600x400。 |
| **Placeholder.com** | https://via.placeholder.com/350x150 | 傳回一張 350x150 像素的灰色圖片，上面會有尺寸文字。 |
|  | https://via.placeholder.com/468x60/FF0000/FFFFFF?text=Ad+Banner | 自訂顏色和文字。格式：寬x高/背景色/文字顏色?text=你的文字 |
| **Dummyimage.com** | https://dummyimage.com/250x100/0000ff/ffffff.png&text=Hello | 功能與 Placeholder 類似，可自訂顏色和文字。 |`

      const { container } = render(CodeMarkdown, {
        props: { content }
      })

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
      expect(container.textContent).not.toContain('[object Object]')
      expect(container.textContent).toContain('Picsum.photos')
    })
    it('should render bold and italic text', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: 'This is **bold** and *italic* text'
        }
      })

      const bold = container.querySelector('strong')
      const italic = container.querySelector('em')
      
      expect(bold).toBeInTheDocument()
      expect(bold).toHaveTextContent('bold')
      expect(italic).toBeInTheDocument()
      expect(italic).toHaveTextContent('italic')
    })

    it('should render headers of different levels', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '# H1\n## H2\n### H3\n#### H4'
        }
      })

      expect(container.querySelector('h1')).toBeInTheDocument()
      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('h3')).toBeInTheDocument()
      expect(container.querySelector('h4')).toBeInTheDocument()
    })

    it('should render blockquotes', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '> This is a blockquote'
        }
      })

      const blockquote = container.querySelector('blockquote')
      expect(blockquote).toBeInTheDocument()
      expect(blockquote).toHaveTextContent('This is a blockquote')
    })

    it('should render horizontal rules', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: 'Text above\n\n---\n\nText below'
        }
      })

      const hr = container.querySelector('hr')
      expect(hr).toBeInTheDocument()
    })

    it('should render tables', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'
        }
      })

      const table = container.querySelector('table')
      
      expect(table).toBeInTheDocument()
      // Note: Table rendering might depend on markdown parser configuration
      // This test verifies the table element exists
    })

    it('should render strikethrough text', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: 'This is ~~strikethrough~~ text'
        }
      })

      const del = container.querySelector('del')
      expect(del).toBeInTheDocument()
      expect(del).toHaveTextContent('strikethrough')
    })

    it('should render code blocks with different languages', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '```python\nprint("hello")\n```\n\n```javascript\nconsole.log("world")\n```'
        }
      })

      const codeBlocks = container.querySelectorAll('pre code')
      expect(codeBlocks).toHaveLength(2)
    })

    it('should render nested lists', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '1. First item\n   1. Nested item 1\n   2. Nested item 2\n2. Second item'
        }
      })

      const ol = container.querySelector('ol')
      const nestedOl = container.querySelector('ol ol')
      
      expect(ol).toBeInTheDocument()
      expect(nestedOl).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle undefined content', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: undefined as any
        }
      })

      expect(container.textContent?.trim()).toBe('')
    })

    it('should handle null content', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: null as any
        }
      })

      expect(container.textContent?.trim()).toBe('')
    })

    it('should handle content with only whitespace', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '   \n\n  \t  '
        }
      })

      expect(container.textContent?.trim()).toBe('')
    })

    it('should handle malformed markdown', () => {
      const { container } = render(CodeMarkdown, {
        props: {
          content: '**unclosed bold\n\n```unclosed code block'
        }
      })

      // Should not throw error and render what it can
      expect(container).toBeInTheDocument()
    })
  })
})
