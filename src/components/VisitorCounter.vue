<template>
  <a class="visitor-counter" dir="rtl" href="tel:07701566553" :title="'شاز بۆ چاپ و ڕیکلام — سەردانیکەران'">
    <span class="visitor-dot" aria-hidden="true"></span>
    <span class="visitor-num">{{ count }}</span>
    <span class="visitor-label">بینەر</span>
    <i class="visitor-sep" aria-hidden="true"></i>
    <span class="visitor-brand">شاز بۆ چاپ و ڕیکلام</span>
  </a>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const count = ref<number | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/count')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { visits?: number }
    count.value = data.visits ?? 0
  } catch (error) {
    console.error('Failed to load visitor count:', error)
    count.value = 0
  }
})
</script>

<style scoped>
.visitor-counter {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #dce9e6;
  box-shadow: 0 6px 20px #0f172a0d;
  font-family: 'Rabar_041', 'Vazirmatn', sans-serif;
  font-size: 0.85rem;
  line-height: 1;
  flex-shrink: 0;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.visitor-counter:hover {
  transform: translateY(-1px);
  border-color: #00564b;
  box-shadow: 0 8px 24px #00564b20;
}

.visitor-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #16a085;
  box-shadow: 0 0 0 4px #e5f4f0;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.visitor-num {
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
  min-width: 1.4ch;
  text-align: center;
}

.visitor-label {
  color: #64748b;
}

.visitor-sep {
  width: 1px;
  height: 16px;
  background: #dce9e6;
  margin: 0 0.2rem;
  flex-shrink: 0;
}

.visitor-brand {
  font-weight: 700;
  color: #00564b;
}

@media (max-width: 560px) {
  .visitor-label {
    display: none;
  }
  .visitor-sep { margin: 0 0.1rem; }
  .visitor-counter { padding: 0.45rem 0.75rem; gap: 0.35rem; }
}
</style>
