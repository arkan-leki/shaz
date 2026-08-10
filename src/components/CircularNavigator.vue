<template>
  <div class="circular-navigator">
    <svg class="progress-ring" width="120" height="120">
      <circle
        class="progress-ring__circle"
        stroke="white"
        stroke-width="4"
        fill="transparent"
        r="52"
        cx="60"
        cy="60"/>
    </svg>

    <div class="scene-indicator">{{ currentScene }} / {{ totalScenes }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{ currentScene: number; totalScenes: number }>()


</script>

<style scoped>
.circular-navigator {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.progress-ring {
  position: absolute;
}

.progress-ring__circle {
  transition: stroke-dashoffset 0.35s;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}



.scene-indicator {
  margin-top: 10px;
  color: white;
  font-weight: bold;
}
</style>
