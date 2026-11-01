// 3D portrait: the photo is redrawn in WebGL as two layers, the wall and me, so the head turns a few degrees after
// the mouse like a 3D photo. Built locally from the hero photo (no service saw it):
// - hero-plate: the wall with me removed and filled in, revealed along my outline as I move
// - hero-mask: my outline (macOS person segmentation, the shadow on the wall cut off)
// - hero-depth: how far each part of me moves, the depth map blurred hard so I move as one smooth piece:
//   no folds, so the head never doubles or tears at its edge
// - hero-blink: the eyes closed, graded like the photo; swapped in for a blink every few seconds
// Frames are drawn only on demand: while the head catches up with the pointer, or during a blink.

import depthImg from '@/assets/hero-depth.jpg'
import plateImg from '@/assets/hero-plate.jpg'
import maskImg from '@/assets/hero-mask.jpg'
import blinkImg from '@/assets/hero-blink.jpg'

const SHIFT_PX = 18 // the head moves at most this far on screen, whatever the monitor size
const SHIFT_MAX = 0.02 // and at most this share of the photo (the small avatar)
const EASE = 0.07
const EYES = [0.4308, 0.0949, 0.1521, 0.0503] // the blink patch on the photo: x, y, w, h (0..1)

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = vec2(p.x, -p.y) * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
uniform sampler2D uImg;
uniform sampler2D uPlate;
uniform sampler2D uMask;
uniform sampler2D uDepth;
uniform sampler2D uEyes;
uniform vec2 uShift; // eased pointer (-1..1) × strength, in texture space
uniform vec4 uRect; // where the eyes patch sits
uniform float uBlink; // 0 open → 1 closed
varying vec2 vUv;
void main() {
  // where on the photo this pixel comes from: the move is smooth, so a few fixed-point steps find it exactly
  vec2 s = vUv;
  for (int i = 0; i < 4; i++) s = vUv - uShift * texture2D(uDepth, s).r;
  vec3 me = texture2D(uImg, s).rgb;
  vec2 q = (s - uRect.xy) / uRect.zw;
  if (uBlink > 0.0 && q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) me = mix(me, texture2D(uEyes, q).rgb, uBlink);
  // me over the wall: the wall stays put, so whatever I uncover is real wall
  gl_FragColor = vec4(mix(texture2D(uPlate, vUv).rgb, me, texture2D(uMask, s).r), 1.0);
}
`

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = src
  })

type Parts = { por: HTMLElement; img: HTMLImageElement; canvas: HTMLCanvasElement }

export function depthPortrait({ por, img, canvas }: Parts) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  // touch screens get the blink only: there is no pointer to turn after
  const pointer = matchMedia('(hover: hover) and (pointer: fine)').matches
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) return () => {} // no WebGL: the canvas stays hidden and the plain photo shows

  let alive = true
  let raf = 0
  let blinkTimer = 0
  const res: { tex: WebGLTexture[]; buf?: WebGLBuffer; prog?: WebGLProgram } = { tex: [] }
  const onMove = (e: PointerEvent) => {
    tx = (e.clientX / innerWidth) * 2 - 1
    ty = (e.clientY / innerHeight) * 2 - 1
    schedule()
  }
  const onLeave = () => {
    tx = ty = 0
    schedule()
  }
  let mx = 0, my = 0, tx = 0, ty = 0
  let blinkStart = -1, blinks = 1
  let draw = () => {}
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(() => draw())
  }

  // a blink: shut in 70ms, hold 50ms, open in 130ms; now and then a double one. −1 once it's over
  const blinkAt = (t: number) => {
    const shut = 70, hold = 50, open = 130, one = shut + hold + open
    if (t > one * blinks) return -1
    t %= one
    return t < shut ? t / shut : t < shut + hold ? 1 : 1 - (t - shut - hold) / open
  }
  const queueBlink = () => {
    blinkTimer = window.setTimeout(() => {
      const r = por.getBoundingClientRect()
      if (r.bottom > 0 && r.top < innerHeight && !document.hidden) {
        blinks = Math.random() < 0.2 ? 2 : 1
        blinkStart = performance.now()
        schedule()
      }
      queueBlink()
    }, 2500 + Math.random() * 3500)
  }

  Promise.all([load(depthImg.src), load(plateImg.src), load(maskImg.src), load(blinkImg.src)]).then(
    ([depth, plate, mask, eyes]) => {
      if (!alive) return
      const shader = (type: number, src: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, src)
        gl.compileShader(s)
        return s
      }
      const prog = (res.prog = gl.createProgram()!)
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
      gl.useProgram(prog)

      res.buf = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, res.buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'p')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      // big srcset candidates can exceed the GPU texture limit, so the photo is downscaled through a 2D canvas if needed
      const max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, 4096)
      let photo: TexImageSource = img
      if (Math.max(img.naturalWidth, img.naturalHeight) > max) {
        const k = max / Math.max(img.naturalWidth, img.naturalHeight)
        const c = document.createElement('canvas')
        c.width = Math.round(img.naturalWidth * k)
        c.height = Math.round(img.naturalHeight * k)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        photo = c
      }
      const texture = (unit: number, source: TexImageSource, name: string) => {
        const t = gl.createTexture()!
        res.tex.push(t)
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source)
        gl.uniform1i(gl.getUniformLocation(prog, name), unit)
      }
      texture(0, photo, 'uImg')
      texture(1, plate, 'uPlate')
      texture(2, mask, 'uMask')
      texture(3, depth, 'uDepth')
      texture(4, eyes, 'uEyes')
      gl.uniform4f(gl.getUniformLocation(prog, 'uRect'), EYES[0], EYES[1], EYES[2], EYES[3])
      const uShift = gl.getUniformLocation(prog, 'uShift')
      const uBlink = gl.getUniformLocation(prog, 'uBlink')

      // canvas resolution follows the on-screen size in steps, so scrolling doesn't reallocate it every frame
      const fit = () => {
        const r = por.getBoundingClientRect()
        const w = Math.min(max, Math.ceil((r.width * devicePixelRatio) / 128) * 128)
        if (w === canvas.width) return
        canvas.width = w
        canvas.height = Math.round((w * por.offsetHeight) / por.offsetWidth)
        gl.viewport(0, 0, canvas.width, canvas.height)
      }

      draw = () => {
        raf = 0
        fit()
        mx += (tx - mx) * EASE
        my += (ty - my) * EASE
        const k = Math.min(SHIFT_MAX, SHIFT_PX / por.getBoundingClientRect().width)
        gl.uniform2f(uShift, mx * k, my * k)
        const blink = blinkStart < 0 ? -1 : blinkAt(performance.now() - blinkStart)
        if (blink < 0) blinkStart = -1
        gl.uniform1f(uBlink, Math.max(blink, 0))
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001 || blinkStart >= 0) schedule()
      }
      draw()
      canvas.dataset.on = 'true' // shown only once the first frame is drawn
      queueBlink()
    },
  )

  if (pointer) {
    addEventListener('pointermove', onMove)
    document.addEventListener('pointerleave', onLeave)
  }
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  return () => {
    alive = false
    cancelAnimationFrame(raf)
    clearTimeout(blinkTimer)
    removeEventListener('pointermove', onMove)
    removeEventListener('scroll', schedule)
    removeEventListener('resize', schedule)
    document.removeEventListener('pointerleave', onLeave)
    // free our resources but keep the context: React StrictMode remounts on the same canvas
    res.tex.forEach((t) => gl.deleteTexture(t))
    if (res.buf) gl.deleteBuffer(res.buf)
    if (res.prog) gl.deleteProgram(res.prog)
    delete canvas.dataset.on
  }
}
