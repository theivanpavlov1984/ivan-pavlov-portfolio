// 3D portrait: the photo is redrawn in WebGL and each pixel is shifted by its depth (hero-depth.jpg, made locally
// with Depth Anything V2), so the head turns a few degrees after the mouse, like a 3D photo.
// Mouse only, on demand: frames are drawn only while the head is still catching up with the pointer.

import depthImg from '@/assets/hero-depth.jpg'

const FOCUS = 0.15 // the wall's depth: it stays put and only the head moves, so nothing behind it is uncovered
const HEAD = 0.62 // depth of the face above the wall
const SHIFT_PX = 18 // the head moves at most this far on screen, whatever the monitor size
const SHIFT_MAX = 0.02 // and at most this share of the photo (the small avatar)
const EASE = 0.07

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = vec2(p.x, -p.y) * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision mediump float;
uniform sampler2D uImg;
uniform sampler2D uDepth;
uniform vec2 uShift; // eased pointer (-1..1) × strength, in texture space
varying vec2 vUv;
void main() {
  // no zoom: the callouts sit on the photo in % and must stay on it; edges just clamp (shift is under 1%)
  vec2 uv = vUv;
  // near parts follow the pointer; the depth is re-read at the shifted point a few times, so the head's edge
  // moves as one piece instead of doubling
  float d = texture2D(uDepth, uv).r;
  for (int i = 0; i < 3; i++) d = texture2D(uDepth, uv - uShift * max(d - ${FOCUS.toFixed(2)}, 0.0)).r;
  uv -= uShift * max(d - ${FOCUS.toFixed(2)}, 0.0);
  gl_FragColor = texture2D(uImg, uv);
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
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const gl = canvas.getContext('webgl', { antialias: false })
  if (!gl) return () => {} // no WebGL: the canvas stays hidden and the plain photo shows

  let alive = true
  let raf = 0
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
  let draw = () => {}
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(() => draw())
  }

  load(depthImg.src).then((depth) => {
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
    texture(1, depth, 'uDepth')
    const uShift = gl.getUniformLocation(prog, 'uShift')

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
      const k = Math.min(SHIFT_MAX, SHIFT_PX / por.getBoundingClientRect().width) / HEAD
      gl.uniform2f(uShift, mx * k, my * k)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) schedule()
    }
    draw()
    canvas.dataset.on = 'true' // shown only once the first frame is drawn
  })

  addEventListener('pointermove', onMove)
  addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule)
  document.addEventListener('pointerleave', onLeave)
  return () => {
    alive = false
    cancelAnimationFrame(raf)
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
