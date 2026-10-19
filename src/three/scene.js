import {
    WebGLRenderer, Scene, PerspectiveCamera,
    AmbientLight, DirectionalLight,
    PMREMGenerator,
    Group, Box3, Vector3, Raycaster, Vector2
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createGuitar } from './guitar.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (t) => t * t * (3 - 2 * t)

// Width of the left margin reserved for the docked guitar. Zero on narrow
// screens, where the guitar fades out after the hero instead of docking.
const NARROW_BREAKPOINT = 900
function gutterPx() {
    if (window.innerWidth < NARROW_BREAKPOINT) return 0
    return Math.min(260, Math.max(150, window.innerWidth * 0.14))
}

export function initHero(container, { onPluck } = {}) {

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // ── Scene & camera ────────────────────────────────────────────────────────
    const scene = new Scene()
    const camera = new PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)

    // ── Environment map ───────────────────────────────────────────────────────
    const pmrem = new PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.5
    pmrem.dispose()

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new AmbientLight(0xffffff, 0.4))

    const keyLight = new DirectionalLight(0xffffff, 2)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    const fillLight = new DirectionalLight(0xffffff, 0.8)
    fillLight.position.set(-5, 2, 3)
    scene.add(fillLight)

    const rimLight = new DirectionalLight(0xa7c957, 0.75)
    rimLight.position.set(0, -2, -5)
    scene.add(rimLight)

    // ── Guitar + pivot ────────────────────────────────────────────────────────
    // Build the guitar with no rotation applied so the bounding box is accurate.
    const { group: guitar, strings, hits } = createGuitar()

    // Measure the unrotated geometry
    const bb     = new Box3().setFromObject(guitar)
    const size   = bb.getSize(new Vector3())
    const center = bb.getCenter(new Vector3())

    // Shift the guitar so its visual centre sits at the pivot's local origin
    guitar.position.sub(center)

    // Wrap in a pivot group — all rotation/tilt/position/scale goes here, never on guitar itself
    const pivot = new Group()
    pivot.add(guitar)
    scene.add(pivot)

    // Hero pose and docked pose. Position and scale of the docked pose depend on
    // the viewport, so they are recomputed on resize.
    const HERO_TILT = -0.12
    const DOCK_TILT = -0.1
    const HERO_SWAY = 0.5
    const DOCK_SWAY = 0
    const dock = { x: 0, scale: 1, active: false }

    pivot.rotation.z = HERO_TILT

    if (reduceMotion) {
        pivot.rotation.y = 0.3      // 3D-looking fixed pose
    }

    // ── Camera fit ────────────────────────────────────────────────────────────
    // Calculates the minimum z-distance so the guitar fills ~70% of the viewport,
    // accounting for both portrait (height-limited) and landscape (width-limited) views.
    function fitCamera() {
        const fov   = camera.fov * Math.PI / 180
        const distH = (size.y / 2) / Math.tan(fov / 2)
        const distW = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect)
        camera.position.z = Math.max(distH, distW) * 1.4 + size.z / 2
    }

    fitCamera()

    // Docked x (world units) puts the guitar's centre in the middle of the left
    // gutter; docked scale keeps its width inside the gutter.
    function computeDock(w, h) {
        const gutter = gutterPx()
        root.style.setProperty('--guitar-gutter', `${gutter}px`)

        dock.active = gutter > 0
        if (!dock.active) {
            dock.x = 0
            dock.scale = 1
            return
        }
        const halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z
        const halfW = halfH * camera.aspect
        const pxPerUnit = h / (2 * halfH)
        const ndcX = (gutter / 2 / w) * 2 - 1
        dock.x = ndcX * halfW
        // Half-width of the tilted guitar. Tilting around the centre swings the
        // bottom corner sideways by (half height × sin tilt), which is what was
        // pushing the body out of the gutter on the left.
        const tilt = Math.abs(DOCK_TILT)
        const extent = (size.x / 2) * Math.cos(tilt) + (size.y / 2) * Math.sin(tilt)
        dock.scale = Math.min(0.95, (0.46 * gutter) / (extent * pxPerUnit))
    }

    // ── Scroll progress ───────────────────────────────────────────────────────
    let progress = 0   // eased value actually used for the pose
    let target = 0     // real value from scrollY
    const readScroll = () => {
        target = clamp01(window.scrollY / (window.innerHeight * 0.6))
    }
    readScroll()
    window.addEventListener('scroll', readScroll, { passive: true })
    if (reduceMotion) progress = target

    // ── Click / hover detection ───────────────────────────────────────────────
    // The canvas is fixed behind the page with pointer-events: none, so we listen
    // on window and raycast against the strings ourselves.
    const raycaster = new Raycaster()
    const pointer = new Vector2()

    function getHit(e) {
        // Faded-out guitar (narrow screens) is not interactive.
        if (!dock.active && progress > 0.5) return undefined
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        return raycaster.intersectObjects(hits, false)[0]
    }

    // No preventDefault, so vertical page scrolling still works on phones.
    window.addEventListener('pointerdown', (e) => {
        // Don't pluck when the press landed on a link or button above the strings.
        if (e.target.closest?.('a, button, input, textarea, select')) return
        const hit = getHit(e)
        if (hit) onPluck?.(hit.object.userData.index)
    })

    let overString = false
    window.addEventListener('pointermove', (e) => {
        const over = !!getHit(e)
        if (over !== overString) {
            overString = over
            root.style.cursor = over ? 'pointer' : ''
        }
    }, { passive: true })

    // ── Animation loop ────────────────────────────────────────────────────────
    let lastKey = ''
    function frame() {
        progress = reduceMotion ? target : progress + (target - progress) * 0.1
        if (Math.abs(target - progress) < 0.0005) progress = target

        const e = smoothstep(progress)
        pivot.position.x = lerp(0, dock.x, e)
        pivot.scale.setScalar(lerp(1, dock.scale, e))
        pivot.rotation.z = lerp(HERO_TILT, DOCK_TILT, e)

        // On narrow screens the guitar fades out after the hero instead of docking.
        const opacity = dock.active ? 1 : 1 - e
        container.style.opacity = opacity.toFixed(3)

        if (!reduceMotion) {
            const t = performance.now() / 1000
            pivot.rotation.y = Math.sin(t * 0.6) * lerp(HERO_SWAY, DOCK_SWAY, e)
        } else {
            // Nothing is animating except scroll, so skip identical frames.
            const key = `${e.toFixed(4)}|${renderer.domElement.width}|${renderer.domElement.height}`
            if (key === lastKey) return
            lastKey = key
        }
        renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(frame)
    document.addEventListener('visibilitychange', () => {
        renderer.setAnimationLoop(document.hidden ? null : frame)
    })

    // ── Resize observer ───────────────────────────────────────────────────────
    const resize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        fitCamera()                 // recalculate distance for new aspect ratio
        computeDock(w, h)           // recalculate the docked pose for the new viewport
        lastKey = ''
    }
    new ResizeObserver(resize).observe(container)
}