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
import { ref, onMounted, onUnmounted } from 'vue'

const isPlaying = ref(false)
const audioEl = ref<HTMLAudioElement | null>(null)
let unlockHandler: (() => void) | null = null
let firstInteractionFired = false

function toggleMusic() {
  if (!audioEl.value) return

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

function startMusic() {
  if (!audioEl.value || isPlaying.value) return
  audioEl.value.play().then(() => {
    isPlaying.value = true
  }).catch(error => {
    // Browser still refused — keep waiting for the next interaction
    console.warn("Audio autoplay blocked:", error)
  })
}

function handleFirstInteraction() {
  if (firstInteractionFired) return
  firstInteractionFired = true
  startMusic()
}

onMounted(() => {
  if (!audioEl.value) return

  // On desktop, browsers usually allow autoplay.
  audioEl.value.play().then(() => {
    isPlaying.value = true
  }).catch(() => {
    // Autoplay blocked (almost always on mobile). Browsers only allow
    // audio with sound after a user gesture, so listen for the first
    // tap/scroll/keypress anywhere on the page and start then.
    firstInteractionFired = false
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'touchstart', 'touchend', 'keydown', 'scroll']
    unlockHandler = () => handleFirstInteraction()
    events.forEach(event => window.addEventListener(event, unlockHandler as EventListener, { once: true, passive: true }))
    // Fallback: also try on the document so fast taps are not missed
    document.addEventListener('pointerdown', unlockHandler as EventListener, { once: true, passive: true })
  })
})

onUnmounted(() => {
  if (unlockHandler) {
    window.removeEventListener('pointerdown', unlockHandler as EventListener)
    document.removeEventListener('pointerdown', unlockHandler as EventListener)
    unlockHandler = null
  }
})
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
