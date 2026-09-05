import { locations } from './data/locations.js'

export function createPaperMap(layer, anchorLayer, onSelect) {
  const markers = new Map()
  const anchors = new Map()

  locations.forEach((location) => {
    const anchor = document.createElement('span')
    anchor.className = 'map-anchor'
    anchor.style.left = `${location.x}%`
    anchor.style.top = `${location.y}%`
    anchorLayer.appendChild(anchor)
    anchors.set(location.id, anchor)

    const marker = document.createElement('button')
    marker.type = 'button'
    marker.className = 'building-marker'
    marker.dataset.locationId = location.id
    marker.setAttribute('aria-label', `${location.number} ${location.name}`)
    applyLocationVariables(marker, location)

    const activationRing = document.createElement('span')
    activationRing.className = 'activation-ring'

    const contactShadow = document.createElement('span')
    contactShadow.className = 'contact-shadow'

    const art = document.createElement('span')
    art.className = 'paper-building'

    for (let layerIndex = location.thickness; layerIndex >= 1; layerIndex -= 1) {
      const backLayer = createImageLayer(location, 'paper-building__back')
      backLayer.style.setProperty('--edge-x', `${layerIndex * 0.7}px`)
      backLayer.style.setProperty('--edge-y', `${layerIndex * 0.55}px`)
      art.appendChild(backLayer)
    }

    art.appendChild(createImageLayer(location, 'paper-building__face'))

    marker.append(activationRing, contactShadow, art)
    marker.addEventListener('click', () => onSelect(location))
    layer.appendChild(marker)
    markers.set(location.id, marker)
  })

  const sync = (board, stage) => {
    const boardRect = board.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()

    locations.forEach((location) => {
      const point = anchors.get(location.id).getBoundingClientRect()
      const marker = markers.get(location.id)
      const width = boardRect.width * location.width / 100 * 0.72
      marker.style.left = `${point.left - stageRect.left}px`
      marker.style.top = `${point.top - stageRect.top}px`
      marker.style.width = `${width}px`
      marker.style.height = `${width / location.aspectRatio}px`
      marker.style.zIndex = String(Math.round(point.top))
    })
  }

  const trackPlacement = (board, stage, startedAt = performance.now()) => {
    sync(board, stage)
    if (performance.now() - startedAt < 800) {
      requestAnimationFrame(() => trackPlacement(board, stage, startedAt))
    }
  }

  return {
    place(board) {
      board.classList.remove('is-placed')
      layer.classList.remove('is-placed')
      void board.offsetWidth
      board.classList.add('is-placed')
      layer.classList.add('is-placed')
      trackPlacement(board, board.parentElement)
    },
    hide() {
      layer.classList.remove('is-placed')
    },
    sync,
    select(locationId) {
      layer.classList.toggle('has-selection', Boolean(locationId))
      markers.forEach((marker, id) => marker.classList.toggle('is-selected', id === locationId))
    },
    locations,
  }
}

function applyLocationVariables(marker, location) {
  marker.style.setProperty('--shadow-blur', `${location.shadowBlur}px`)
  marker.style.setProperty('--shadow-offset', `${location.shadowOffset}px`)
  marker.style.setProperty('--glow-strength', location.glowStrength)
  marker.style.setProperty('--rise-delay', `${location.riseDelay}ms`)
  marker.style.setProperty('--rise-duration', `${location.riseDuration}ms`)
}

function createImageLayer(location, extraClass) {
  const viewport = document.createElement('span')
  viewport.className = `paper-building__viewport ${extraClass}`

  const image = document.createElement('img')
  image.src = location.image
  image.alt = ''
  image.draggable = false

  viewport.appendChild(image)
  return viewport
}
