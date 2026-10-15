import { WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, DirectionalLight } from 'three'
import { createGuitar } from './guitar.js'

export function initHero(container){

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement);
    const scene = new Scene();
    const camera = new PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 7;
    const guitar = createGuitar()
    scene.add(guitar)
    const ambientLight = new AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const keyLight = new DirectionalLight(0xffffff, 2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);
    const fillLight = new DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 2, -3);
    scene.add(fillLight);
    guitar.rotation.z = -0.25;
    renderer.setAnimationLoop(() => {
        if (!reduceMotion) {
            const t = performance.now() / 1000
            guitar.rotation.y = Math.sin(t * 0.6) * 0.5
        }
        renderer.render(scene, camera);
    });
    const resize = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        renderer.setSize(w, h)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
    }
    new ResizeObserver(resize).observe(container)
}