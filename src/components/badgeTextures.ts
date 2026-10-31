// Canvas-drawn faces of the menu badge. The front is a component spec of <Badge />: dimension lines, props table,
// tokens, the same blueprint language as the hero intro. Text is live, so the name follows the page language.

import heroImg from '@/assets/hero.jpg'

export const W = 1024
export const H = 1440

const INK = '#0d0c0a'
const PAPER = '#f7f4ee' // lighter than the menu's bone #ece6da, so the card separates from it
const EMBER = '#ff4d00'
const GREY = 'rgba(13, 12, 10, 0.45)'
const LINE = 'rgba(13, 12, 10, 0.16)'
const PAD = 72

// next/font exposes the generated family names through these CSS variables on <html>
const family = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

// dimension line with end ticks and an ember label, like the callouts on the hero portrait
function dim(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, mono: string) {
  const vertical = x1 === x2
  ctx.strokeStyle = EMBER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ]) {
    if (vertical) {
      ctx.moveTo(x - 10, y)
      ctx.lineTo(x + 10, y)
    } else {
      ctx.moveTo(x, y - 10)
      ctx.lineTo(x, y + 10)
    }
  }
  ctx.stroke()
  ctx.fillStyle = EMBER
  ctx.font = `500 24px ${mono}`
  ctx.textBaseline = 'middle'
  if (vertical) {
    ctx.textAlign = 'left'
    ctx.fillText(label, x1 + 18, (y1 + y2) / 2)
  } else {
    ctx.textAlign = 'center'
    const w = ctx.measureText(label).width + 16
    ctx.fillStyle = PAPER
    ctx.fillRect((x1 + x2) / 2 - w / 2, y1 - 16, w, 32)
    ctx.fillStyle = EMBER
    ctx.fillText(label, (x1 + x2) / 2, y1)
  }
}

// the slot the clip goes through
function slot(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(W / 2 - 90, 44, 180, 30, 15)
  ctx.fill()
}

// head-and-shoulders crop of the hero portrait, in grayscale (canvas `filter` is missing in older Safari, so by hand)
function avatar(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  const side = img.width * 0.34
  const sx = img.width * 0.5 - side / 2
  const sy = img.height * 0.04
  const [c, g] = canvas(r * 2, r * 2)
  g.drawImage(img, sx, sy, side, side, 0, 0, r * 2, r * 2)
  const data = g.getImageData(0, 0, r * 2, r * 2)
  const p = data.data
  for (let i = 0; i < p.length; i += 4) {
    const l = Math.min(255, (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) * 1.06)
    p[i] = p[i + 1] = p[i + 2] = l
  }
  g.putImageData(data, 0, 0)

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(c, cx - r, cy - r)
  ctx.restore()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

// deterministic stripes from a string, reads as a barcode
function barcode(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = INK
  let pos = x
  let i = 0
  while (pos < x + w) {
    const code = text.charCodeAt(i % text.length) + i
    const bar = 3 + (code % 4) * 3
    const gap = 4 + ((code >> 2) % 3) * 3
    if (pos + bar > x + w) break
    ctx.fillRect(pos, y, bar, h)
    pos += bar + gap
    i++
  }
}

export async function drawFront(name: { first: string; last: string }) {
  const [c, ctx] = canvas(W, H)
  const mono = family('--font-mono')
  const display = family('--font-travels')
  const img = await loadImage(heroImg.src)

  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, H)
  // crisp border that follows the card's rounded corners (0.12 of 2 scene units → 61 px)
  ctx.strokeStyle = 'rgba(13, 12, 10, 0.45)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(3, 3, W - 6, H - 6, 58)
  ctx.stroke()
  slot(ctx, INK)

  // header
  ctx.textBaseline = 'alphabetic'
  ctx.font = `500 28px ${mono}`
  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  ctx.fillText('<Badge />', PAD, 160)
  ctx.fillStyle = GREY
  ctx.textAlign = 'right'
  ctx.fillText('v1.0', W - PAD, 160)
  ctx.fillStyle = LINE
  ctx.fillRect(PAD, 190, W - PAD * 2, 2)

  // avatar with its spec
  const cx = W / 2, cy = 450, r = 170
  avatar(ctx, img, cx, cy, r)
  dim(ctx, cx - r, cy - r - 36, cx + r, cy - r - 36, '120', mono)
  dim(ctx, cx + r + 40, cy - r, cx + r + 40, cy + r, '120', mono)
  ctx.font = `400 22px ${mono}`
  ctx.fillStyle = GREY
  ctx.textAlign = 'left'
  ctx.fillText('avatar · 1:1', PAD, cy + r - 4)

  // padding marker
  ctx.fillStyle = 'rgba(255, 77, 0, 0.12)'
  ctx.fillRect(0, 700, PAD, 120)
  dim(ctx, 0, 690, PAD, 690, '24', mono)

  // name, centred: first in ink, last muted, like the logo
  ctx.textAlign = 'left'
  ctx.font = `600 100px ${display}`
  const fw = ctx.measureText(name.first + ' ').width
  const nx = (W - fw - ctx.measureText(name.last).width) / 2
  ctx.fillStyle = INK
  ctx.fillText(name.first, nx, 800)
  ctx.fillStyle = GREY
  ctx.fillText(name.last, nx + fw, 800)
  ctx.textAlign = 'center'
  ctx.font = `500 26px ${mono}`
  ctx.fillStyle = INK
  ctx.fillText('PRODUCT DESIGNER · DESIGN ENGINEER', W / 2, 884)
  ctx.textAlign = 'left'

  // props table
  const rows: [string, string][] = [
    ['variant', '"design-engineer"'],
    ['accent', '#FF4D00'],
    ['access', 'design-systems'],
    ['experience', '10+ yrs'],
  ]
  ctx.font = `400 26px ${mono}`
  rows.forEach(([k, v], i) => {
    const y = 960 + i * 62
    ctx.fillStyle = LINE
    ctx.fillRect(PAD, y - 40, W - PAD * 2, 2)
    ctx.fillStyle = GREY
    ctx.fillText(k, PAD, y)
    let x = 380
    if (k === 'accent') {
      ctx.fillStyle = EMBER
      ctx.fillRect(x, y - 22, 24, 24)
      x += 40
    }
    ctx.fillStyle = INK
    ctx.fillText(v, x, y)
  })
  ctx.fillStyle = LINE
  ctx.fillRect(PAD, 960 + rows.length * 62 - 40, W - PAD * 2, 2)

  // barcode + footer
  barcode(ctx, 'linkedin.com/in/theivanpavlov', PAD, 1240, W - PAD * 2, 90)
  ctx.font = `400 22px ${mono}`
  ctx.fillStyle = GREY
  ctx.textAlign = 'left'
  ctx.fillText('/in/theivanpavlov', PAD, 1380)
  ctx.textAlign = 'right'
  ctx.fillText('ID #FF4D00', W - PAD, 1380)
  return c
}

export function drawBack() {
  const [c, ctx] = canvas(W, H)
  const mono = family('--font-mono')
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, W, H)
  slot(ctx, '#2a2824')

  // dot grid, the layout grid from the intro
  ctx.fillStyle = 'rgba(236, 230, 218, 0.14)'
  for (let x = PAD; x <= W - PAD; x += 48) for (let y = 160; y <= H - 120; y += 48) ctx.fillRect(x - 2, y - 2, 4, 4)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 56px ${mono}`
  ctx.fillStyle = EMBER
  ctx.fillText('<Badge />', W / 2, H / 2)
  ctx.font = `400 24px ${mono}`
  ctx.fillStyle = 'rgba(236, 230, 218, 0.6)'
  ctx.fillText('// EOF', W / 2, H / 2 + 70)
  return c
}

// the strap: ember with a repeating mono line along it
export function drawBand() {
  const text = 'IVAN PAVLOV · DESIGN ENGINEER · '
  const font = `500 30px ${family('--font-mono')}`
  // the canvas is exactly one phrase long, so the repeated texture has no seam
  const [, probe] = canvas(1, 1)
  probe.font = font
  const [c, ctx] = canvas(Math.ceil(probe.measureText(text).width), 64)
  ctx.fillStyle = EMBER
  ctx.fillRect(0, 0, c.width, 64)
  ctx.fillStyle = INK
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 34)
  return c
}
