import { reactive, readonly, getCurrentInstance } from 'vue'

export type ModalVariant = 'default' | 'danger' | 'success'

interface ModalStateItem {
  id: number
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: ModalVariant
  onConfirm?: () => void
  onCancel?: () => void
  open?: boolean
}

const modalQueue = reactive<ModalStateItem[]>([])
let idSeq = 1

// 空實作，當 composable 無法使用時返回
const emptyModal = {
  items: readonly([]),
  open: () => 0,
  close: () => {},
  clear: () => {},
  alert: () => {},
  confirm: () => {}
}

export function useModal() {
  try {
    // 檢查是否在正確的 Vue 環境
    if (!getCurrentInstance()) {
      console.warn('useModal called outside Vue component context')
    }

    function open(options: Omit<ModalStateItem, 'id'>): number {
      const id = idSeq++
      modalQueue.push({ id, open: true, ...options })
      return id
    }

    function close(id?: number) {
      if (typeof id === 'number') {
        const idx = modalQueue.findIndex(m => m.id === id)
        if (idx !== -1) modalQueue.splice(idx, 1)
      } else if (modalQueue.length) {
        modalQueue.splice(0, 1)
      }
    }

    function clear() {
      modalQueue.splice(0)
    }

    function alert(message: string, title = '提示', variant: ModalVariant = 'default') {
      open({ title, message, confirmText: '知道了', cancelText: '', variant })
    }

    function confirm(message: string, title = '確認', onConfirm?: () => void, onCancel?: () => void, variant: ModalVariant = 'default') {
      open({ title, message, confirmText: '確定', cancelText: '取消', variant, onConfirm, onCancel })
    }

    return {
      items: readonly(modalQueue),
      open,
      close,
      clear,
      alert,
      confirm
    }
  } catch (error) {
    console.warn('useModal failed to initialize:', error)
    return emptyModal
  }
}


