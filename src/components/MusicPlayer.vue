<template>
  <div class="music-player">
    <button @click="toggleMusic" :class="{ 'is-playing': isPlaying }">
      <span v-if="isPlaying">❚❚</span>
      <span v-else>►</span>
    </button>
    <audio ref="audioEl" src="/background-music.mp3" loop></audio>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isPlaying = ref(false)
const audioEl = ref<HTMLAudioElement | null>(null)

function toggleMusic() {
  if (!audioEl.value) return

  // Start playing on the first click
  if (audioEl.value.paused) {
    audioEl.value.play().catch(error => {
      console.error("Audio playback failed:", error);
    });
    isPlaying.value = true;
  } else {
    audioEl.value.pause();
    isPlaying.value = false;
  }
}
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #0f172a;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: background 0.3s, transform 0.3s;
}

button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

button.is-playing {
  background: rgba(0, 86, 75, 0.8);
  color: white;
}
</style>
