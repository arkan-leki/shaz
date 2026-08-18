<template>
  <div class="music-player" :class="{ 'is-playing': isPlaying }">
    <button
      @click="toggleMusic"
      :class="{ 'is-playing': isPlaying }"
      :aria-label="isPlaying ? 'Pause music' : 'Play music'"
    >
      <span v-if="isPlaying">❚❚</span>
      <span v-else>►</span>
    </button>
    <audio ref="audioEl" src="/background-music.mp3"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isPlaying = ref(false)
const audioEl = ref<HTMLAudioElement | null>(null)

let unlockHandler: ((() => void) | null) = null
let unlockAttempts = 0

function startMusic() {
  if (!audioEl.value || isPlaying.value) return
  const promise = audioEl.value.play()
  if (promise) {
    promise.then(() => {
      isPlaying.value = true
    }).catch(() => {
      // Browser refused this gesture too — keep listeners alive; a later
      // interaction is allowed to try again.
    })
  }
}

// Called on the FIRST user gesture anywhere on the page (tap, swipe/scroll,
// click, key press). Mobile/desktop browsers only let audible audio start
// inside a real user gesture, so this is the only reliable "autoplay".
function handleFirstInteraction() {
  if (isPlaying.value) return
  // Retry a few times across gestures in case one play() call is rejected.
  if (unlockAttempts < 5) {
    unlockAttempts++
    startMusic()
  }
}

// Listen in the CAPTURE phase on both window and document so that even if the
// GSAP observer or some handler calls preventDefault/stopPropagation on the
// target, we still receive the very first touch/click anywhere on the page.
function attachUnlockListeners() {
  if (unlockHandler) return
  unlockHandler = handleFirstInteraction
  const opts: AddEventListenerOptions = { capture: true, passive: true }
  const targets: (Window | Document)[] = [window, document]
  const events: string[] = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'scroll', 'wheel']
  targets.forEach(target => {
    events.forEach(event => {
      target.addEventListener(event, unlockHandler as EventListener, opts)
    })
  })
}

function detachUnlockListeners() {
  if (!unlockHandler) return
  const opts: AddEventListenerOptions = { capture: true, passive: true }
  const targets: (Window | Document)[] = [window, document]
  const events: string[] = ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'scroll', 'wheel']
  targets.forEach(target => {
    events.forEach(event => {
      target.removeEventListener(event, unlockHandler as EventListener, opts)
    })
  })
  unlockHandler = null
}

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

// When the track finishes (no loop), reset the button so it shows the play
// icon and the user can tap to replay it.
function handleEnded() {
  isPlaying.value = false
}

onMounted(() => {
  if (!audioEl.value) return
  audioEl.value.addEventListener('ended', handleEnded)

  // Desktop: attempt autoplay on load. This works when the browser allows it
  // (e.g. Chrome with media engagement, Firefox, Edge). If it's rejected we
  // fall back to unlocking on the first user gesture below.
  const promise = audioEl.value.play()
  if (promise) {
    promise.then(() => {
      isPlaying.value = true
    }).catch(() => {
      // Autoplay blocked — start on the first tap/scroll/click anywhere.
      attachUnlockListeners()
    })
  } else {
    attachUnlockListeners()
  }
})

onUnmounted(() => {
  detachUnlockListeners()
  if (audioEl.value) {
    audioEl.value.removeEventListener('ended', handleEnded)
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
  position: relative;
  background: #00564b;
  border: 2px solid rgba(255, 255, 255, 0.9);
  color: #fff;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 0 rgba(0, 86, 75, 0.55), 0 10px 28px rgba(0, 86, 75, 0.45);
  animation: glow-pulse 1.6s ease-in-out infinite;
  transition: background 0.3s, transform 0.2s;
}

button:hover {
  background: #006b5c;
  transform: scale(1.1);
}

button:active {
  transform: scale(0.95);
}

button.is-playing {
  background: #00483f;
  border-color: rgba(255, 255, 255, 0.9);
  animation: none;
  box-shadow: 0 8px 22px rgba(0, 86, 75, 0.35);
}

/* Pulsing glow so the play button stands out and draws the user's tap */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 86, 75, 0.55), 0 10px 28px rgba(0, 86, 75, 0.45);
  }
  50% {
    box-shadow: 0 0 0 14px rgba(0, 86, 75, 0), 0 10px 28px rgba(0, 86, 75, 0.45);
  }
}

@media (max-width: 640px) {
  .music-player {
    bottom: 12px;
    right: 12px;
  }
  button {
    width: 54px;
    height: 54px;
  }
}
</style>
