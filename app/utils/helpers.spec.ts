import { describe, it, expect, vi } from 'vitest'
import { sleep, htmlAwareTokenize, generateId, escapeHtml } from './helpers'

describe('helpers', () => {
  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now()
      await sleep(10)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(9) // Allow some tolerance
    })

    it('should resolve immediately for 0ms', async () => {
      const start = Date.now()
      await sleep(0)
      const end = Date.now()
      
      expect(end - start).toBeLessThan(5) // Should be very fast
    })
  })

  describe('htmlAwareTokenize', () => {
    describe('char mode', () => {
      it('should split text into individual characters', () => {
        const result = htmlAwareTokenize('hello', 'char')
        expect(result).toEqual(['h', 'e', 'l', 'l', 'o'])
      })

      it('should handle empty string', () => {
        const result = htmlAwareTokenize('', 'char')
        expect(result).toEqual([])
      })

      it('should handle special characters', () => {
        const result = htmlAwareTokenize('a@#$', 'char')
        expect(result).toEqual(['a', '@', '#', '$'])
      })
    })

    describe('word mode', () => {
      it('should split text by whitespace', () => {
        const result = htmlAwareTokenize('hello world test', 'word')
        expect(result).toEqual(['hello', ' ', 'world', ' ', 'test'])
      })

      it('should handle multiple spaces', () => {
        const result = htmlAwareTokenize('hello   world', 'word')
        expect(result).toEqual(['hello', '   ', 'world'])
      })

      it('should handle empty string', () => {
        const result = htmlAwareTokenize('', 'word')
        expect(result).toEqual([])
      })

      it('should filter out empty strings', () => {
        const result = htmlAwareTokenize('  hello  ', 'word')
        expect(result).toEqual(['  ', 'hello', '  '])
      })
    })

    describe('auto mode', () => {
      it('should split on punctuation and spaces', () => {
        const result = htmlAwareTokenize('Hello, world! How are you?', 'auto')
        expect(result).toEqual(['Hello, ', 'world! ', 'How ', 'are ', 'you?'])
      })

      it('should split on Chinese punctuation', () => {
        const result = htmlAwareTokenize('你好，世界！你好嗎？', 'auto')
        expect(result).toEqual(['你好', '，', '世界', '！', '你好', '嗎？'])
      })

      it('should split Chinese characters every 2-3 characters', () => {
        const result = htmlAwareTokenize('這是一個測試', 'auto')
        expect(result).toEqual(['這是', '一個', '測試'])
      })

      it('should handle mixed Chinese and English', () => {
        const result = htmlAwareTokenize('Hello 你好 world 世界', 'auto')
        expect(result).toEqual(['Hello ', '你好', 'world ', '世界'])
      })

      it('should handle newlines and special characters', () => {
        const result = htmlAwareTokenize('Hello\nworld; test:', 'auto')
        expect(result).toEqual(['Hello\n', 'world; ', 'test:'])
      })

      it('should handle empty string', () => {
        const result = htmlAwareTokenize('', 'auto')
        expect(result).toEqual([])
      })

      it('should trim whitespace from tokens', () => {
        const result = htmlAwareTokenize('  hello  ,  world  ', 'auto')
        expect(result).toEqual(['hello ', ', ', 'world '])
      })

      it('should handle single character', () => {
        const result = htmlAwareTokenize('a', 'auto')
        expect(result).toEqual(['a'])
      })

      it('should handle only punctuation', () => {
        const result = htmlAwareTokenize('!@#$%', 'auto')
        expect(result).toEqual(['!@#$%'])
      })
    })
  })

  describe('generateId', () => {
    it('should generate string ID based on timestamp', () => {
      const id1 = generateId()
      
      expect(typeof id1).toBe('string')
      expect(/^\d+$/.test(id1)).toBe(true)
    })

    it('should generate numeric string', () => {
      const id = generateId()
      expect(/^\d+$/.test(id)).toBe(true)
    })

    it('should generate different IDs for different calls', async () => {
      const ids = new Set()
      for (let i = 0; i < 5; i++) {
        ids.add(generateId())
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 2))
      }
      expect(ids.size).toBe(5)
    })
  })

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('should escape less than', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('should escape greater than', () => {
      expect(escapeHtml('>')).toBe('&gt;')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("'hello'")).toBe('&#39;hello&#39;')
    })

    it('should escape all special characters', () => {
      const input = '<script>alert("xss")</script>'
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      expect(escapeHtml(input)).toBe(expected)
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should handle string without special characters', () => {
      expect(escapeHtml('hello world')).toBe('hello world')
    })

    it('should handle multiple occurrences', () => {
      const input = 'a & b < c > d "e" \'f\''
      const expected = 'a &amp; b &lt; c &gt; d &quot;e&quot; &#39;f&#39;'
      expect(escapeHtml(input)).toBe(expected)
    })
  })
})
