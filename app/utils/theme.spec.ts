import { describe, it, expect } from 'vitest'
import { getThemeVars } from './theme'
import { AIProviderType } from '@/types/ai'

describe('theme.ts', () => {
  describe('getThemeVars', () => {
    it('should return openai theme variables', () => {
      const result = getThemeVars(AIProviderType.OpenAI)
      
      expect(result).toEqual({
        '--panel-bg': '#f8fbff',
        '--panel-border': '#cfe3ff',
        '--panel-title': '#0b6bcb',
        '--panel-text': '#0b1220',
        '--panel-accent': '#1a73e8'
      })
    })

    it('should return gemini theme variables', () => {
      const result = getThemeVars(AIProviderType.Gemini)
      
      expect(result).toEqual({
        '--panel-bg': '#fbf7ff',
        '--panel-border': '#e0d3ff',
        '--panel-title': '#6b36ff',
        '--panel-text': '#140c22',
        '--panel-accent': '#7b61ff'
      })
    })

    it('should return deepseek theme variables', () => {
      const result = getThemeVars(AIProviderType.DeepSeek)
      
      expect(result).toEqual({
        '--panel-bg': '#f9fffb',
        '--panel-border': '#bfe8d0',
        '--panel-title': '#1d7a50',
        '--panel-text': '#0f2019',
        '--panel-accent': '#219a6a'
      })
    })

    it('should return different themes for different providers', () => {
      const openaiTheme = getThemeVars(AIProviderType.OpenAI)
      const geminiTheme = getThemeVars(AIProviderType.Gemini)
      const deepseekTheme = getThemeVars(AIProviderType.DeepSeek)
      
      expect(openaiTheme).not.toEqual(geminiTheme)
      expect(geminiTheme).not.toEqual(deepseekTheme)
      expect(openaiTheme).not.toEqual(deepseekTheme)
    })

    it('should have consistent structure across all themes', () => {
      const providers: AIProviderType[] = [AIProviderType.OpenAI, AIProviderType.Gemini, AIProviderType.DeepSeek]
      
      providers.forEach(provider => {
        const theme = getThemeVars(provider)
        
        expect(theme).toHaveProperty('--panel-bg')
        expect(theme).toHaveProperty('--panel-border')
        expect(theme).toHaveProperty('--panel-title')
        expect(theme).toHaveProperty('--panel-text')
        expect(theme).toHaveProperty('--panel-accent')
        
        // Check that all values are valid CSS color values
        Object.values(theme).forEach(color => {
          expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
        })
      })
    })

    it('should return the same object reference for same provider', () => {
      const result1 = getThemeVars(AIProviderType.OpenAI)
      const result2 = getThemeVars(AIProviderType.OpenAI)
      
      expect(result1).toBe(result2)
    })

    it('should handle all valid AIProviderType values', () => {
      const validProviders: AIProviderType[] = [AIProviderType.OpenAI, AIProviderType.Gemini, AIProviderType.DeepSeek]
      
      validProviders.forEach(provider => {
        expect(() => getThemeVars(provider)).not.toThrow()
        const theme = getThemeVars(provider)
        expect(theme).toBeDefined()
        expect(typeof theme).toBe('object')
      })
    })
  })
})
