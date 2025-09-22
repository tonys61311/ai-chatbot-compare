<script setup lang="ts">
import { useModal } from '@/composables/useModal'
import Modal from './Modal.vue'

const modal = useModal()

function handleConfirm(id: number, fn?: () => void) {
  try { fn && fn() } finally { modal.close(id) }
}
function handleCancel(id: number, fn?: () => void) {
  try { fn && fn() } finally { modal.close(id) }
}
</script>

<template>
  <div aria-live="polite" aria-atomic="true">
    <Modal
      v-for="item in modal.items"
      :key="item.id"
      v-model="(item as any).open"
      :title="item.title"
      :message="item.message"
      :confirm-text="item.confirmText || '確定'"
      :cancel-text="item.cancelText"
      :variant="item.variant || 'default'"
      @confirm="handleConfirm(item.id, item.onConfirm)"
      @cancel="handleCancel(item.id, item.onCancel)"
    />
  </div>
  
</template>

<style scoped>
</style>


