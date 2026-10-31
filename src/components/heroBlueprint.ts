// Blueprint intro (≈6s): the hero's own layout guides are drawn first, a boot log prints, then the hero assembles on them.
// Guides are measured from the real layout (margins, columns, name cap/baseline, circle axis), so the labels tell the truth.

type Parts = { stick: HTMLElement; name: HTMLElement; slot: HTMLElement; grid: HTMLElement; log: HTMLElement }
type Classes = Record<'v' | 'h' | 'node' | 'hot' | 'label' | 'logLine' | 'coord', string>

const MARGIN = 24
const bootLog = ['loading design tokens', 'compiling 10+ years', 'aligning to 4px grid', 'mounting <Hero />']
const pad = (s: string, len = 28) => s + ' ' + '.'.repeat(Math.max(2, len - s.length)) + ' '

// timeline, seconds from start
export const T = { vStep: 0.26, hStart: 1.25, hStep: 0.25, nodes: 2.35, labels: 2.6, log: 2.0, logStep: 2.6 / 3 } // log prints over 2.6s

export function drawBlueprint({ stick, name, slot, grid, log }: Parts, css: Classes) {
  const box = stick.getBoundingClientRect()
  const n = name.getBoundingClientRect()
  const s = slot.getBoundingClientRect()
  const W = box.width, H = box.height
  const axis = s.left - box.left + s.width / 2
  const content = W - MARGIN * 2

  // 5 × 5 like a page blueprint: margins, column guides, axis | header, cap, midline, baseline, caption
  const xs = [MARGIN, MARGIN + content / 4, axis, MARGIN + (content * 3) / 4, W - MARGIN]
  const ys = [Math.round(H * 0.11), n.top - box.top, s.top - box.top + s.height / 2, n.bottom - box.top, Math.round(H * 0.86)]

  const el = (cls: string, style: Partial<CSSStyleDeclaration>, delay: number, text = '') => {
    const d = document.createElement('div')
    d.className = cls
    Object.assign(d.style, style)
    d.style.setProperty('--d', `${delay}s`)
    d.textContent = text
    grid.appendChild(d)
    return d
  }

  grid.replaceChildren()
  xs.forEach((x, i) => el(css.v, { left: `${x}px` }, i * T.vStep))
  ys.forEach((y, i) => el(css.h, { top: `${y}px` }, T.hStart + i * T.hStep))
  // nodes at every intersection; axis × midline is where the avatar circle will open
  xs.forEach((x, i) =>
    ys.forEach((y, j) => {
      const hot = x === axis && j === 2
      const node = el(hot ? `${css.node} ${css.hot}` : css.node, { left: `${x}px`, top: `${y}px` }, T.nodes + (i + j) * 0.04)
      node.dataset.node = ''
    }),
  )
  el(css.label, { left: `${xs[0] + 8}px`, top: `${ys[0] - 18}px` }, T.labels, `margin / ${MARGIN}px`)
  el(css.label, { left: `${axis + 8}px`, top: `${ys[0] - 18}px` }, T.labels + 0.05, 'axis / center')
  el(css.label, { left: `${xs[1] + 8}px`, top: `${ys[4] + 8}px` }, T.labels + 0.1, 'col / 03')
  el(css.label, { right: `${MARGIN + 56}px`, top: `${ys[2] - 18}px` }, T.labels + 0.15, 'midline')
  el(css.label, { left: `${xs[0] + 8}px`, top: `${ys[3] + 8}px` }, T.labels + 0.2, `baseline / ${Math.round(ys[3])}px`)

  // boot log starts once most of the grid is on screen
  log.replaceChildren()
  const timers = bootLog.map((line, i) =>
    setTimeout(() => {
      const p = document.createElement('p')
      p.className = css.logLine
      p.textContent = '> ' + pad(line)
      const ok = document.createElement('b')
      ok.textContent = 'ok'
      p.appendChild(ok)
      log.appendChild(p)
    }, (T.log + i * T.logStep) * 1000),
  )
  return () => timers.forEach(clearTimeout)
}

// pointer (mouse only): the blueprint leans away/towards it in 3D, nearby nodes grow and glow,
// nearby lines and labels light up, and the cursor carries its coordinates
export function blueprintPointer(grid: HTMLElement, stick: HTMLElement, css: Classes) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {}

  const coord = document.createElement('div')
  coord.className = css.coord
  stick.appendChild(coord)

  const RADIUS = 140
  let mx = 0.5, my = 0.5, px = -1, py = -1, rx = 0, ry = 0, raf = 0

  const onMove = (e: MouseEvent) => {
    px = e.clientX
    py = e.clientY
    mx = px / innerWidth
    my = py / innerHeight
    coord.style.transform = `translate(${px + 14}px, ${py + 34}px)` // below the tag cursor pill
    coord.textContent = `x ${String(Math.round(mx * 100)).padStart(3, '0')}  ·  y ${String(Math.round(my * 100)).padStart(3, '0')}`
    coord.dataset.on = 'true'
  }

  const tick = () => {
    // eased tilt, same ranges as Tony Mak's blueprint
    rx += ((my - 0.5) * -7 - rx) * 0.06
    ry += ((mx - 0.5) * 9 - ry) * 0.06
    grid.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`

    if (px >= 0) {
      for (const node of grid.querySelectorAll<HTMLElement>('[data-node]')) {
        const r = node.getBoundingClientRect()
        const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py)
        const t = Math.max(0, 1 - d / RADIUS)
        node.style.scale = String(1 + t * 2.2)
        node.style.boxShadow = t ? `0 0 ${t * 18}px rgba(255, 77, 0, ${t * 0.5})` : ''
        node.dataset.near = String(t > 0.15)
      }
      for (const line of grid.querySelectorAll<HTMLElement>(`.${css.v}, .${css.h}`)) {
        const r = line.getBoundingClientRect()
        const near = line.classList.contains(css.v) ? Math.abs(r.left - px) < 46 : Math.abs(r.top - py) < 46
        line.dataset.near = String(near)
      }
      for (const label of grid.querySelectorAll<HTMLElement>(`.${css.label}`)) {
        const r = label.getBoundingClientRect()
        label.dataset.near = String(Math.hypot(r.left - px, r.top - py) < 120)
      }
    }
    raf = requestAnimationFrame(tick)
  }

  addEventListener('mousemove', onMove)
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    removeEventListener('mousemove', onMove)
    coord.remove()
  }
}
