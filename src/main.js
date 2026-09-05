import './style.css'
import { cameraErrorMessage, startCamera, stopCamera } from './camera.js'
import { createGestureController } from './gestures.js'
import { createPaperMap } from './paperMap.js'
import { mapMeta, mapSettings } from './data/locations.js'

const entryScreen = document.querySelector('#entryScreen')
const cameraScreen = document.querySelector('#cameraScreen')
const cameraVideo = document.querySelector('#cameraVideo')
const startButton = document.querySelector('#startButton')
const exitButton = document.querySelector('#exitButton')
const errorMessage = document.querySelector('#errorMessage')
const placeButton = document.querySelector('#placeButton')
const resetButton = document.querySelector('#resetButton')
const gestureHint = document.querySelector('#gestureHint')
const mapStage = document.querySelector('#mapStage')
const mapBoard = document.querySelector('#mapBoard')
const anchorLayer = document.querySelector('#anchorLayer')
const buildingLayer = document.querySelector('#buildingLayer')
const locationSheet = document.querySelector('#locationSheet')
const sheetClose = document.querySelector('#sheetClose')
const locationNumber = document.querySelector('#locationNumber')
const locationName = document.querySelector('#locationName')
const locationDescription = document.querySelector('#locationDescription')
const enterButton = document.querySelector('#enterButton')
const transitionScreen = document.querySelector('#transitionScreen')
const transitionName = document.querySelector('#transitionName')
const returnButton = document.querySelector('#returnButton')

let selectedLocation = null
let stream = null
let experienceEntered = false
let locationOpenTimer = null

applyMapSettings()
document.documentElement.style.setProperty('--entry-map-texture', `url("${mapMeta.src}")`)
const paperMap = createPaperMap(buildingLayer, anchorLayer, (location) => {
  if (gestures.wasRecentlyMoved()) return
  openLocation(location)
})
const gestures = createGestureController(mapStage, mapBoard, mapSettings, () => paperMap.sync(mapBoard, mapStage))

startButton.addEventListener('click', async () => {
  startButton.disabled = true
  startButton.textContent = '正在进入…'
  errorMessage.textContent = ''

  try {
    try {
      await screen.orientation?.lock?.('landscape')
    } catch {
      // Unsupported browsers and disabled auto-rotate continue without blocking.
    }
    experienceEntered = true
    stream = await startCamera(cameraVideo)
    cameraScreen.classList.add('is-active')
    cameraScreen.setAttribute('aria-hidden', 'false')
    entryScreen.classList.add('is-closed')
    document.body.classList.add('camera-active')
    scheduleMapSync()
  } catch (error) {
    errorMessage.textContent = cameraErrorMessage(error?.code)
    startButton.disabled = false
    startButton.textContent = '重新尝试'
  }
})

placeButton.addEventListener('click', () => {
  gestures.reset()
  paperMap.place(mapBoard)
  paperMap.sync(mapBoard, mapStage)
  placeButton.classList.add('is-hidden')
  resetButton.hidden = false
  gestureHint.classList.add('is-visible')
  window.setTimeout(() => gestureHint.classList.remove('is-visible'), 2800)
})

resetButton.addEventListener('click', () => {
  closeLocation()
  gestures.reset()
})

exitButton.addEventListener('click', exitCamera)
sheetClose.addEventListener('click', closeLocation)

mapStage.addEventListener('click', (event) => {
  if (event.target.closest('.building-marker') || gestures.wasRecentlyMoved()) return
  closeLocation()
})

enterButton.addEventListener('click', () => {
  if (!selectedLocation) return
  transitionName.textContent = `${selectedLocation.number} ${selectedLocation.name}`
  transitionScreen.classList.add('is-active')
  transitionScreen.setAttribute('aria-hidden', 'false')
})

returnButton.addEventListener('click', () => {
  transitionScreen.classList.remove('is-active')
  transitionScreen.setAttribute('aria-hidden', 'true')
  closeLocation()
})

window.addEventListener('pagehide', () => stopCamera(cameraVideo))
window.addEventListener('resize', scheduleMapSync)
window.addEventListener('orientationchange', scheduleMapSync)
window.visualViewport?.addEventListener('resize', scheduleMapSync)
screen.orientation?.addEventListener?.('change', scheduleMapSync)

function openLocation(location) {
  window.clearTimeout(locationOpenTimer)
  selectedLocation = location
  paperMap.select(location.id)
  locationNumber.textContent = location.number
  locationName.textContent = location.name
  locationDescription.textContent = location.description
  locationSheet.classList.remove('is-open')
  locationSheet.setAttribute('aria-hidden', 'true')
  locationOpenTimer = window.setTimeout(() => {
    if (selectedLocation?.id !== location.id) return
    locationSheet.classList.add('is-open')
    locationSheet.setAttribute('aria-hidden', 'false')
  }, 150)
}

function closeLocation() {
  window.clearTimeout(locationOpenTimer)
  selectedLocation = null
  paperMap.select(null)
  locationSheet.classList.remove('is-open')
  locationSheet.setAttribute('aria-hidden', 'true')
}

function exitCamera() {
  closeLocation()
  transitionScreen.classList.remove('is-active')
  stopCamera(cameraVideo)
  stream = null
  mapBoard.classList.remove('is-placed')
  paperMap.hide()
  cameraScreen.classList.remove('is-active')
  cameraScreen.setAttribute('aria-hidden', 'true')
  entryScreen.classList.remove('is-closed')
  document.body.classList.remove('camera-active')
  placeButton.classList.remove('is-hidden')
  resetButton.hidden = true
  startButton.disabled = false
  startButton.textContent = experienceEntered ? '重新进入' : '进入体验'
}

function applyMapSettings() {
  mapBoard.style.setProperty('--map-width', `${mapSettings.mapWidth}vw`)
  mapBoard.style.setProperty('--landscape-scale', mapSettings.landscapeScale)
  mapBoard.style.setProperty('--map-rotation-x', `${mapSettings.mapRotationX}deg`)
}

function scheduleMapSync() {
  requestAnimationFrame(() => paperMap.sync(mapBoard, mapStage))
}
