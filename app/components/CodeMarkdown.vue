<template>
  <div ref="root" class="markdown-content" @click="onRootClick">
    <div v-html="sanitizedHtml" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const props = defineProps<{
  /** Raw markdown string returned by your AI API */
  content: string
}>()

const root = ref<HTMLElement | null>(null)

// Configure marked with syntax highlighting
marked.setOptions({
  breaks: false, // Keep line breaks as-is for code blocks
  gfm: true, // GitHub Flavored Markdown
  pedantic: false,
})

// Custom renderer for enhanced code blocks
const renderer = new marked.Renderer()

// Code block renderer with copy functionality
renderer.code = function({ text, lang }) {
  const language = lang || 'text'
  const id = `code-${Math.random().toString(36).substr(2, 9)}`
  
  // Normalize tabs to 4 spaces to ensure consistent visual indentation across browsers
  const normalizedCode = (text ?? '').replace(/\t/g, '    ')
  
  // Highlight the code using highlight.js
  let highlightedCode = normalizedCode
  if (lang && hljs.getLanguage(lang)) {
    try {
      highlightedCode = hljs.highlight(normalizedCode, { language: lang }).value
    } catch (err) {
      console.warn('Highlight.js error:', err)
      highlightedCode = hljs.highlightAuto(normalizedCode).value
    }
  } else {
    try {
      highlightedCode = hljs.highlightAuto(normalizedCode).value
    } catch (err) {
      console.warn('Highlight.js auto error:', err)
    }
  }
  
  return `
    <div class="code-wrapper">
      <div class="code-header">
        <span class="code-lang">${language.toUpperCase()}</span>
        <button class="copy-btn" data-code-id="${id}" title="複製代碼">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          複製
        </button>
      </div>
      <pre class="code-block" id="${id}"><code class="hljs language-${language}">${highlightedCode}</code></pre>
    </div>
  `
}

// Inline code renderer
renderer.codespan = function({ text }) {
  return `<code class="code-inline">${text}</code>`
}

// Link renderer with security
renderer.link = function({ href, title, tokens }) {
  const text = tokens.map(t => 'text' in t ? t.text : '').join('')
  const safeHref = href?.startsWith('javascript:') ? '#' : href
  return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" title="${title || ''}">${text}</a>`
}

// Image renderer with lazy loading
renderer.image = function({ href, title, text }) {
  return `<img src="${href}" alt="${text || ''}" title="${title || ''}" loading="lazy" class="markdown-image" />`
}

// Table renderer with enhanced styling
renderer.table = function({ header, rows }) {
  const bodyRows = rows.map(row => `<tr>${row}</tr>`).join('')
  return `
    <div class="table-wrapper">
      <table class="markdown-table">
        <thead>${header}</thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  `
}

// Set custom renderer
marked.use({ renderer })

// Render markdown to HTML
const renderedHtml = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content) as string
})

// Sanitize HTML using DOMPurify
const sanitizedHtml = computed(() => {
  if (!renderedHtml.value) return ''
  
  return DOMPurify.sanitize(renderedHtml.value, {
    USE_PROFILES: { html: true, svg: true },
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'del', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'button', 'svg', 'path'],
    ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'loading', 'class', 'id', 'data-*', 'target', 'rel', 'type', 'width', 'height', 'viewBox', 'fill', 'd'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onload', 'onerror', 'onmouseover', 'onclick', 'onchange'],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true, // Keep all content including whitespace
  })
})

// Vue 事件委派：處理 copy 按鈕點擊
function onRootClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (!target) return
  const btn = target.closest('.copy-btn') as HTMLButtonElement | null
  if (!btn) return
  const wrapper = btn.closest('.code-wrapper')
  const block = wrapper?.querySelector('.code-block') as HTMLElement | null
  if (!block) return

  const originalText = btn.textContent
  ;(async () => {
    try {
      await navigator.clipboard.writeText(block.textContent || '')
      btn.textContent = '已複製!'
      btn.classList.add('copied')
      setTimeout(() => {
        btn.textContent = originalText || '複製'
        btn.classList.remove('copied')
      }, 2000)
    } catch (err) {
      console.error('複製失敗:', err)
      btn.textContent = '複製失敗'
      btn.classList.add('failed')
      setTimeout(() => {
        btn.textContent = '複製'
        btn.classList.remove('failed')
      }, 2000)
    }
  })()
}
</script>

<style scoped lang="scss">
.markdown-content {
  // Double lock whitespace for code blocks to avoid external CSS overriding
  :deep(pre.code-block),
  :deep(pre.code-block code) {
    white-space: pre !important;
    overflow-x: auto;
    word-break: normal;
    overflow-wrap: normal;
    tab-size: 4;
  }
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.5;
  color: #e6e6e6;
  word-wrap: break-word;
  margin: 0;
  padding: 0;
  
  // Headers
  :deep(h1) {
    font-size: 2rem;
    font-weight: 700;
    margin: 2rem 0 1rem 0;
    color: #ffffff;
    border-bottom: 2px solid #333;
    padding-bottom: 0.5rem;
    line-height: 1.2;
  }
  
  :deep(h2) {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem 0;
    color: #ffffff;
    line-height: 1.3;
  }
  
  :deep(h3) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.25rem 0 0.5rem 0;
    color: #ffffff;
    line-height: 1.4;
  }
  
  :deep(h4) {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: #f0f0f0;
  }
  
  :deep(h5) {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.75rem 0 0.25rem 0;
    color: #f0f0f0;
  }
  
  :deep(h6) {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0.5rem 0 0.25rem 0;
    color: #f0f0f0;
  }
  
  // Paragraphs
  :deep(p) {
    margin: 0.125rem 0;
    line-height: 1.5;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  // Links
  :deep(a) {
    color: #60a5fa;
    text-decoration: underline;
    transition: color 0.2s ease;
    
    &:hover {
      color: #93c5fd;
    }
    
    &:visited {
      color: #a78bfa;
    }
  }
  
  // Lists
  :deep(ul), :deep(ol) {
    margin: 0.25rem 0;
    padding-left: 1.25rem;
    
    li {
      margin: 0.0625rem 0;
    }
  }
  
  :deep(ul) {
    list-style-type: disc;
    
    ul {
      list-style-type: circle;
      margin: 0.25rem 0;
      
      ul {
        list-style-type: square;
      }
    }
  }
  
  :deep(ol) {
    list-style-type: decimal;
    
    ol {
      list-style-type: lower-alpha;
      margin: 0.25rem 0;
      
      ol {
        list-style-type: lower-roman;
      }
    }
  }
  
  // Task lists
  :deep(ul.contains-task-list) {
    list-style: none;
    padding-left: 0;
    
    li {
      display: flex;
      align-items: flex-start;
      margin: 0.5rem 0;
      
      input[type="checkbox"] {
        margin-right: 0.5rem;
        margin-top: 0.2rem;
      }
    }
  }
  
  // Text formatting
  :deep(strong) {
    font-weight: 600;
    color: #ffffff;
  }
  
  :deep(em) {
    font-style: italic;
    color: #d1d5db;
  }
  
  :deep(del) {
    text-decoration: line-through;
    color: #9ca3af;
  }
  
  // Code blocks
  :deep(.code-wrapper) {
    margin: 0.5rem 0;
    border-radius: 8px;
    overflow: hidden;
    background: #1e1e1e;
    border: 1px solid #333;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  :deep(.code-header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #2d2d2d;
    border-bottom: 1px solid #333;
    font-size: 12px;
  }
  
  :deep(.code-lang) {
    color: #888;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  :deep(.copy-btn) {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #404040;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #555;
    }
    
    &.copied {
      background: #4CAF50;
    }
    
    &.failed {
      background: #f44336;
    }
    
    svg {
      flex-shrink: 0;
    }
  }
  
  :deep(.code-block) {
    margin: 0;
    padding: 16px;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre !important;
    tab-size: 4;
    text-indent: 0;
    text-align: left;
    word-wrap: break-word;
    
    // Custom scrollbar
    scrollbar-width: thin;
    scrollbar-color: #3a3f55 transparent;
    
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #3a3f55;
      border-radius: 3px;
      
      &:hover {
        background: #4a5068;
      }
    }
    
    code {
      background: transparent !important;
      padding: 0 !important;
      font-size: inherit;
      color: inherit;
      white-space: inherit !important;
      tab-size: inherit;
      text-indent: inherit;
    }
  }
  
  // Inline code
  :deep(.code-inline) {
    background: #2d2d2d;
    color: #e6e6e6;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.9em;
    font-variant-ligatures: none;
    white-space: nowrap;
  }
  
  // Blockquotes
  :deep(blockquote) {
    margin: 0.5rem 0;
    padding: 0.375rem 0.5rem;
    border-left: 4px solid #60a5fa;
    background: #1a1a1a;
    border-radius: 0 4px 4px 0;
    font-style: italic;
    color: #d1d5db;
    
    p {
      margin: 0;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  // Tables
  :deep(.table-wrapper) {
    margin: 0.5rem 0;
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #333;
  }
  
  :deep(.markdown-table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
    background: #1e1e1e;
    
    th, td {
      padding: 12px 16px;
      border: 1px solid #333;
      text-align: left;
    }
    
    th {
      background: #2d2d2d;
      font-weight: 600;
      color: #ffffff;
    }
    
    tr:nth-child(even) {
      background: #1a1a1a;
    }
    
    tr:hover {
      background: #252525;
    }
  }
  
  // Images
  :deep(.markdown-image) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 0.25rem 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  // Horizontal rules
  :deep(hr) {
    border: none;
    height: 1px;
    background: #333;
    margin: 0.5rem 0;
  }
  
  // Highlight.js syntax highlighting styles
  :deep(.hljs) {
    background: #1e1e1e !important;
    color: #d4d4d4 !important;
  }
  
  :deep(.hljs-comment,
  .hljs-quote) {
    color: #6a9955;
    font-style: italic;
  }
  
  :deep(.hljs-keyword,
  .hljs-selector-tag,
  .hljs-subst) {
    color: #569cd6;
    font-weight: bold;
  }
  
  :deep(.hljs-number,
  .hljs-literal,
  .hljs-variable,
  .hljs-template-variable,
  .hljs-tag .hljs-attr) {
    color: #b5cea8;
  }
  
  :deep(.hljs-string,
  .hljs-doctag) {
    color: #ce9178;
  }
  
  :deep(.hljs-title,
  .hljs-section,
  .hljs-selector-id) {
    color: #dcdcaa;
    font-weight: bold;
  }
  
  :deep(.hljs-subst) {
    font-weight: normal;
  }
  
  :deep(.hljs-type,
  .hljs-class .hljs-title) {
    color: #4ec9b0;
    font-weight: bold;
  }
  
  :deep(.hljs-tag,
  .hljs-name,
  .hljs-attribute) {
    color: #569cd6;
    font-weight: normal;
  }
  
  :deep(.hljs-regexp,
  .hljs-link) {
    color: #d16969;
  }
  
  :deep(.hljs-symbol,
  .hljs-bullet) {
    color: #dcdcaa;
  }
  
  :deep(.hljs-built_in,
  .hljs-builtin-name) {
    color: #4ec9b0;
  }
  
  :deep(.hljs-meta) {
    color: #569cd6;
  }
  
  :deep(.hljs-deletion) {
    background: #fdd;
  }
  
  :deep(.hljs-addition) {
    background: #dfd;
  }
  
  :deep(.hljs-emphasis) {
    font-style: italic;
  }
  
  :deep(.hljs-strong) {
    font-weight: bold;
  }
  
  // Responsive design
  @media (max-width: 768px) {
    :deep(.code-block) {
      font-size: 12px;
      padding: 12px;
    }
    
    :deep(.markdown-table) {
      font-size: 14px;
      
      th, td {
        padding: 8px 12px;
      }
    }
    
    :deep(h1) {
      font-size: 1.75rem;
    }
    
    :deep(h2) {
      font-size: 1.375rem;
    }
    
    :deep(h3) {
      font-size: 1.125rem;
    }
  }
}
</style>