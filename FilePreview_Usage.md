# FilePreview 使用說明

## 概述

`FilePreview` 是一個檔案預覽組件，類似 ChatGPT 的檔案上傳顯示功能。它會根據檔案類型顯示不同的預覽樣式：
- **圖片檔案**：顯示縮圖預覽
- **文件檔案**：顯示對應的檔案類型圖標

## 基本用法

```vue
<template>
  <FilePreview
    :file="selectedFile"
    @remove="handleRemove"
  />
</template>

<script setup>
import FilePreview from '@/components/common/FilePreview.vue'

const selectedFile = ref(new File(['content'], 'example.jpg', { type: 'image/jpeg' }))

function handleRemove() {
  // 處理檔案移除
}
</script>
```

## Props

| 屬性 | 類型 | 必需 | 說明 |
|------|------|------|------|
| `file` | `File` | ✅ | 要預覽的檔案物件 |
| `onRemove` | `Function` | ❌ | 移除檔案時的回調函數 |

## Events

| 事件 | 參數 | 說明 |
|------|------|------|
| `remove` | - | 當用戶點擊移除按鈕時觸發 |

## 功能特點

### 1. 智能檔案類型識別
- **圖片檔案**：自動顯示縮圖預覽
- **PDF 文件**：顯示 PDF 圖標
- **Word 文件**：顯示 Word 圖標
- **Excel 文件**：顯示 Excel 圖標
- **PowerPoint 文件**：顯示 PowerPoint 圖標
- **文字檔案**：顯示文件圖標
- **壓縮檔案**：顯示壓縮包圖標
- **影片檔案**：顯示影片圖標
- **音訊檔案**：顯示音樂圖標

### 2. 檔案資訊顯示
- **檔案名稱**：顯示完整檔案名稱，過長時自動截斷
- **檔案大小**：自動格式化顯示（Bytes, KB, MB, GB）
- **懸停提示**：滑鼠懸停時顯示完整檔案名稱

### 3. 互動功能
- **移除按鈕**：右上角紅色 X 按鈕，點擊可移除檔案
- **記憶體管理**：移除圖片時自動釋放 blob URL

## 樣式設計

### 圖片預覽
- 40x40px 圓角縮圖
- 保持圖片比例，使用 `object-fit: cover`
- 深色背景容器

### 文件預覽
- 32x32px 圓角圖標容器
- 根據檔案類型顯示對應圖標
- 統一的深色主題設計

### 通用樣式
- 深色主題配色
- 圓角設計
- 平滑過渡動畫
- 響應式佈局

## 使用範例

### 在 ChatInput 中使用
```vue
<template>
  <div class="file-preview-container">
    <FilePreview
      v-for="(file, index) in selectedFiles"
      :key="`${file.name}-${index}`"
      :file="file"
      @remove="removeFile(index)"
    />
  </div>
</template>
```

### 檔案大小格式化
組件會自動將檔案大小格式化為易讀的格式：
- 0 Bytes
- 1.5 KB
- 2.3 MB
- 1.2 GB

### 檔案類型圖標對應
- `image/*` → 圖片預覽
- `application/pdf` → `mdi:file-pdf-box`
- `application/msword` → `mdi:file-word-box`
- `application/vnd.ms-excel` → `mdi:file-excel-box`
- `application/vnd.ms-powerpoint` → `mdi:file-powerpoint-box`
- `text/*` → `mdi:file-document-outline`
- `application/zip` → `mdi:file-archive`
- `video/*` → `mdi:file-video`
- `audio/*` → `mdi:file-music`
- 其他 → `mdi:file`

## 注意事項

1. **記憶體管理**：圖片預覽會創建 blob URL，移除時會自動釋放
2. **檔案驗證**：組件不包含檔案驗證，請在父組件中處理
3. **響應式設計**：組件會根據容器大小自動調整
4. **無障礙支援**：包含完整的 ARIA 屬性支援
