# API 封裝使用示例

## 功能特點

✅ **統一錯誤處理**：所有 API 調用都有 try-catch 包裝  
✅ **詳細日誌記錄**：自動記錄請求、響應和錯誤  
✅ **類型安全**：完整的 TypeScript 類型支持  
✅ **可擴展性**：易於添加新的 API 方法  

## 使用方式

### 在 Store 中使用

```typescript
import { apiClient } from '@/utils/api'

// 替換原本的 ofetch 調用
const res = await apiClient.compareAI(prompt, [provider])
```

### 日誌輸出示例

當你調用 API 時，控制台會顯示：

```
🚀 API Request: {
  url: '/api/compare',
  method: 'POST',
  body: { prompt: 'Hello', providers: ['openai'] },
  timestamp: '2024-01-15T10:30:00.000Z'
}

✅ API Response: {
  url: '/api/compare',
  data: {
    results: [{
      provider: 'openai',
      text: 'Hello! How can I help you?',
      elapsedMs: 1200
    }]
  },
  timestamp: '2024-01-15T10:30:01.200Z'
}
```

### 錯誤處理

當 API 出錯時：

```
❌ API Error: {
  url: '/api/compare',
  error: Error: Network error,
  message: 'Network error',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## 擴展新 API 方法

```typescript
// 在 ApiClient 類中添加新方法
async getHealth(): Promise<{ status: string }> {
  return this.makeRequest<{ status: string }>('/api/health', 'GET')
}

async getUserProfile(userId: string): Promise<UserProfile> {
  return this.makeRequest<UserProfile>(`/api/users/${userId}`, 'GET')
}
```

## 測試覆蓋

- ✅ 正常請求流程
- ✅ 錯誤處理
- ✅ 日誌記錄
- ✅ 不同參數組合
- ✅ 類型安全
