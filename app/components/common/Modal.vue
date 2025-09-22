<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'success'
  closeOnBackdrop?: boolean
}>(), {
  confirmText: '確定',
  variant: 'default',
  closeOnBackdrop: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  emit('update:modelValue', false)
}

function onBackdropClick() {
  if (props.closeOnBackdrop) onCancel()
}

function onConfirm() {
  emit('confirm')
}

function onCancel() {
    emit('update:modelValue', false)
  emit('cancel')
}

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="modal" role="dialog" aria-modal="true">
      <div class="modal__backdrop" @click="onBackdropClick" />
      <div class="modal__panel" :class="[`modal--${variant}`]">
        <header class="modal__header">
          <h3 class="modal__title">{{ title }}</h3>
          <button class="modal__close" aria-label="關閉" @click="onCancel">×</button>
        </header>
        <div class="modal__body">
          <slot>
            <p v-if="message">{{ message }}</p>
          </slot>
        </div>
        <footer class="modal__footer">
          <slot name="actions">
            <button v-if="cancelText" class="btn btn--ghost" type="button" @click="onCancel">{{ cancelText }}</button>
            <button class="btn" :class="{ 'btn--danger': variant === 'danger' }" type="button" @click="onConfirm">{{ confirmText }}</button>
          </slot>
        </footer>
      </div>
    </div>
  </teleport>
  
</template>

<style scoped lang="scss">
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
}

.modal__panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(520px, 92vw);
  background: #ffffff;
  border: 1px solid #e5e7ee;
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.45);
  color: #0f1115;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7ee;
}

.modal__title {
  margin: 0;
  font-size: 18px;
}

.modal__close {
  background: transparent;
  border: none;
  color: #4b5563;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 6px;
  &:hover { background: #f3f4f6; }
}

.modal__body {
  padding: 16px;
  font-size: 14px;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px 16px;
}

.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #111827;
  cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease, opacity .15s ease;
  &:hover { background: #e5e7eb; border-color: #d1d5db; }
  &:active { opacity: .9; }
}

.btn--ghost {
  background: transparent;
  color: #6b7280;
  &:hover { background: #f3f4f6; }
}

.modal--danger .modal__panel {
  border-color: #fecaca;
}

.btn--danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
  &:hover { background: #b91c1c; border-color: #b91c1c; }
}
</style>

