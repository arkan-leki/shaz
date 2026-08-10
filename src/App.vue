<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(Observer)

// Use GPU-accelerated transforms when possible for smoother animations
gsap.config({ force3D: true })

const currentIndex = ref(0)
const isAnimating = ref(false)
let observer: Observer | null = null
let keyDownHandler: ((event: KeyboardEvent) => void) | null = null
let floatingTweens: gsap.core.Tween[] = []

const scenes = [
  { id: 'hero', label: 'سەرەتا' },
  { id: 'format', label: 'چاپی گەورە' },
  { id: 'corporate', label: 'کۆمپانیا' },
  { id: 'merchandise', label: 'بەرهەمەکان' },
  { id: 'contact', label: 'پەیوەندی' }
]

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
  gsap.fromTo(products, { opacity: 0, scale: 0.82, y: 36, rotate: -2 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out' })
  products.forEach((product, index) => floatingTweens.push(gsap.to(product, { y: index % 2 ? -12 : 12, x: index % 3 === 0 ? 7 : -7, rotate: index % 2 ? 1.5 : -1.5, duration: 2.6 + index * 0.22, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: index * 0.08 })))
}

function goToScene(index: number, direction: 'down' | 'up') {
  if (isAnimating.value || index === currentIndex.value || index < 0 || index >= scenes.length) return
  const allScenes = Array.from(document.querySelectorAll<HTMLElement>('.cinema-scene'))
  const current = allScenes[currentIndex.value]
  const next = allScenes[index]
  if (!current || !next) return
  isAnimating.value = true
  gsap.set(next, { display: 'flex', zIndex: 2 })
  animateProducts(next)
  gsap.timeline({ onComplete: () => { gsap.set(current, { display: 'none', clearProps: 'all' }); next.classList.add('active'); current.classList.remove('active'); currentIndex.value = index; isAnimating.value = false } })
    .to(current, { opacity: 0, scale: direction === 'down' ? 0.92 : 1.06, filter: 'blur(14px)', duration: 0.62, ease: 'power3.inOut' })
    .fromTo(next, { opacity: 0, yPercent: direction === 'down' ? 16 : -16, scale: direction === 'down' ? 1.06 : 0.96, filter: 'blur(14px)' }, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power4.out' }, '-=0.3')
    .fromTo(next.querySelectorAll('.animate-child'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out' }, '-=0.6')
}

onMounted(() => {
  const firstScene = document.querySelector<HTMLElement>('#scene-0')
  if (firstScene) { gsap.fromTo(firstScene.querySelectorAll('.animate-child'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, delay: 0.15, ease: 'power3.out' }); animateProducts(firstScene) }
  // allow native scrolling behavior where possible; Observer will still detect wheel/touch
  observer = Observer.create({ target: window, type: 'wheel,touch', wheelSpeed: 1, tolerance: 14, preventDefault: false, onDown: () => goToScene(currentIndex.value - 1, 'up'), onUp: () => goToScene(currentIndex.value + 1, 'down') })
  keyDownHandler = (event: KeyboardEvent) => {
    if (['ArrowDown', 'PageDown', 'ArrowLeft'].includes(event.key)) goToScene(currentIndex.value + 1, 'down')
    if (['ArrowUp', 'PageUp', 'ArrowRight'].includes(event.key)) goToScene(currentIndex.value - 1, 'up')
  }
  window.addEventListener('keydown', keyDownHandler)
})
onUnmounted(() => { observer?.kill(); if (keyDownHandler) window.removeEventListener('keydown', keyDownHandler); floatingTweens.forEach((tween) => tween.kill()) })
</script>

<template>
  <div dir="rtl" class="cinema-shell">
    <div class="grain"></div>
    <header class="site-header"><div class="brand-logo"><img src="/shaz-logo.png" alt="شاز — بۆ چاپ و دیزاین و ڕیکلام" /><span class="brand-word">شاز</span></div><a class="header-phone" href="tel:07701566553"><i></i>0770 156 6553</a></header>
    <main class="scene-stage">
      <section id="scene-0" class="cinema-scene active hero-scene">
        <div class="scene-orb orb-one"></div><div class="scene-orb orb-two"></div>
        <img class="product-float hero-printer" :src="productImages.printer" alt="چاپی فڵیکس" /><img class="product-float hero-awards" :src="productImages.awards" alt="کریستاڵ" /><img class="product-float hero-bags" :src="productImages.bags" alt="بەگ" /><img class="product-float hero-flags" :src="productImages.flags" alt="ئاڵا" /><img class="product-float hero-pens" :src="productImages.pens" alt="قەڵەم" />
        <div class="scene-content hero-content"><p class="eyebrow animate-child">لە ٢٠١٥ ـەوە، لەگەڵ براندەکەت</p><h1 class="animate-child">بۆ ئەوەی <em>شاز</em><br />دەر بکەویت، شاز هەڵبژێرە</h1><p class="intro animate-child">چاپ، ڕیکلام و دیزاینی پڕۆفیشناڵ بۆ ئەو براندەی کە شایەنی بینرانە.</p><div class="animate-child hero-actions"><button @click="goToScene(1, 'down')">ببینە چی دەکەین <span>↓</span></button><a class="hero-phone-badge" href="tel:07701566553"><i>📞</i> 0770 156 6553</a></div></div><div class="scroll-cue">بۆ گەشتکردن <span></span></div>
      </section>
      <section id="scene-1" class="cinema-scene feature-scene format-scene"><div class="scene-content split-content"><div class="copy-panel"><p class="eyebrow animate-child">01 / LARGE FORMAT</p><h2 class="animate-child">قەبارەی گەورە،<br /><em>کاریگەری گەورە</em></h2><p class="intro animate-child">چاپی فڵیکس و حەرفی بارز بە ڕەنگی درەوشاوە و وردترین جزییات، بۆ ئەوەی نامەکەت لە هەر شوێنێک بێت.</p><div class="service-tags animate-child"><span>چاپی فڵیکس</span><span>حەرفی بارز</span><span>ساین بۆرد</span></div></div><div class="product-stage format-products"><div class="glow-ring"></div><img class="product-float format-printer" :src="productImages.printer" alt="پرێنتەر" /><img class="product-float format-sign" :src="productImages.sign" alt="ساین" /><img class="product-float format-brochure" :src="productImages.brochure" alt="ستاند" /><div class="metric animate-child"><b>+10</b><span>ساڵ ئەزموون</span></div></div></div></section>
      <section id="scene-2" class="cinema-scene feature-scene corporate-scene"><div class="scene-content split-content reverse"><div class="product-stage corporate-products"><div class="glow-ring"></div><img class="product-float corporate-awards" :src="productImages.awards" alt="کریستاڵ" /><img class="product-float corporate-ids" :src="productImages.ids" alt="ناسنامە" /><img class="product-float corporate-vest" :src="productImages.vests" alt="جلوبەرگ" /><img class="product-float corporate-shirt" :src="productImages.tshirt" alt="تەیشێرت" /></div><div class="copy-panel"><p class="eyebrow animate-child">02 / CORPORATE IDENTITY</p><h2 class="animate-child">براندێک کە<br /><em>بە تۆ دەناسرێتەوە</em></h2><p class="intro animate-child">لە وەسڵ و کارتی ناسنامە تا کریستاڵی ڕێزلێنان و جلوبەرگی تیمەکەت؛ هەموو وردەکارییەک لە ژێر یەک هێڵی دیزاین.</p><div class="service-tags animate-child"><span>ڕەچەتە و وەسڵ</span><span>ناسنامە</span><span>تەیشێرت</span></div></div></div></section>
      <section id="scene-3" class="cinema-scene feature-scene merchandise-scene"><div class="scene-content split-content"><div class="copy-panel"><p class="eyebrow animate-child">03 / MERCHANDISE</p><h2 class="animate-child">هەر بەرهەمێک،<br /><em>سفیرێکی براندەکەتە</em></h2><p class="intro animate-child">ئاڵا، بەگ، تابڵۆی کانفاس و قەڵەم بە دیزاینێک کە ناوی براندەکەت لە دەست و چاو و بیری خەڵکدا دەهێڵێتەوە.</p><div class="service-tags animate-child"><span>چاپی ئاڵا</span><span>بەگی کاغەزی</span><span>کانفاس</span></div></div><div class="product-stage merchandise-products"><div class="glow-ring"></div><img class="product-float merchandise-flags" :src="productImages.flags" alt="ئاڵاکان" /><img class="product-float merchandise-bags" :src="productImages.bags" alt="بەگەکان" /><img class="product-float merchandise-canvas" :src="productImages.canvas" alt="کانفاس" /><img class="product-float merchandise-pens" :src="productImages.pens" alt="قەڵەم" /></div></div></section>
      <section id="scene-4" class="cinema-scene contact-scene"><img class="product-float contact-trifold" :src="productImages.trifold" alt="بڕۆشور" /><img class="product-float contact-flags" :src="productImages.flags" alt="ئاڵا" /><div class="contact-card"><p class="eyebrow animate-child">04 / LET'S CREATE</p><h2 class="animate-child">ئامادەی شازکردنی<br /><em>براندەکەتین</em></h2><p class="animate-child">پڕۆژەکەت یان ئایدیاکەت پێمان بڵێ، بە بەرزترین کواڵیتی و گونجاوترین نرخ دەیکەین بە واقع.</p><div class="contact-actions animate-child"><a class="contact-number" href="tel:07701566553"><i>📞</i> 0770 156 6553</a><a class="contact-whatsapp" href="https://wa.me/9647701566553" target="_blank" rel="noopener">واتسئاپ / WhatsApp</a></div><div class="contact-meta animate-child"><div class="location-badge">کەلار - فەرمانبەران - شەقامی پەیمانگە</div><span>چاپخانەی شاز بۆ چاپ و ڕیکلام</span></div></div></section>
    </main>
    <nav class="dot-nav" aria-label="بەشەکانی ماڵپەڕ"><button v-for="(scene, index) in scenes" :key="scene.id" :class="{ selected: currentIndex === index }" :aria-label="scene.label" @click="goToScene(index, index > currentIndex ? 'down' : 'up')"><span></span><b>{{ String(index + 1).padStart(2, '0') }}</b></button></nav><div class="scene-count">{{ String(currentIndex + 1).padStart(2, '0') }} <span>/ 05</span></div>
  </div>
</template>
