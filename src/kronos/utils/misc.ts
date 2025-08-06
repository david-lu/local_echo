export const stringifyWithoutNull = (obj: unknown): string =>
  JSON.stringify(obj, (_key, value) => (value === null ? undefined : value))

export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds
    .toString()
    .padStart(2, '0')}`
}

type Size = {
  width: number
  height: number
}

type Rect = {
  width: number
  height: number
  x: number
  y: number
}

export function objectFitContain(container: Size, child: Size): Rect {
  const containerRatio = container.width / container.height
  const childRatio = child.width / child.height

  let scale: number
  if (childRatio > containerRatio) {
    // Fit to width
    scale = container.width / child.width
  } else {
    // Fit to height
    scale = container.height / child.height
  }

  const width = child.width * scale
  const height = child.height * scale
  const x = (container.width - width) / 2
  const y = (container.height - height) / 2

  return { width, height, x, y }
}

export function hashToArrayItem(str: string, items: any[], hash = 5234): any {
  // Basic hash function (djb2)
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }

  // Ensure positive index
  const index = Math.abs(hash) % items.length
  return items[index]
}

export function isApple() {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  const isAppleDevice = /Macintosh|iPhone|iPad|iPod/.test(ua) && navigator.maxTouchPoints > 0

  const isSafari =
    /^((?!chrome|android).)*safari/i.test(ua) || (ua.includes('Version/') && ua.includes('Safari'))

  return isAppleDevice || isSafari
}

export function range(start: number, stop?: number, step: number = 1): number[] {
  let actualStart = 0
  let actualStop = start

  if (stop !== undefined) {
    actualStart = start
    actualStop = stop
  }

  const result: number[] = []
  for (let i = actualStart; i < actualStop; i += step) {
    result.push(i)
  }
  return result
} // import { getTotalDuration } from '../utils/timeline'
// Refactor this to something else
export function downloadFile(arrayBuffer: ArrayBuffer, filename: string) {
  const blob = new Blob([arrayBuffer], { type: 'video/mp4' }) // or correct MIME
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}
