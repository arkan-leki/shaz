<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import CircularNavigator from './components/CircularNavigator.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import VisitorCounter from './components/VisitorCounter.vue'

gsap.registerPlugin(Observer)

// Use GPU-accelerated transforms when possible for smoother animations
gsap.config({ force3D: true })

const currentIndex = ref(0)
const isAnimating = ref(false)
let observer: Observer | null = null
let keyDownHandler: ((event: KeyboardEvent) => void) | null = null
let floatingTweens: gsap.core.Tween[] = []

// --- Service detail modal state ---
interface ServiceDetail {
  title: string
  body: string
  note?: string
}
const activeService = ref<ServiceDetail | null>(null)

// Full descriptions for each service (source: btns.md)
const serviceDetails: Record<string, ServiceDetail> = {
  'چاپی فلێکس': {
    title: 'چاپی فلێکس',
    body: 'مەراسیم و بۆنەکان: ئێمە لە چاپخانەی شاز ئەزموونی ئامادەکردنی دیکۆر و شۆوڕوومی بۆنە و مەراسیمەکانمان هەیە، وەک دیزاین و چاپکردن و ئامادەکردنی دیکۆر، ئامادەکردنی ستەیج و سەرجەم پێداویستی مەراسیم کە خۆی دەبینێتەوە لە باکێجی (دەفتەر، قەڵەم، نۆتبوک، فایل، پرۆشۆر، مەدالیا، ڕێزلێنان).',
    note: 'ئۆفەری تایبەت و داشکاندنی تایبەت بۆ ئەو لایەن و شوێنانە کراوە کە سەرجەم پێداویستییەکانی مەراسیمەکە بە شاز دەسپێرن.'
  },
  'چاپی لەزگە': {
    title: 'چاپی لەزگە',
    body: 'لێرەش جیاوازی دەکەین وادەکەین شاز دەربکەویت بە ناوەرکی سەرنج ڕاکێش و چاپی کوالێتی بەرز، وە بەبەکارهێنانی مەوادی تەواو متمانەپێکراو و ئەزموونکراو، مانەوەی بۆ ماوەیەکی زۆر. بەهەمان شێوەی بەرهەمەکانی تری شاز لە یەک مەتر بۆ ٢٠ مەتر نرخێکی دیاریکراوە.',
    note: 'لە سەروو ٢٠ مەترەوە داشکاندنی تایبەت کراوە لە نرخی یەک مەتر، یان کۆی نرخ.'
  },
  'چاپی مێش': {
    title: 'چاپی مێش',
    body: 'مێش خامەیەکی لەزگە ڕوونە، بۆ ئەو جێگایانە بەکاردەهێنرێت کە نایانەوێت بەتەواوی دابخرێت، لانی کەم لە بەشی پشتەوە سەرباری چاپ و دانانی مێش، هێشتا ببینرێت. لە دیزاین و ناوەرۆکدا تایبەت و جیاواز، لە چاپدا کوالێتی بەرز و لە مادەی خامیشدا کەرەستەی زۆر باش دەخاتە خزمەتتان.',
    note: 'مێش وەک هەر بەرهەمێکی تر تاوەکو ٢٠ مەتر نرخێکی دیاریکراوە، لە سەرووی بیست مەترەوە داشکاندنی تایبەت ئەنجام دەدەین.'
  },
  'چاپی کانڤاس': {
    title: 'چاپی کانڤاس',
    body: 'خانەمەیەکی هونەرییە، بۆ چاپی تابلۆ و دروستکردنی تابلۆ و هەندێک شوێن وەک پەردەی ڕیکلامی بەکاردەهێنرێت. ئێمە ئەزموونمان لە دروستکردنی تابلۆ و پەردەی ڕیکلامی هەیە، جگە لە کوالێتی بەرزی و چاپ و دیزاینی هونەری، چوارچێوەی تایبەت بە کانڤاسیش بۆ ئامادە دەکەین و دەیخەینە خزمەتی کڕیاران.'
  },
  'چاپی ڕۆلاپ': {
    title: 'چاپی ڕۆلاپ',
    body: 'چاپی ڕۆلاپی تایبەت بە ڕیکلام و بۆنەکان، بە دیزاین و کوالێتی بەرز، بۆ دروستکردنی دەرکەوتنێکی سەرنجڕاکێش لە نمایشکان و پێشانگاکان.'
  },
  'چاپی ستاند': {
    title: 'چاپی ستاند',
    body: 'دروستکردن و چاپی ستاندی ڕیکلامی، بۆ مارکێت و پێشانگا و بۆنەکان، بە کەرەستەی بەهێز و دیزاینی سەرنجڕاکێش.'
  },
  'چاپی ستیکەر': {
    title: 'چاپی ستیکەر',
    body: 'چاپی ستیکەری ڕەنگاوی و نەخشەدار، بە کوالێتی بەرز و مانەوەی زۆر، بۆ براندینگ و ڕیکلام و بۆنەکان.'
  },
  'چاپی دەفتەر': {
    title: 'چاپی دەفتەر',
    body: 'چاپکردنی دەفتەر بۆ بۆنە و مەراسیمەکان، بە نەخشەی تایبەت بە براندەکەت و کوالێتی بەرز، وەک دیاری و باکێج.'
  },
  'چاپی وەسل': {
    title: 'چاپی وەسل',
    body: 'چاپی وەسڵ و ستیکەری تایبەت بە کۆمپانیا و براندەکان، بە دیزاین و کوالێتی بەرز.'
  },
  'پرۆشۆر': {
    title: 'چاپی پرۆشۆر',
    body: 'دیزاین و چاپی پرۆشۆر و بڕۆشور، بۆ کۆمپانیا و لایەنەکان، بە کاغەزی کوالێتی بەرز و دیزاینی پیشەیی.'
  },
  'چاپی تابلۆ': {
    title: 'چاپی تابلۆ',
    body: 'چاپی تابلۆی ڕیکلامی و تابلۆی دیوار، بە کوالێتی بەرز و مەوادی متمانەپێکراو، بۆ براندینگ و ڕیکلام.'
  },
  'حەرفی بارز': {
    title: 'حەرفی بارز',
    body: 'تابلۆی شوێنکار، بە تەکنیکی نوێ و کەرەستەی متمانەپێکراو و هونەرێکی گەورەی شارستانی لە شاردا دەکێشین، دەمانەوێت زۆر گەورە دەربکەیت، وا بێت لە یەکەم نیگادا چاوەکان بچێتە سەر براندەکەی تۆ.',
    note: 'نرخەکان بەپێی دیزاین و بەپێی خواستی داواکاری کڕیار دەگۆڕێت.'
  },
  'تابلۆی بازرگانی': {
    title: 'تابلۆی بازرگانی',
    body: 'تابلۆکانی ئێمە تۆکمەن، شازن، متمانە پێکراون. تابلۆ بازرگانییەکان زیاتر گەورەییت پیشان دەدەن، ئەگەر جیاواز بن جیاواز دەردەکەویت، وە ئەگەر شاز بن شاز دەردەکەویت.',
    note: 'چاپخانەی شاز، ئامادەی ئەنجامدانی گرێبەستە لەگەڵ کۆمپانیا و لایەنە پەیوەندیدارەکان بە نرخی گونجاو و خزمەتی تەواو و جیاواز.'
  },
  'ستاندی ڕیکلامی': {
    title: 'ستاندی ڕیکلامی',
    body: 'ڕووپۆشکردنی ڕەفە و ستاند بە پێکهاتەی تەختە و فوم و پلاستیک و لید و ڕووپۆشکردنی بە ناوی ڕیکلامی براندەکەت، یان بەرهەمەکەت، مارکێتەکان دەنەخشێت، وا دەکات لەو ڕێگەیەوە بەرهەمەکەت لە هەموو کوچەیەکدا بەرز بێت. شاز بە کوالێتی بەرز بە تیمێکی شارەزا ستاندی تایبەت دروست دەکات، ئەزموونی زۆر و تایبەتی لەو بوارەدا هەیە.',
    note: 'نرخی ستاندەکان بەپێی قەبارە، کەرەستە و بڕ دەگۆڕێت.'
  },
  'شۆوڕووم و کۆشک': {
    title: 'شۆوڕووم و کۆشک',
    body: 'لە پێشانگا و ئیڤێنت و فستیڤاڵەکاندا بۆ ئەوەی براندەکەت نایاب دەرکەوێت پێویستت بە کۆشکێکی پرشنگدار و شارستانی هەیە، کە گەورەییت دەربخات، بە کەرەستەی تایبەت و چاپی کوالێتی بەرز و ستافی شارەزا دەخرێتە خزمەتتان.',
    note: 'نرخ بەپێی کەرەستە و جۆری مەواد و قەبارە دەگۆڕێت.'
  },
  'تیشێرت': {
    title: 'چاپی تیشێرت',
    body: 'چاپی تیشێرتی تیم و جلوبەرگ بە کوالێتی بەرز و نەخشەی تایبەت، بۆ تیمەکان و کۆمپانیا و بۆنەکان. دیزاین و چاپ بە مەوادی متمانەپێکراو کە مانەوەی بۆ ماوەیەکی زۆر هەیە.'
  },
  'بزنس کارت': {
    title: 'بزنس کارت',
    body: 'دیزاین و چاپی بزنس کارتی شاز و جیاواز، بە کاغەزی کوالێتی بەرز و چاپی ڕەنگاوی، بۆ ئەوەی براندەکەت بە شێوەیەکی پیشەیی دەربکەوێت.'
  },
  'ئاڵا و سەرمێز': {
    title: 'ئاڵا و سەرمێز',
    body: 'دروستکردن و چاپی ئاڵا و سەرمێزی ڕیکلامی، بۆ ئۆفیس و پێشانگا و بۆنەکان، بە قەبارە و دیزاینی جیاواز بەپێی خواستی کڕیار.'
  },
  'کریستال و جلد': {
    title: 'کریستال و جلد',
    body: 'ڕێزلێنانی تەختە و کریستال و جلد، بە نەخشەی تایبەت و کوالێتی بەرز، بۆ ڕێزلێنان و خەڵات لە مەراسیم و بۆنەکان.'
  },
  'ستیکەر': {
    title: 'چاپی ستیکەر',
    body: 'چاپی ستیکەری ڕەنگاوی و نەخشەدار، بە کوالێتی بەرز و مانەوەی زۆر، بۆ براندینگ و ڕیکلام و بۆنەکان.'
  }
}

function openService(title: string) {
  const detail = serviceDetails[title] || { title, body: 'بۆ زانیاری زیاتر پەیوەندیمان پێوە بکە — 0770 156 6553' }
  activeService.value = detail
  document.body.classList.add('modal-open')
  observer?.disable()
  nextTick(() => {
    const modal = document.querySelector<HTMLElement>('.service-modal')
    const card = modal?.querySelector<HTMLElement>('.service-modal-card')
    if (card) {
      gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' })
      gsap.fromTo(card, { y: 34, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' })
    }
  })
}

function closeService() {
  const modal = document.querySelector<HTMLElement>('.service-modal')
  const card = modal?.querySelector<HTMLElement>('.service-modal-card')
  observer?.enable()
  if (card) {
    gsap.to(card, { y: 24, scale: 0.97, opacity: 0, duration: 0.22, ease: 'power2.in' })
    gsap.to(modal, { opacity: 0, duration: 0.22, delay: 0.05, ease: 'power2.in', onComplete: () => {
      activeService.value = null
      document.body.classList.remove('modal-open')
    } })
  } else {
    activeService.value = null
    document.body.classList.remove('modal-open')
  }
}

// Mobile uses "reels" navigation: swipe UP goes to the next scene, swipe DOWN to the
// previous one. Desktop keeps conventional scrolling (down = next, up = previous).
const isMobile = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)

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
  printer: '/products/printer.png', showroom: '/products/show-room.png', board: '/products/sign-board.png', brochure: '/products/brochure-roll.png',
  awards: '/products/display-awards.png',
  tshirt: '/products/tshirt.png', flags: '/products/flags.png',
  wasl: '/products/wasl w daftar.png', raffa: '/products/raffa-ala.png'
}

function animateProducts(scene: Element) {
  floatingTweens.forEach((tween) => tween.kill())
  floatingTweens = []
  const products = Array.from(scene.querySelectorAll<HTMLElement>('.product-float'))
  gsap.fromTo(products, { opacity: 0, scale: 0.82, y: 36, rotate: -2 }, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out' })
  products.forEach((product, index) => floatingTweens.push(gsap.to(product, { y: index % 2 ? -12 : 12, x: index % 3 === 0 ? 7 : -7, rotate: index % 2 ? 1.5 : -1.5, duration: 2.6 + index * 0.22, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: index * 0.08 })))
}

function goToScene(index: number, direction: 'down' | 'up') {
  // Don't navigate scenes while the service detail modal is open
  if (activeService.value) return
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
  const variant = isMobile ? 'reels' : animationVariants[index] || 'fade'
  // Reels slides the outgoing scene on top (it slides away to reveal the next);
  // cinematic variants put the incoming scene on top instead.
  gsap.set(next, { display: 'flex', zIndex: variant === 'reels' ? 1 : 2 })
  gsap.set(current, { zIndex: variant === 'reels' ? 2 : 1 })
  animateProducts(next)
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
    case 'reels':
      // Reels-style vertical snap: current slides out in the swipe direction,
      // next slides in right behind it (like Instagram / TikTok Stories).
      tl.to(current, { yPercent: direction === 'down' ? -100 : 100, duration: 0.42, ease: 'power2.inOut' })
        .fromTo(next, { yPercent: direction === 'down' ? 100 : -100, scale: 0.96, opacity: 0.4 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3')
      break
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
  // Reels-style navigation: on mobile, swipe UP → next, swipe DOWN → previous.
  // Desktop keeps conventional scroll (down → next, up → previous).
  observer = Observer.create({
    target: window,
    type: 'wheel,touch',
    wheelSpeed: 1,
    tolerance: 14,
    preventDefault: true,
    onDown: () => goToScene(currentIndex.value + (isMobile ? -1 : 1), isMobile ? 'up' : 'down'),
    onUp: () => goToScene(currentIndex.value + (isMobile ? 1 : -1), isMobile ? 'down' : 'up'),
    onLeft: () => goToScene(currentIndex.value + (isMobile ? -1 : 1), 'up'),
    onRight: () => goToScene(currentIndex.value + (isMobile ? 1 : -1), 'down')
  })
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
    <header class="site-header">
      <div class="brand-logo">
        <img src="/shaz-logo.png" alt="شاز — بۆ چاپ و ڕیکلام" />
        <span class="brand-word">Shaz print</span>
      </div>
      <VisitorCounter />
    </header>
    <main class="scene-stage">
      <section id="scene-0" class="cinema-scene active hero-scene">
        <div class="scene-orb orb-one"></div>
        <div class="scene-orb orb-two"></div>
        <img class="product-float hero-printer" :src="productImages.printer" alt="چاپی فڵیکس" />
        <img class="product-float hero-board" :src="productImages.board" alt="تابلۆی بازرگانی" />
        <img class="product-float hero-showroom" :src="productImages.showroom" alt="شۆوڕووم" />
        <img class="product-float hero-flags" :src="productImages.flags" alt="ئاڵا" />
        <div class="scene-content hero-content">
          <p class="eyebrow animate-child">شاز بۆ چاپ و ڕیکلام</p>
          <h1 class="animate-child">ڕێچکە شکێنین لە هەڵبژاردنی<br /><em>دیزاینی نوێ و جیاواز</em> و چاپی کوالێتی بەرز</h1>
          <p class="intro animate-child">نوێگەری ئامانجمانە، جیاوازی و سەرکەوتنی ئێوەش ئەرکمانە</p>
          <div class="animate-child hero-actions">
            <button @click="goToScene(1, 'down')">ببینە چی دەکەین <span>↓</span></button>
            <a class="hero-phone-badge" href="tel:07701566553"><i>📞</i> 0770 156 6553</a>
          </div>
        </div>
        <div class="scroll-cue">→ راکێشە ← <span></span></div>
      </section>
      <section id="scene-1" class="cinema-scene feature-scene format-scene">
        <div class="scene-content split-content">
          <div class="copy-panel">
            <p class="eyebrow animate-child">01 / PRINTING</p>
            <h2 class="animate-child">بەشی چاپخانە</h2>
            <p class="intro animate-child">ئێمە لە چاپخانەی شاز گرنگی بە دەرکەوتنی تۆ دەدەین لە ڕێگەی بیرۆکەی نایاب و دیزاینێکی سەرنجڕاکێش، چاپکردن بە کوالێتی بەرز، دانان و دروستکردن لە ڕێگەی تیمێکی خێرا و بە ئەزموون.</p>
            <div class="service-tags animate-child">
              <button class="service-bubble" @click="openService('چاپی فلێکس')">چاپی فلێکس</button>
              <button class="service-bubble" @click="openService('چاپی لەزگە')">چاپی لەزگە</button>
              <button class="service-bubble" @click="openService('چاپی مێش')">چاپی مێش</button>
              <button class="service-bubble" @click="openService('چاپی کانڤاس')">چاپی کانڤاس</button>
              <button class="service-bubble" @click="openService('چاپی ڕۆلاپ')">چاپی ڕۆلاپ</button>
              <button class="service-bubble" @click="openService('چاپی ستاند')">چاپی ستاند</button>
              <button class="service-bubble" @click="openService('چاپی ستیکەر')">چاپی ستیکەر</button>
              <button class="service-bubble" @click="openService('چاپی دەفتەر')">چاپی دەفتەر</button>
              <button class="service-bubble" @click="openService('چاپی وەسل')">چاپی وەسل</button>
              <button class="service-bubble" @click="openService('بزنس کارت')">بزنس کارت</button>
              <button class="service-bubble" @click="openService('پرۆشۆر')">پرۆشۆر</button>
              <button class="service-bubble" @click="openService('چاپی تابلۆ')">چاپی تابلۆ</button>
            </div>
          </div>
          <div class="product-stage format-products">
            <div class="glow-ring"></div>
            <img class="product-float format-printer" :src="productImages.printer" alt="پرێنتەر" />
            <img class="product-float format-wasl" :src="productImages.wasl" alt="چاپی وەسل و دەفتەر" />
            <img class="product-float format-rolab" :src="productImages.brochure" alt="چاپی ڕۆلاپ" />
          </div>
        </div>
      </section>
      <section id="scene-2" class="cinema-scene feature-scene corporate-scene">
        <div class="scene-content split-content reverse">
          <div class="product-stage corporate-products">
            <div class="glow-ring"></div>
            <img class="product-float sign-board" :src="productImages.board" alt="حەرفی بارز" />
            <img class="product-float sign-showroom" :src="productImages.showroom" alt="شۆوڕووم و کۆشک" />
            <img class="product-float sign-raffa" :src="productImages.raffa" alt="ئاڵا و رەفە" />
          </div>
          <div class="copy-panel">
            <p class="eyebrow animate-child">02 / SIGNS & ADVERTISING</p>
            <h2 class="animate-child">بەشی حەرفی بارز<br /><em>و ڕیکلام</em></h2>
            <p class="intro animate-child">دروستکردنی حەرفی بارز و تابلۆی بازرگانی، ڕەفەی ڕیکلامی تایبەت بە براندەکەت، ستاندی ڕیکلامی لە هەموو قەبارەکاندا، تابلۆی ڕیکلامی ڕێنیشاندەر و شۆوڕووم و کۆشک.</p>
            <div class="service-tags animate-child">
              <button class="service-bubble" @click="openService('حەرفی بارز')">حەرفی بارز</button>
              <button class="service-bubble" @click="openService('تابلۆی بازرگانی')">تابلۆی بازرگانی</button>
              <button class="service-bubble" @click="openService('ستاندی ڕیکلامی')">ستاندی ڕیکلامی</button>
              <button class="service-bubble" @click="openService('شۆوڕووم و کۆشک')">شۆوڕووم و کۆشک</button>
            </div>
          </div>
        </div>
      </section>
      <section id="scene-3" class="cinema-scene feature-scene merchandise-scene">
        <div class="scene-content split-content">
          <div class="copy-panel">
            <p class="eyebrow animate-child">03 / BRANDING & GIFTS</p>
            <h2 class="animate-child">پێداویستی براندینگ<br /><em>و دیاری</em></h2>
            <p class="intro animate-child">چاپی تیشێرتی تیم، بزنس کارت، چاپی زەرف، ڕێزلێنانی تەختە و کریستال و جلد، دروستکردنی ئاڵا و سەرمێز، پێداویستی ئۆفیس، ڕەچەتە، وەسڵ، چاپی سکرین، کوپ، چاپی قەڵەم و چاپی ستیکەر.</p>
            <div class="service-tags animate-child">
              <button class="service-bubble" @click="openService('تیشێرت')">تیشێرت</button>
              <button class="service-bubble" @click="openService('بزنس کارت')">بزنس کارت</button>
              <button class="service-bubble" @click="openService('ئاڵا و سەرمێز')">ئاڵا و سەرمێز</button>
              <button class="service-bubble" @click="openService('کریستال و جلد')">کریستال و جلد</button>
              <button class="service-bubble" @click="openService('ستیکەر')">ستیکەر</button>
            </div>
          </div>
          <div class="product-stage merchandise-products">
            <div class="glow-ring"></div>
            <img class="product-float merchandise-shirt" :src="productImages.tshirt" alt="تیشێرت" />
            <img class="product-float merchandise-awards" :src="productImages.awards" alt="کریستال و جلد" />
            <img class="product-float merchandise-flags" :src="productImages.flags" alt="ئاڵا و سەرمێز" />
          </div>
        </div>
      </section>
      <section id="scene-4" class="cinema-scene contact-scene">
        <div class="contact-card">
          <p class="eyebrow animate-child">04 / LET'S CREATE</p>
          <h2 class="animate-child">بۆ ئەوەی شاز دەرکەویت،<br /><em>شاز هەڵبژێرە</em></h2>
          <p class="animate-child">تەنها دەست پێبکە، بیرۆکە و جێبەجێکردنی بە بەرزترین کوالێتی و گونجاوترین نرخ پێشکەش دەکەین.</p>
          <div class="contact-actions animate-child">
            <a class="contact-number" href="tel:07701566553"><i>📞</i> 0770 156 6553</a>
            <a class="contact-number contact-number--alt" href="tel:07761051515"><i>📱</i> 0776 105 1515</a>
            <a class="social-link social-email" href="mailto:shazprintt@gmail.com" aria-label="ئیمەیڵ"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 6.5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-11ZM4 6.5l8 5 8-5v1.5l-8 5-8-5V6.5Z"/></svg><span>shazprintt@gmail.com</span></a>
            <a class="social-link social-whatsapp" href="https://wa.me/9647701566553" target="_blank" rel="noopener" aria-label="واتسئاپ"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.94L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.13a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.09.89.9-3.01-.2-.3a8.16 8.16 0 1 1 6.85 3.74Zm4.47-6.11c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.57.18 1.1.16 1.51.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28Z"/></svg><span>واتسئاپ</span></a>
          </div>
          <div class="contact-socials animate-child">
            <a class="social-link social-facebook" href="https://www.facebook.com/share/1bUfBfM1ui/" target="_blank" rel="noopener" aria-label="فەیسبووک"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.24 0-1.63.77-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg><span>فەیسبووک</span></a>
            <a class="social-link social-instagram" href="https://www.instagram.com/shaz_printt?igsh=ZDJpczhtZGdvZmtn" target="_blank" rel="noopener" aria-label="ئینستاگرام"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.2 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85C2.42 3.94 3.94 2.42 7.15 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.1a6.7 6.7 0 1 0 0 13.4 6.7 6.7 0 0 0 0-13.4Zm0 2.2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm7.1-.35a1.57 1.57 0 1 1-3.14 0 1.57 1.57 0 0 1 3.14 0Z"/></svg><span>ئینستاگرام</span></a>
            <a class="social-link social-tiktok" href="https://www.tiktok.com/@shazprint?_r=1&_t=ZS-98pN8KxR0bw" target="_blank" rel="noopener" aria-label="تیک تۆک"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12V9.77a5.76 5.76 0 0 0-.78-.05 5.66 5.66 0 1 0 5.66 5.66V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.22-1.48Z"/></svg><span>تیک تۆک</span></a>
          </div>
          <div class="contact-meta animate-child">
            <div class="location-badge">ئۆفیسی سەرەکی — کەلار، ناو بازار · فەرعی: بەرامبەر گەراجی شەهیدان</div>
            <span>چاپخانەی شاز بۆ چاپ و ڕیکلام</span>
          </div>
        </div>
      </section>
    </main>
    <nav class="dot-nav" aria-label="بەشەکانی ماڵپەڕ">
      <button v-for="(scene, index) in scenes" :key="scene.id" :class="{ selected: currentIndex === index }" :aria-label="scene.label" @click="goToScene(index, index > currentIndex ? 'down' : 'up')"><span></span><b>{{ String(index + 1).padStart(2, '0') }}</b></button>
    </nav>
    <div class="scene-count">{{ String(currentIndex + 1).padStart(2, '0') }} <span>/ 05</span></div>
    <MusicPlayer />
    <div v-if="activeService" class="service-modal" @click.self="closeService">
      <button class="service-modal-close" aria-label="داخستن" @click="closeService">✕</button>
      <div class="service-modal-card" role="dialog" aria-modal="true">
        <p class="eyebrow service-modal-eyebrow">وردەکاری خزمەتگوزاری</p>
        <h3 class="service-modal-title">{{ activeService.title }}</h3>
        <p class="service-modal-body">{{ activeService.body }}</p>
        <p v-if="activeService.note" class="service-modal-note"><span>تێبینی</span>{{ activeService.note }}</p>
        <div class="service-modal-actions">
          <a class="contact-number social-whatsapp" href="https://wa.me/9647701566553" target="_blank" rel="noopener"><i>📞</i> 0770 156 6553</a>
        </div>
      </div>
    </div>
  </div>
</template>
