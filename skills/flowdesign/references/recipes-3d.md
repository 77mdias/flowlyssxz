# Receitas — 3D, WebGL/WebGPU e shaders

Three.js muda rápido: **fixe a versão** no package.json e confira o changelog antes de atualizar.
Para shaders novos com `WebGPURenderer`, use **TSL**. `ShaderMaterial` com GLSL só funciona no `WebGLRenderer`
(que continua suportado e é perfeitamente válido para efeitos de imagem).

## 1. Cena base (vanilla, WebGPU com fallback automático para WebGL2)

```js
import * as THREE from 'three/webgpu'

const canvas = document.querySelector('#webgl')       // canvas fixo atrás do DOM: position:fixed; inset:0; pointer-events:none
const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 0, 8)

scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 1.2))
const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 4, 5); scene.add(key)
// iluminação realista: HDRI em scene.environment (HDRLoader nas versões recentes; RGBELoader nas antigas)

const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.32, 220, 32), new THREE.MeshStandardMaterial({ color: 0xd8c3a5, roughness: 0.25, metalness: 0.6 }))
scene.add(mesh)

let last = 0
renderer.setAnimationLoop((t) => {                    // com WebGPURenderer use setAnimationLoop, não rAF manual
  const dt = Math.min((t - last) / 1000, 0.05); last = t
  update(dt)
  renderer.render(scene, camera)
})
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight)
})
```

## 2. Scroll dirige a cena (câmera em caminho + objeto girando)

```js
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const path = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 8), new THREE.Vector3(3, 1, 5), new THREE.Vector3(-2, 2, 3), new THREE.Vector3(0, 0.5, 2.5),
])
const target = new THREE.Vector3()
const state = { p: 0, smooth: 0 }
gsap.to(state, { p: 1, ease: 'none', scrollTrigger: { trigger: '.journey', start: 'top top', end: 'bottom bottom', scrub: true } })

// mouse parallax
const pointer = new THREE.Vector2()
addEventListener('pointermove', (e) => pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)))

function update(dt) {
  state.smooth = THREE.MathUtils.damp(state.smooth, state.p, 6, dt)     // amortecimento independente de fps
  path.getPointAt(state.smooth, camera.position)
  camera.position.x += pointer.x * 0.3; camera.position.y += pointer.y * 0.2
  camera.lookAt(target)
  mesh.rotation.y = state.smooth * Math.PI * 2
}
```

Sem 3D na seção visível? Pause: `IntersectionObserver` → `renderer.setAnimationLoop(null)`.

## 3. React Three Fiber

Página **inteira** em 3D (o scroll pertence ao canvas):
```tsx
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ScrollControls, useScroll } from '@react-three/drei'
import { easing } from 'maath'
import { useRef } from 'react'

function Hero() {
  const ref = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/models/hero.glb')
  const scroll = useScroll()
  useFrame((state, delta) => {
    const r = scroll.offset                                   // 0 → 1
    easing.damp3(state.camera.position, [Math.sin(r * Math.PI) * 3, 1 + r, 6 - r * 3], 0.25, delta)
    state.camera.lookAt(0, 0, 0)
    easing.dampE(ref.current.rotation, [0, r * Math.PI * 2 + state.pointer.x * 0.3, 0], 0.2, delta)
  })
  return <group ref={ref}><primitive object={scene} /></group>
}

export default function Scene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1, 6], fov: 35 }}>
      <Environment preset="studio" />
      <ScrollControls pages={4} damping={0.2}><Hero /></ScrollControls>
    </Canvas>
  )
}
```

Site **DOM + 3D** (mais comum): `<Canvas>` fixo atrás do conteúdo, `eventSource={document.body}`, e o progresso vem do ScrollTrigger
(guardado num `useRef`/store tipo zustand) lido dentro do `useFrame`. Não use `ScrollControls` junto com Lenis.

Gerar componente a partir do GLB: `npx gltfjsx model.glb --transform` (comprime e cria o JSX).

## 4. Imagens do DOM viram planos WebGL (base dos efeitos de hover/scroll em imagens)

Ideia (técnica clássica da Codrops): cada `<img data-gl>` continua no HTML (SEO/layout), fica invisível, e um plano WebGL
do mesmo tamanho é desenhado no lugar, com shader.

```js
// câmera em que 1 unidade = 1 pixel
const dist = 600
camera.position.z = dist
camera.fov = 2 * Math.atan(innerHeight / 2 / dist) * 180 / Math.PI
camera.updateProjectionMatrix()

const items = [...document.querySelectorAll('img[data-gl]')].map((img) => {
  const mat = makeImageMaterial(new THREE.TextureLoader().load(img.currentSrc || img.src))
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 32, 32), mat)
  scene.add(mesh)
  img.style.opacity = 0
  img.addEventListener('pointerenter', () => gsap.to(mat.uniforms.uHover, { value: 1, duration: 0.6, ease: 'power3.out' }))
  img.addEventListener('pointerleave', () => gsap.to(mat.uniforms.uHover, { value: 0, duration: 0.8, ease: 'power3.out' }))
  img.addEventListener('pointermove', (e) => {
    const r = img.getBoundingClientRect()
    mat.uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
  })
  return { img, mesh, mat }
})

function sync(velocity) {           // chame a cada frame; velocity = lenis.velocity
  for (const { img, mesh, mat } of items) {
    const r = img.getBoundingClientRect()     // em produção: cache + offset do scroll
    mesh.scale.set(r.width, r.height, 1)
    mesh.position.set(r.left - innerWidth / 2 + r.width / 2, -r.top + innerHeight / 2 - r.height / 2, 0)
    mat.uniforms.uPlane.value.set(r.width, r.height)
    mat.uniforms.uVelocity.value = velocity
  }
}
```

Shader (WebGLRenderer + GLSL): onda no hover, RGB shift e "dobra" pela velocidade do scroll, com `object-fit: cover`.

```js
function makeImageMaterial(tex) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: tex }, uHover: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: 0 }, uTime: { value: 0 }, uPlane: { value: new THREE.Vector2(1, 1) }, uImage: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: /* glsl */`
      uniform float uVelocity; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(uv.x * 3.14159) * clamp(uVelocity, -40., 40.) * 0.004;   // dobra proporcional à velocidade
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTexture; uniform float uHover, uTime; uniform vec2 uMouse, uPlane, uImage; varying vec2 vUv;
      vec2 cover(vec2 uv) {
        float s = max(uPlane.x / uImage.x, uPlane.y / uImage.y);
        vec2 n = uImage * s;
        return uv * uPlane / n + (n - uPlane) / n * 0.5;
      }
      void main() {
        float d = distance(vUv, uMouse);
        vec2 uv = vUv + normalize(vUv - uMouse + 1e-4) * 0.025 * uHover * smoothstep(0.45, 0.0, d) * sin(d * 28.0 - uTime * 4.0);
        uv = cover(uv);
        float s = 0.006 * uHover;
        gl_FragColor = vec4(texture2D(uTexture, uv + vec2(s, 0.)).r, texture2D(uTexture, uv).g, texture2D(uTexture, uv - vec2(s, 0.)).b, 1.0);
      }`,
  })
  tex.onUpdate = () => m.uniforms.uImage.value.set(tex.image.width, tex.image.height)
  return m
}
```

## 5. O mesmo tipo de efeito em TSL (WebGPURenderer)

```js
import * as THREE from 'three/webgpu'
import { texture, uv, uniform, sin, time, vec2 } from 'three/tsl'

const uHover = uniform(0)
const wave = sin(uv().y.mul(20).add(time.mul(3))).mul(0.01).mul(uHover)
const mat = new THREE.MeshBasicNodeMaterial()
mat.colorNode = texture(tex, uv().add(vec2(wave, 0)))
// animar: gsap.to(uHover, { value: 1, duration: .6 })
```

## 6. Fundo vivo (gradiente com ruído) — fullscreen

```js
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  depthWrite: false,
  uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color('#1b1512') }, uB: { value: new THREE.Color('#b38b6d') } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: `
    uniform float uTime; uniform vec3 uA, uB; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+1.), f.x), f.y); }
    void main(){
      vec2 p = vUv * 3.;
      float v = n(p + uTime * .05) * .6 + n(p * 2. - uTime * .03) * .4;
      vec3 c = mix(uA, uB, smoothstep(.25, .85, v));
      c += (h(vUv * 1000. + uTime) - .5) * .04;          // grão
      gl_FragColor = vec4(c, 1.);
    }`,
}))
bg.frustumCulled = false
```

## 7. Partículas / muitos objetos

- `InstancedMesh` para milhares de objetos iguais (1 draw call). Atualize `setMatrixAt` + `instanceMatrix.needsUpdate`.
- `Points` + shader para poeira/estrelas.
- Muitos objetos animados com física/forças: compute shaders (WebGPU/TSL) — avançado.

## 8. Spline (rápido, sem modelar em código)

```js
import { Application } from '@splinetool/runtime'
const app = new Application(document.querySelector('#spline'))
await app.load('https://prod.spline.design/<ID>/scene.splinecode')
const obj = app.findObjectByName('Hero')
gsap.to(obj.rotation, { y: Math.PI * 2, ease: 'none', scrollTrigger: { trigger: '.hero', scrub: true } })
```
Bom para validar ideia; para produção pesada, exporte GLB e leve para Three/R3F.

## 9. Pós-processamento

- R3F: `@react-three/postprocessing` (`Bloom`, `DepthOfField`, `ChromaticAberration`, `Noise`, `Vignette`).
- Three WebGPU: classe `RenderPipeline` / nós de pós em TSL (substitui o `EffectComposer`, que é do WebGLRenderer).
- Regra: pós é tempero. Bloom forte + aberração cromática + grão juntos = clichê.
