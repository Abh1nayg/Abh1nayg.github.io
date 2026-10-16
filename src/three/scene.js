import {
    WebGLRenderer, Scene, PerspectiveCamera,
    AmbientLight, DirectionalLight,
    PMREMGenerator,
    Group, Box3, Vector3, Raycaster, Vector2
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createGuitar } from './guitar.js'

export function initHero(container, { onPluck } = {}) {

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

    const rimLight = new DirectionalLight(0xf5a524, 1.5)
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

    // Wrap in a pivot group — all rotation/tilt goes here, never on guitar itself
    const pivot = new Group()
    pivot.add(guitar)
    scene.add(pivot)

    // Permanent slight tilt (applied once, outside the loop)
    pivot.rotation.z = -0.12

    if (reduceMotion) {
        pivot.rotation.y = 0.3      // 3D-looking fixed pose
    }

    // ── Camera fit ────────────────────────────────────────────────────────────
    // Calculates the minimum z-distance so the guitar fills ~80% of the canvas,
    // accounting for both portrait (height-limited) and landscape (width-limited) views.
    function fitCamera() {
        const fov   = camera.fov * Math.PI / 180
        const distH = (size.y / 2) / Math.tan(fov / 2)
        const distW = (size.x / 2) / (Math.tan(fov / 2) * camera.aspect)
        camera.position.z = Math.max(distH, distW) * 1.25 + size.z / 2
    }

    fitCamera()

    // ── Click / hover detection ───────────────────────────────────────────────
    const raycaster = new Raycaster()
    const pointer = new Vector2()

    function getHit(e) {
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        return raycaster.intersectObjects(hits, false)[0]
    }

    // No preventDefault, so vertical page scrolling still works on phones.
    renderer.domElement.addEventListener('pointerdown', (e) => {
        const hit = getHit(e)
        if (hit) onPluck?.(hit.object.userData.index)
    })

    renderer.domElement.addEventListener('pointermove', (e) => {
        renderer.domElement.style.cursor = getHit(e) ? 'pointer' : 'default'
    })

    // ── Animation loop ────────────────────────────────────────────────────────
    renderer.setAnimationLoop(() => {
        if (!reduceMotion) {
            const t = performance.now() / 1000
            pivot.rotation.y = Math.sin(t * 0.6) * 0.5
        }
        renderer.render(scene, camera)
    })

    // ── Resize observer ───────────────────────────────────────────────────────
    const resize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        fitCamera()                 // recalculate distance for new aspect ratio
    }
    new ResizeObserver(resize).observe(container)
}