'use client'

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { Canvas, extend, useFrame, useThree, type ThreeElement, type ThreeEvent } from '@react-three/fiber'
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { drawBack, drawBand, drawFront } from './badgeTextures'

extend({ MeshLineGeometry, MeshLineMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>
  }
}

type Name = { first: string; last: string }
type Props = Name & { open: boolean; eventSource: RefObject<HTMLElement | null> }

// card size in scene units (≈ a quarter of the screen height), thickness, rope segment length
const CW = 2
const CH = 2.8
const T = 0.02
const SEG = 1
const CLIP_Y = CH / 2 - 0.08 // clip centre on the card

// lanyard badge in the menu (after Vercel's conference badge): a strap of three rope-jointed links,
// the card hangs on a spherical joint and can be grabbed and thrown. Loaded only when the menu first opens.
export default function Badge({ open, eventSource, ...name }: Props) {
  return (
    <Canvas
      eventSource={eventSource}
      eventPrefix="client"
      camera={{ position: [0, 0, 30], fov: 20 }}
      dpr={[1, 2]}
      flat // no tone mapping: the print keeps the exact bone / ink / ember
      frameloop={open ? 'always' : 'never'}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={2} />
      <directionalLight position={[4, 6, 10]} intensity={1.4} />
      <Physics gravity={[0, -40, 0]} timeStep={1 / 60} paused={!open}>
        <Lanyard {...name} />
      </Physics>
    </Canvas>
  )
}

type Faces = { front: THREE.Texture; back: THREE.Texture; band: THREE.Texture }

function useFaces(name: Name) {
  const [faces, setFaces] = useState<Faces | null>(null)
  useEffect(() => {
    let alive = true
    let made: Faces | null = null
    // ShapeGeometry UVs are scene coordinates, so the card textures are scaled onto the card centre
    const fit = (t: THREE.Texture) => {
      t.repeat.set(1 / CW, 1 / CH)
      t.offset.set(0.5, 0.5)
      return t
    }
    const tex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c)
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      return t
    }
    document.fonts.ready
      .then(() => drawFront(name))
      .then((front) => {
        if (!alive) return
        const band = tex(drawBand())
        band.wrapS = THREE.RepeatWrapping
        made = { front: fit(tex(front)), back: fit(tex(drawBack())), band }
        setFaces(made)
      })
    return () => {
      alive = false
      if (made) Object.values(made).forEach((t) => t.dispose())
    }
  }, [name.first, name.last]) // eslint-disable-line react-hooks/exhaustive-deps
  return faces
}

function Lanyard(name: Name) {
  const faces = useFaces(name)
  const fixed = useRef<RapierRigidBody>(null!)
  const j1 = useRef<RapierRigidBody>(null!)
  const j2 = useRef<RapierRigidBody>(null!)
  const j3 = useRef<RapierRigidBody>(null!)
  const card = useRef<RapierRigidBody>(null!)
  const band = useRef<THREE.Mesh<MeshLineGeometry, MeshLineMaterial>>(null)
  const [dragged, drag] = useState<THREE.Vector3 | null>(null)

  const { viewport, size } = useThree()
  // hangs on the right, the strap comes in from above the top edge
  const anchor: [number, number, number] = [viewport.width / 2 - Math.min(viewport.width * 0.2, 3.4), viewport.height / 2 + 0.6, 0]

  // scratch objects for the frame loop
  const scratch = useRef({
    curve: new THREE.CatmullRomCurve3(Array.from({ length: 5 }, () => new THREE.Vector3())),
    lerp1: new THREE.Vector3(),
    lerp2: new THREE.Vector3(),
    started: false,
    vec: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
    euler: new THREE.Euler(),
  })

  const shape = useMemo(() => {
    const r = 0.12, x = -CW / 2, y = -CH / 2
    const sh = new THREE.Shape()
    sh.moveTo(x + r, y)
    sh.lineTo(x + CW - r, y)
    sh.quadraticCurveTo(x + CW, y, x + CW, y + r)
    sh.lineTo(x + CW, y + CH - r)
    sh.quadraticCurveTo(x + CW, y + CH, x + CW - r, y + CH)
    sh.lineTo(x + r, y + CH)
    sh.quadraticCurveTo(x, y + CH, x, y + CH - r)
    sh.lineTo(x, y + r)
    sh.quadraticCurveTo(x, y, x + r, y)
    return sh
  }, [])
  const face = useMemo(() => new THREE.ShapeGeometry(shape, 12), [shape])
  const edge = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 12 }), [shape])
  // MeshLineMaterial needs its params at construction; kept stable so it isn't rebuilt every render
  const lineArgs = useMemo(() => [{ resolution: new THREE.Vector2(1, 1) }] as [{ resolution: THREE.Vector2 }], [])

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], SEG])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEG])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEG])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, CH / 2 + 0.05, 0]])

  useFrame((state, delta) => {
    const s = scratch.current
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) return

    // dragging: the card follows the pointer on the z = 0 plane
    if (dragged) {
      s.vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      s.dir.copy(s.vec).sub(state.camera.position).normalize()
      s.vec.add(s.dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((b) => b.current?.wakeUp())
      card.current.setNextKinematicTranslation({ x: s.vec.x - dragged.x, y: s.vec.y - dragged.y, z: s.vec.z - dragged.z })
    }

    // the two middle links are smoothed, otherwise the strap jitters
    const t1 = j1.current.translation(), t2 = j2.current.translation()
    if (!s.started) {
      s.lerp1.copy(t1)
      s.lerp2.copy(t2)
      s.started = true
    }
    for (const [l, t] of [
      [s.lerp1, t1],
      [s.lerp2, t2],
    ] as const) {
      const k = Math.max(0.1, Math.min(1, l.distanceTo(t)))
      l.lerp(t, Math.min(1, delta * (10 + k * 40)))
    }
    const q = card.current.rotation()
    s.quat.set(q.x, q.y, q.z, q.w)

    // the strap ends inside the clip (a point on the card itself), so there is no gap and its cut end is hidden
    const c = card.current.translation()
    const p = s.curve.points
    p[0].set(0, CLIP_Y, 0).applyQuaternion(s.quat).add(c)
    p[1].copy(j3.current.translation())
    p[2].copy(s.lerp2)
    p[3].copy(s.lerp1)
    p[4].copy(fixed.current.translation())
    band.current?.geometry.setPoints(s.curve.getPoints(40))

    // the card keeps turning back to face the viewer
    s.euler.setFromQuaternion(s.quat)
    const w = card.current.angvel()
    card.current.setAngvel({ x: w.x, y: w.y - s.euler.y * 0.25, z: w.z }, true)
  })

  const link: RigidBodyProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 }

  const grab = (e: ThreeEvent<PointerEvent>) => {
    if (!card.current) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const c = card.current.translation()
    drag(new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(c.x, c.y, c.z)))
  }
  const release = (e: ThreeEvent<PointerEvent>) => {
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    drag(null)
  }

  // bodies exist from the first render so the joints can attach; the faces appear once the textures are drawn
  return (
    <>
      <group position={anchor}>
        <RigidBody ref={fixed} {...link} type="fixed" />
        <RigidBody ref={j1} position={[0.5, 0, 0]} {...link}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={j2} position={[1, 0, 0]} {...link}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={j3} position={[1.5, 0, 0]} {...link}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        {/* starts out to the side, so it swings in when the menu opens */}
        <RigidBody ref={card} position={[2.5, -1, 0]} {...link} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[CW / 2, CH / 2, T]} />
          {faces && (
          <group onPointerDown={grab} onPointerUp={release}>
            <mesh geometry={face} position={[0, 0, T / 2 + 0.001]}>
              <meshBasicMaterial map={faces.front} />
            </mesh>
            <mesh geometry={face} position={[0, 0, -T / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
              <meshBasicMaterial map={faces.back} />
            </mesh>
            {/* extrusion = caps (group 0) + sides (group 1); caps are hidden, the printed faces sit there */}
            <mesh geometry={edge} position={[0, 0, -T / 2]}>
              <meshBasicMaterial attach="material-0" visible={false} />
              <meshBasicMaterial attach="material-1" color="#8f8a81" />
            </mesh>
            {/* metal clip through the slot */}
            {/* wider than the strap and in front of its end */}
            <mesh position={[0, CLIP_Y, 0]}>
              <boxGeometry args={[0.52, 0.22, 0.09]} />
              <meshStandardMaterial color="#9b968d" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
          )}
        </RigidBody>
      </group>
      {faces && (
        <mesh ref={band}>
          <meshLineGeometry />
          <meshLineMaterial
            args={lineArgs}
            color="white"
            resolution={[size.width, size.height]}
            useMap={1}
            map={faces.band}
            repeat={[-4, 1]}
            lineWidth={2}
          />
        </mesh>
      )}
    </>
  )
}
