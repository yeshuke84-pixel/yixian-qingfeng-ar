const MIN_SCALE = 0.55
const MAX_SCALE = 2.2

export function createGestureController(surface, element, initial, onTransform = () => {}) {
  const pointers = new Map()
  const initialTransform = {
    x: initial.mapX,
    y: initial.mapY,
    scale: initial.mapScale,
    rotation: initial.mapRotationZ,
  }
  const transform = { ...initialTransform }
  let gesture = null
  let moved = false
  let lastMovedAt = 0

  const apply = () => {
    element.style.setProperty('--map-x', `${transform.x}px`)
    element.style.setProperty('--map-y', `${transform.y}px`)
    element.style.setProperty('--map-scale', transform.scale)
    element.style.setProperty('--map-rotation-z', `${transform.rotation}deg`)
    onTransform()
  }

  const beginGesture = () => {
    const points = [...pointers.values()]
    moved = false

    if (points.length === 1) {
      gesture = {
        type: 'drag',
        startPoint: points[0],
        startX: transform.x,
        startY: transform.y,
      }
      return
    }

    if (points.length >= 2) {
      const [a, b] = points
      gesture = {
        type: 'pinch',
        startDistance: distance(a, b),
        startAngle: angle(a, b),
        startMidpoint: midpoint(a, b),
        startX: transform.x,
        startY: transform.y,
        startScale: transform.scale,
        startRotation: transform.rotation,
      }
    }
  }

  const onPointerDown = (event) => {
    if (!element.classList.contains('is-placed')) return
    pointers.set(event.pointerId, pointFrom(event))
    beginGesture()
  }

  const onPointerMove = (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return
    pointers.set(event.pointerId, pointFrom(event))
    const points = [...pointers.values()]

    if (gesture.type === 'drag' && points.length === 1) {
      const dx = points[0].x - gesture.startPoint.x
      const dy = points[0].y - gesture.startPoint.y
      if (Math.hypot(dx, dy) > 4) moved = true
      transform.x = gesture.startX + dx
      transform.y = gesture.startY + dy
      apply()
      return
    }

    if (points.length >= 2) {
      if (gesture.type !== 'pinch') beginGesture()
      const [a, b] = points
      const currentMidpoint = midpoint(a, b)
      const scaleRatio = distance(a, b) / Math.max(gesture.startDistance, 1)
      const rotationDelta = normalizeAngle(angle(a, b) - gesture.startAngle)

      moved = true
      transform.x = gesture.startX + currentMidpoint.x - gesture.startMidpoint.x
      transform.y = gesture.startY + currentMidpoint.y - gesture.startMidpoint.y
      transform.scale = clamp(gesture.startScale * scaleRatio, MIN_SCALE, MAX_SCALE)
      transform.rotation = gesture.startRotation + rotationDelta
      apply()
    }
  }

  const onPointerEnd = (event) => {
    if (!pointers.has(event.pointerId)) return
    pointers.delete(event.pointerId)
    if (moved) lastMovedAt = performance.now()
    if (pointers.size > 0) beginGesture()
    else gesture = null
  }

  const onWheel = (event) => {
    if (!element.classList.contains('is-placed')) return
    event.preventDefault()
    transform.scale = clamp(transform.scale * (event.deltaY > 0 ? 0.92 : 1.08), MIN_SCALE, MAX_SCALE)
    apply()
    lastMovedAt = performance.now()
  }

  surface.addEventListener('pointerdown', onPointerDown)
  surface.addEventListener('pointermove', onPointerMove)
  surface.addEventListener('pointerup', onPointerEnd)
  surface.addEventListener('pointercancel', onPointerEnd)
  surface.addEventListener('wheel', onWheel, { passive: false })
  apply()

  return {
    reset() {
      Object.assign(transform, initialTransform)
      apply()
    },
    wasRecentlyMoved() {
      return performance.now() - lastMovedAt < 180
    },
  }
}

function pointFrom(event) {
  return { x: event.clientX, y: event.clientY }
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function angle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function normalizeAngle(value) {
  let angleValue = value
  while (angleValue > 180) angleValue -= 360
  while (angleValue < -180) angleValue += 360
  return angleValue
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
