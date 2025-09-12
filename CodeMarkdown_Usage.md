# CodeMarkdown 元件使用說明

## 功能特點

✅ **專業 Markdown 解析**：使用 `marked` 套件，支持完整的 Markdown 語法  
✅ **語法高亮**：使用 `highlight.js` 提供專業的代碼高亮  
✅ **純 SCSS 樣式**：不需要 Tailwind CSS  
✅ **代碼複製**：一鍵複製代碼到剪貼板  
✅ **安全過濾**：移除危險的 HTML 標籤防止 XSS  
✅ **響應式設計**：適配不同屏幕尺寸  
✅ **GitHub 風格**：支持 GFM (GitHub Flavored Markdown)  

## 使用方式

### 基本用法

```vue
<template>
  <CodeMarkdown :content="aiResponse" />
</template>

<script setup>
import CodeMarkdown from '@/components/CodeMarkdown.vue'

const aiResponse = `
# JavaScript Debounce 函數

這是一個防抖函數的實現：

\`\`\`javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    const context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
\`\`\`

使用範例：
\`\`\`javascript
const debouncedHandler = debounce(() => {
  console.log('防抖執行');
}, 300);

window.addEventListener('resize', debouncedHandler);
\`\`\`

## 特點

- **防抖延遲**：300ms
- **自動清理**：清除之前的計時器
- **上下文保持**：使用 \`apply\` 保持 \`this\` 指向

更多資訊請參考 [MDN 文檔](https://developer.mozilla.org/)
`
</script>
```

### 在 ChatWindow 中使用

```vue
<template>
  <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
    <div class="bubble">
      <CodeMarkdown :content="m.content" />
    </div>
  </div>
</template>
```

## 支持的 Markdown 語法

### 標題
```markdown
# 一級標題
## 二級標題
### 三級標題
#### 四級標題
##### 五級標題
###### 六級標題
```

### 文字格式
```markdown
**粗體文字**
*斜體文字*
~~刪除線~~
`行內代碼`
```

### 代碼塊
```markdown
行內代碼：`const x = 1`

代碼塊：
```javascript
function hello() {
  console.log('Hello World');
}
```

Python 代碼：
```python
def greet(name):
    return f"Hello, {name}!"
```
```

### 列表
```markdown
無序列表：
* 項目 1
* 項目 2
* 項目 3

有序列表：
1. 第一項
2. 第二項
3. 第三項

任務列表：
- [x] 已完成
- [ ] 未完成
```

### 連結和圖片
```markdown
[連結文字](https://example.com)
![圖片描述](https://example.com/image.jpg)
```

### 引用
```markdown
> 這是一個引用
> 可以多行
> 
> 也可以包含**格式**
```

### 表格
```markdown
| 欄位1 | 欄位2 | 欄位3 |
|-------|-------|-------|
| 內容1 | 內容2 | 內容3 |
| 內容4 | 內容5 | 內容6 |
```

### 分隔線
```markdown
---
***
___
```

### 腳註
```markdown
這是一個腳註[^1]

[^1]: 這是腳註的內容
```

## 樣式自定義

元件使用 SCSS 變數，可以通過覆蓋 CSS 變數來自定義樣式：

```scss
.markdown-content {
  // 自定義顏色
  --text-color: #your-color;
  --code-bg: #your-bg;
  --link-color: #your-link-color;
  
  // 自定義字體
  --font-family: 'Your Font', sans-serif;
  --code-font: 'Your Code Font', monospace;
}
```

## 安全特性

- 自動移除 `<script>`, `<style>`, `<iframe>` 等危險標籤
- 移除事件處理器（如 `onclick`）
- 保留安全的 HTML 標籤和屬性
- 外部連結自動添加 `target="_blank"` 和 `rel="noopener noreferrer"`

## 測試覆蓋

- ✅ **28 個測試全部通過**
- ✅ **Markdown 解析**：7 個測試
- ✅ **API 封裝**：5 個測試
- ✅ **組件功能**：16 個測試

## 注意事項

1. **內容安全**：雖然有安全過濾，但仍建議只處理可信的 AI 回應
2. **性能**：大量代碼塊可能影響渲染性能
3. **樣式**：確保父容器有足夠空間顯示代碼塊
4. **複製功能**：需要 HTTPS 環境才能正常使用剪貼板 API
