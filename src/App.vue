<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import CircularNavigator from './components/CircularNavigator.vue'
import MusicPlayer from './components/MusicPlayer.vue'

gsap.registerPlugin(Observer)

// Use GPU-accelerated transforms when possible for smoother animations
gsap.config({ force3D: true })

const currentIndex = ref(0)
const isAnimating = ref(false)
let observer: Observer | null = null
let keyDownHandler: ((event: KeyboardEvent) => void) | null = null
let floatingTweens: gsap.core.Tween[] = []

// --- Input gating so page changes are reliable (one gesture = one page) ---
// Extra time after a transition finishes during which leftover scroll/touch
// momentum is ignored. Prevents a single fast flick/swipe from skipping pages.
const POST_NAV_LOCK_MS = 400
// Extra time after a transition STARTS before a fresh gesture is accepted,
// so rapid input can never queue up multiple changes.
const MIN_NAV_INTERVAL_MS = 500
// Safety net: if a transition somehow never reports completion, force-release
// the animation lock so the page can never get stuck / freeze.
const SAFETY_MS = 1400
let navLockedUntil = 0
let lastNavStartedAt = 0
let animSafetyTimer: number | null = null

function isNavLocked() {
  const now = performance.now()
  return now < navLockedUntil || now - lastNavStartedAt < MIN_NAV_INTERVAL_MS
}

function clearAnimSafety() {
  if (animSafetyTimer !== null) {
    window.clearTimeout(animSafetyTimer)
    animSafetyTimer = null
  }
}

const scenes = [
  { id: 'hero', label: 'سەرەتا' },
  { id: 'printing', label: 'چاپخانە' },
  { id: 'signs', label: 'حەرفی بارز' },
  { id: 'branding', label: 'براندینگ و دیاری' },
  { id: 'contact', label: 'پەیوەندی' }
]

// per-scene animation variants (index-based). Options: 'fade', 'slide', 'zoom', 'float', 'flip'
const animationVariants = ['shade', 'roll', 'scatter', 'unfold', 'roll']

const productImages = {
  printer: '/products/printer.png', sign: '/products/sign-soran.png', brochure: '/products/brochure-roll.png',
  awards: '/products/display-awards.png', ids: '/products/id-cards.png', vests: '/products/vests.png',
  tshirt: '/products/tshirt.png', flags: '/products/flags.png', bags: '/products/bags.png',
  canvas: '/products/canvas.png', pens: '/products/pens-color.png', trifold: '/products/trifold.png'
}

function animateProducts(scene: Element) {
  floatingTweens.forEach((tween) => tween.kill())
  floatingTweens = []
  const products = Array.from(scene.querySelectorAll<HTMLElement>('.product-float'))
  gsap.fromTo(products, { opacity: 0, scale: 0.82, y: 36, rotate: -2 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out' })
  products.forEach((product, index) => floatingTweens.push(gsap.to(product, { y: index % 2 ? -12 : 12, x: index % 3 === 0 ? 7 : -7, rotate: index % 2 ? 1.5 : -1.5, duration: 2.6 + index * 0.22, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: index * 0.08 })))
}

function goToScene(index: number, direction: 'down' | 'up') {
  if (isAnimating.value || isNavLocked() || index === currentIndex.value || index < 0 || index >= scenes.length) return
  const allScenes = Array.from(document.querySelectorAll<HTMLElement>('.cinema-scene'))
  const current = allScenes[currentIndex.value]
  const next = allScenes[index]
  if (!current || !next) return
  isAnimating.value = true
  lastNavStartedAt = performance.now()
  clearAnimSafety()
  // Drop any leftover animation on these two scenes so a half-done transition
  // can never leave the page visually broken or stuck.
  gsap.killTweensOf([current, next])
  gsap.set(next, { display: 'flex', zIndex: 2 })
  animateProducts(next)
  // choose variant based on scene index (fallback to 'fade')
  const variant = animationVariants[index] || 'fade'
  runSceneTransition(current, next, variant, direction, () => {
    gsap.set(current, { display: 'none', clearProps: 'all' })
    next.classList.add('active')
    current.classList.remove('active')
    currentIndex.value = index
    isAnimating.value = false
    clearAnimSafety()
    // absorb any leftover momentum from the same gesture
    navLockedUntil = performance.now() + POST_NAV_LOCK_MS
  })
  // Guarantee the app can never freeze if a transition is interrupted
  animSafetyTimer = window.setTimeout(() => {
    if (isAnimating.value) {
      isAnimating.value = false
      navLockedUntil = performance.now() + POST_NAV_LOCK_MS
    }
  }, SAFETY_MS)
}

function runSceneTransition(current: HTMLElement, next: HTMLElement, variant: string, direction: 'down' | 'up', onComplete: () => void) {
  const tl = gsap.timeline({ onComplete })
  switch (variant) {
    case 'shade':
      // paper pulls up like window shade
      tl.to(current, { yPercent: -100, duration: 0.5, ease: 'power2.inOut' })
        .set(next, { yPercent: 0, opacity: 1 }, 0)
      break
    case 'drop':
      // paper falls from above and bounces
      tl.to(current, { yPercent: direction === 'down' ? -100 : 100, duration: 0.3, ease: 'power3.in' })
        .fromTo(next, { yPercent: direction === 'down' ? -120 : 120, rotation: direction === 'down' ? 6 : -6 }, { yPercent: 0, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.1')
      break
    case 'roll':
      // paper tumbles away, next rolls in
      tl.to(current, { yPercent: direction === 'down' ? -100 : 100, rotation: direction === 'down' ? 15 : -15, opacity: 0, duration: 0.4, ease: 'power3.in' })
        .fromTo(next, { yPercent: direction === 'down' ? 100 : -100, rotation: direction === 'down' ? -12 : 12, scale: 0.9 }, { yPercent: 0, rotation: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }, '-=0.15')
      break
    case 'scatter':
      // items scatter/fall — current lifts up, next tumbles into place
      tl.to(current, { yPercent: -60, scale: 0.85, opacity: 0, duration: 0.32, ease: 'power3.in' })
        .fromTo(next, { yPercent: 80, rotation: -8, scale: 0.88, opacity: 0 }, { yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.5)' }, '-=0.1')
      break
    case 'unfold':
      // paper unfolds — current folds up, next unfolds from center
      tl.to(current, { scaleY: 0, transformOrigin: '50% 0%', opacity: 0, duration: 0.35, ease: 'power3.in' })
        .fromTo(next, { scaleY: 0, transformOrigin: '50% 100%', opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.1')
      break
    default:
      // fade (fallback)
      tl.to(current, { opacity: 0, scale: direction === 'down' ? 0.92 : 1.06, filter: 'blur(8px)', duration: 0.4, ease: 'power3.inOut' })
        .fromTo(next, { opacity: 0, yPercent: direction === 'down' ? 16 : -16, scale: direction === 'down' ? 1.06 : 0.96, filter: 'blur(8px)' }, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power4.out' }, '-=0.25')
  }
  // animate child elements for entrance
  tl.fromTo(next.querySelectorAll('.animate-child'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: 'power3.out' }, '-=0.3')
}

onMounted(() => {
  const firstScene = document.querySelector<HTMLElement>('#scene-0')
  if (firstScene) { gsap.fromTo(firstScene.querySelectorAll('.animate-child'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, delay: 0.1, ease: 'power3.out' }); animateProducts(firstScene) }
  // allow native scrolling behavior where possible; Observer will still detect wheel/touch
  observer = Observer.create({ target: window, type: 'wheel,touch', wheelSpeed: 1, tolerance: 14, preventDefault: true, onDown: () => goToScene(currentIndex.value + 1, 'down'), onUp: () => goToScene(currentIndex.value - 1, 'up'), onLeft: () => goToScene(currentIndex.value + 1, 'down'), onRight: () => goToScene(currentIndex.value - 1, 'up') })
  keyDownHandler = (event: KeyboardEvent) => {
    if (['ArrowDown', 'PageDown', 'ArrowLeft'].includes(event.key)) goToScene(currentIndex.value + 1, 'down')
    if (['ArrowUp', 'PageUp', 'ArrowRight'].includes(event.key)) goToScene(currentIndex.value - 1, 'up')
  }
  window.addEventListener('keydown', keyDownHandler)
  // tap ripple — wave effect on nearby floating items
  const shell = document.querySelector('.cinema-shell')
  if (shell) {
    shell.addEventListener('click', (e: Event) => {
      const me = e as MouseEvent
      if (isAnimating.value) return
      const target = me.target as HTMLElement
      if (target.closest('button, a, nav, .scroll-cue')) return
      const rect = shell.getBoundingClientRect()
      const x = me.clientX - rect.left
      const y = me.clientY - rect.top
      // create ripple
      const ripple = document.createElement('div')
      ripple.className = 'tap-ripple'
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      shell.appendChild(ripple)
      gsap.fromTo(ripple, { width: 0, height: 0, opacity: 0.5 }, { width: 200, height: 200, opacity: 0, marginLeft: -100, marginTop: -100, duration: 0.9, ease: 'power3.out', onComplete: () => ripple.remove() })
      // push nearby floating products
      const scene = document.querySelector('.cinema-scene.active')
      if (!scene) return
      const products = scene.querySelectorAll<HTMLElement>('.product-float')
      products.forEach((product) => {
        const pr = product.getBoundingClientRect()
        const pcx = pr.left + pr.width / 2 - rect.left
        const pcy = pr.top + pr.height / 2 - rect.top
        const dx = pcx - x
        const dy = pcy - y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 300) {
          const force = (1 - dist / 300) * 40
          gsap.to(product, { x: '+=' + (dx / dist) * force, y: '+=' + (dy / dist) * force, duration: 0.3, ease: 'power2.out', overwrite: 'auto', onComplete: () => gsap.to(product, { x: '-=' + (dx / dist) * force, y: '-=' + (dy / dist) * force, duration: 0.6, ease: 'elastic.out(1,0.4)', overwrite: 'auto' }) })
        }
      })
    })
  }
})
onUnmounted(() => { observer?.kill(); clearAnimSafety(); if (keyDownHandler) window.removeEventListener('keydown', keyDownHandler); floatingTweens.forEach((tween) => tween.kill()) })
</script>

<template>
  <div dir="rtl" class="cinema-shell">
    <div class="grain"></div>
    <header class="site-header"><div class="brand-logo"><img src="/shaz-logo.png" alt="شاز — بۆ چاپ و ڕیکلام" /><span class="brand-word">Shaz Print</span></div><a class="header-phone" href="tel:07701566553"><i></i>0770 156 6553</a></header>
    <main class="scene-stage">
      <section id="scene-0" class="cinema-scene active hero-scene">
        <div class="scene-orb orb-one"></div><div class="scene-orb orb-two"></div>
        <img class="product-float hero-printer" :src="productImages.printer" alt="چاپی فڵیکس" /><img class="product-float hero-awards" :src="productImages.awards" alt="کریستاڵ" /><img class="product-float hero-bags" :src="productImages.bags" alt="بەگ" /><img class="product-float hero-flags" :src="productImages.flags" alt="ئاڵا" /><img class="product-float hero-pens" :src="productImages.pens" alt="قەڵەم" />
        <div class="scene-content hero-content"><p class="eyebrow animate-child">ئێمە لە گەرمیانین</p><h1 class="animate-child">ڕێچکە شکێنین لە هەڵبژاردنی<br /><em>دیزاینی نوێ و جیاواز</em> و چاپی کوالێتی بەرز</h1><p class="intro animate-child">نوێگەری خەونمانە، جیاوازی و سەرکەرخستنی زیاتری تۆش ئەرکمانە — دەکرێت.</p><div class="animate-child hero-actions"><button @click="goToScene(1, 'down')">ببینە چی دەکەین <span>↓</span></button><a class="hero-phone-badge" href="tel:07701566553"><i>📞</i> 0770 156 6553</a></div></div><div class="scroll-cue">→ راکێشە ← <span></span></div>
      </section>
      <section id="scene-1" class="cinema-scene feature-scene format-scene"><div class="scene-content split-content"><div class="copy-panel"><p class="eyebrow animate-child">01 / PRINTING</p><h2 class="animate-child">بەشی چاپخانە</h2><p class="intro animate-child">ئێمە لە چاپخانەی شاز گرنگی بە دەرکەوتنی تۆ دەدەین: لە دیزاینێکی سەرنجڕاکێش، چاپکردن بە کوالێتی بەرز، دانان و درووستکردن لە ڕێگەی تیمێکی خێرا و بە ئەزموون.</p><div class="service-tags animate-child"><span>چاپی فلێکس</span><span>چاپی لەزگە</span><span>چاپی مێش</span><span>چاپی کانڤاس</span></div></div><div class="product-stage format-products"><div class="glow-ring"></div><img class="product-float format-printer" :src="productImages.printer" alt="پرێنتەر" /><img class="product-float format-sign" :src="productImages.sign" alt="ساین" /><img class="product-float format-brochure" :src="productImages.brochure" alt="ستاند" /><div class="metric animate-child"><b>+10</b><span>ساڵ ئەزموون</span></div></div></div></section>
      <section id="scene-2" class="cinema-scene feature-scene corporate-scene"><div class="scene-content split-content reverse"><div class="product-stage corporate-products"><div class="glow-ring"></div><img class="product-float corporate-awards" :src="productImages.awards" alt="کریستاڵ" /><img class="product-float corporate-ids" :src="productImages.ids" alt="ناسنامە" /><img class="product-float corporate-vest" :src="productImages.vests" alt="جلوبەرگ" /><img class="product-float corporate-shirt" :src="productImages.tshirt" alt="تەیشێرت" /></div><div class="copy-panel"><p class="eyebrow animate-child">02 / SIGNS & ADVERTISING</p><h2 class="animate-child">بەشی حەرفی بارز<br /><em>و ڕیکلام</em></h2><p class="intro animate-child">درووستکردنی حەرفی بارز و تابلۆی بازرگانی، ڕەفەی ڕیکلامی تایبەت بە براندەکەت، ستاندی ڕیکلامی بە هەموو قەبارەیەک، تابلۆی ڕیکلامی ڕێنیشاندەر و شۆو روم و کۆشک.</p><div class="service-tags animate-child"><span>حەرفی بارز</span><span>تابلۆی بازرگانی</span><span>ستاندی ڕیکلامی</span><span>شۆو روم و کۆشک</span></div></div></div></section>
      <section id="scene-3" class="cinema-scene feature-scene merchandise-scene"><div class="scene-content split-content"><div class="copy-panel"><p class="eyebrow animate-child">03 / BRANDING & GIFTS</p><h2 class="animate-child">پێداویستی براندینگ<br /><em>و دیاری</em></h2><p class="intro animate-child">چاپی تیشێرتی تیم، بزنس کارت، چاپی زەرف، ڕێزلێنانی تەختە و کریستال و جلد، درووستکردنی ئاڵا و سەرمێز، پێداویستی ئۆفیس، ڕەچەتە، وەسڵ، چاپی سکرین، کوپ، چاپی قەڵەم و چاپی ستیکەر.</p><div class="service-tags animate-child"><span>تیشێرت</span><span>بزنس کارت</span><span>ئاڵا و سەرمێز</span><span>کریستال و جلد</span><span>ستیكەر</span></div></div><div class="product-stage merchandise-products"><div class="glow-ring"></div><img class="product-float merchandise-flags" :src="productImages.flags" alt="ئاڵاکان" /><img class="product-float merchandise-bags" :src="productImages.bags" alt="بەگەکان" /><img class="product-float merchandise-canvas" :src="productImages.canvas" alt="کانفاس" /><img class="product-float merchandise-pens" :src="productImages.pens" alt="قەڵەم" /></div></div></section>
      <section id="scene-4" class="cinema-scene contact-scene"><img class="product-float contact-trifold" :src="productImages.trifold" alt="بڕۆشور" /><img class="product-float contact-flags" :src="productImages.flags" alt="ئاڵا" /><div class="contact-card"><p class="eyebrow animate-child">04 / LET'S CREATE</p><h2 class="animate-child">بۆ ئەوەی شاز دەرکەویت،<br /><em>شاز هەڵبژێرە</em></h2><p class="animate-child">پڕۆژەکەت یان ئایدیاکەت پێمان بڵێ، بە بەرزترین کواڵیتی و گونجاوترین نرخ دەیکەینە واقع.</p><div class="contact-actions animate-child"><a class="contact-number" href="tel:07701566553"><i>📞</i> 0770 156 6553</a><a class="contact-number contact-number--alt" href="tel:07761051515"><i>📱</i> 0776 105 1515</a><a class="contact-whatsapp" href="mailto:shazzprint@gmail.com">✉️ shazzprint@gmail.com</a><a class="contact-whatsapp" href="https://wa.me/9647701566553" target="_blank" rel="noopener">واتسئاپ / WhatsApp</a></div><div class="contact-meta animate-child"><div class="location-badge">ئۆفیسی سەرەکی — کەلار، ناو بازار · فەرعی: بەرامبەر گەراجی شەهیدان</div><span>چاپخانەی شاز بۆ چاپ و ڕیکلام</span></div></div></section>
    </main>
    <nav class="dot-nav" aria-label="بەشەکانی ماڵپەڕ"><button v-for="(scene, index) in scenes" :key="scene.id" :class="{ selected: currentIndex === index }" :aria-label="scene.label" @click="goToScene(index, index > currentIndex ? 'down' : 'up')"><span></span><b>{{ String(index + 1).padStart(2, '0') }}</b></button></nav><div class="scene-count">{{ String(currentIndex + 1).padStart(2, '0') }} <span>/ 05</span></div>
    <MusicPlayer />
  </div>
</template>
