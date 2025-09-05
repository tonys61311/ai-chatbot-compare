import type { AIProviderType } from '@/types/ai'

type CSSVars = Record<string, string>

const themes: Record<AIProviderType, CSSVars> = {
  openai: {
    '--panel-bg': '#f8fbff',
    '--panel-border': '#cfe3ff',
    '--panel-title': '#0b6bcb',
    '--panel-text': '#0b1220',
    '--panel-accent': '#1a73e8'
  },
  gemini: {
    '--panel-bg': '#fbf7ff',
    '--panel-border': '#e0d3ff',
    '--panel-title': '#6b36ff',
    '--panel-text': '#140c22',
    '--panel-accent': '#7b61ff'
  },
  deepseek: {
    '--panel-bg': '#f9fffb',
    '--panel-border': '#bfe8d0',
    '--panel-title': '#1d7a50',
    '--panel-text': '#0f2019',
    '--panel-accent': '#219a6a'
  }
}

export function getThemeVars(type: AIProviderType): CSSVars {
  return themes[type]
}


