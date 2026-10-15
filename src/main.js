import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/800.css'
import '@fontsource-variable/inter'
import './style.css'
import {initHero} from './three/scene.js'


const heroCanvas = document.querySelector('#hero-canvas')
initHero(heroCanvas)
