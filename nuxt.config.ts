// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/scss/main.scss'],
  modules: ['@pinia/nuxt'],
  runtimeConfig: {
    openaiKey: process.env.NUXT_OPENAI_KEY || '',
    geminiKey: process.env.NUXT_GEMINI_KEY || '',
    deepseekKey: process.env.NUXT_DEEPSEEK_KEY || '',
    public: {
      appName: 'ai-chatbot-compare'
    }
  }
})