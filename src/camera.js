export async function startCamera(video) {
  if (!window.isSecureContext) {
    throw new CameraError('insecure')
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('unsupported')
  }

  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      throw new CameraError('denied')
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      throw new CameraError('missing')
    }
    throw new CameraError('failed')
  }

  video.srcObject = stream
  video.muted = true
  video.playsInline = true

  await waitForVideo(video)
  await video.play()

  const track = stream.getVideoTracks()[0]
  if (!track || track.readyState !== 'live' || video.videoWidth === 0) {
    stopCamera(video)
    throw new CameraError('failed')
  }

  return stream
}

export function stopCamera(video) {
  const stream = video.srcObject
  stream?.getTracks().forEach((track) => track.stop())
  video.pause()
  video.srcObject = null
}

export function cameraErrorMessage(code) {
  const messages = {
    insecure: '摄像头需要可信的 HTTPS 地址。当前页面不是安全连接。',
    unsupported: '当前浏览器不支持摄像头，请使用 Android Chrome 或 iPhone Safari。',
    denied: '摄像头权限未开启，请在浏览器设置中允许后重试。',
    missing: '没有找到可用摄像头。',
    failed: '摄像头启动失败，请关闭其他占用摄像头的应用后重试。',
  }
  return messages[code] || messages.failed
}

class CameraError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}

function waitForVideo(video) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new CameraError('failed'))
    }, 10000)

    const onReady = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new CameraError('failed'))
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      video.removeEventListener('loadedmetadata', onReady)
      video.removeEventListener('error', onError)
    }

    video.addEventListener('loadedmetadata', onReady, { once: true })
    video.addEventListener('error', onError, { once: true })
  })
}
