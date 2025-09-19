# FileUploadDropdown 使用說明

## 概述

`FileUploadDropdown` 是一個結合了 `IconButton` 和浮動選單的組件，用於檔案上傳功能。點擊按鈕會顯示一個包含「新增照片和檔案」選項的選單。

## 基本用法

```vue
<template>
  <FileUploadDropdown
    icon="mdi:plus"
    :size="30"
    aria-label="新增檔案"
    variant="default"
    @file-selected="handleFileSelected"
  />
</template>

<script setup>
import FileUploadDropdown from '@/components/common/FileUploadDropdown.vue'

function handleFileSelected(files) {
  console.log('選中的檔案:', files)
  // 處理檔案上傳邏輯
}
</script>
```

## Props

| 屬性 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `icon` | `string` | `'mdi:plus'` | 按鈕圖標 |
| `size` | `number` | `30` | 按鈕尺寸（像素） |
| `ariaLabel` | `string` | `'新增'` | 按鈕的無障礙標籤 |
| `variant` | `'default' \| 'primary'` | `'default'` | 按鈕樣式變體 |

## Events

| 事件 | 參數 | 說明 |
|------|------|------|
| `fileSelected` | `files: FileList` | 當用戶選擇檔案時觸發 |

## 功能特點

1. **響應式設計**: 選單會根據按鈕位置自動定位
2. **無障礙支援**: 完整的 ARIA 屬性支援
3. **點擊外部關閉**: 點擊選單外部區域會自動關閉選單
4. **檔案類型支援**: 允許選擇任何類型的檔案（包括照片、文件等）
5. **多檔案選擇**: 支援同時選擇多個檔案

## 樣式

組件使用 `IconButton` 作為觸發器，選單使用與 `Dropdown.vue` 相同的設計風格：
- 深色主題
- 圓角設計
- 平滑的過渡動畫
- 懸停效果
- 支援 `default` 和 `primary` 兩種按鈕樣式

## 注意事項

- 組件內部使用隱藏的 `<input type="file">` 元素來處理檔案選擇
- 每次檔案選擇後會清空 input 值，確保可以重複選擇相同檔案
- 選單會在使用者選擇檔案後自動關閉
