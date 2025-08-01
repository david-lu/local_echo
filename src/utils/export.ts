import {
  ALL_FORMATS,
  AudioBufferSource,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  QUALITY_HIGH,
  VideoSampleSink
} from 'mediabunny'

import { PlayableClip } from '../types/loader'
import { objectFitContain, range } from './misc'
// import { getTotalDuration } from '../utils/timeline'

// Refactor this to something else
function downloadFile(arrayBuffer: ArrayBuffer, filename: string) {
  const blob = new Blob([arrayBuffer], { type: 'video/mp4' }) // or correct MIME
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

interface VideoExportOptions {
  fps: number
  quality: Quality
  width: number
  height: number
}

export async function exportAudio(
  clips: PlayableClip[],
  audioContext: BaseAudioContext
): Promise<Blob> {
  const decodedClips = await Promise.all(
    clips.map(async (clip) => {
      const fullBuffer = await fetchAndDecodeAudio(audioContext, clip.src)
      const trimmed = trimAudioBuffer(audioContext, fullBuffer, clip.duration_ms)
      return { buffer: trimmed, startOffset: clip.start_ms }
    })
  )

  const finalBuffer = placeAudioBuffersOnTimeline(audioContext, decodedClips)
  const blob = audioBufferToWavBlob(finalBuffer)
  return blob
}

async function fetchAndDecodeAudio(ctx: BaseAudioContext, src: string): Promise<AudioBuffer> {
  const arrayBuffer = await fetch(src).then((res) => res.arrayBuffer())
  return ctx.decodeAudioData(arrayBuffer)
}

function trimAudioBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  duration_ms: number,
  offset_ms: number = 0
): AudioBuffer {
  const sampleRate = buffer.sampleRate
  const start = Math.floor((offset_ms / 1000) * sampleRate)
  const length = Math.floor((duration_ms / 1000) * sampleRate)
  const trimmed = ctx.createBuffer(buffer.numberOfChannels, length, sampleRate)

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const channel = buffer.getChannelData(ch).slice(start, start + length)
    trimmed.copyToChannel(channel, ch)
  }

  return trimmed
}

function placeAudioBuffersOnTimeline(
  ctx: BaseAudioContext,
  buffersWithOffsets: { buffer: AudioBuffer; startOffset: number }[]
): AudioBuffer {
  const sampleRate = buffersWithOffsets[0]!.buffer.sampleRate
  const channels = buffersWithOffsets[0]!.buffer.numberOfChannels

  const totalDurationMs = Math.max(
    ...buffersWithOffsets.map(({ buffer, startOffset }) => startOffset + buffer.duration * 1000)
  )
  const totalLength = Math.ceil((totalDurationMs / 1000) * sampleRate)

  const output = ctx.createBuffer(channels, totalLength, sampleRate)

  for (const { buffer, startOffset } of buffersWithOffsets) {
    const offsetSamples = Math.floor((startOffset / 1000) * sampleRate)
    for (let ch = 0; ch < channels; ch++) {
      const outData = output.getChannelData(ch)
      const inData = buffer.getChannelData(ch)
      for (let i = 0; i < inData.length; i++) {
        outData[offsetSamples + i]! += inData[i]!
      }
    }
  }

  return output
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = length * blockAlign
  const totalSize = 44 + dataSize
  const view = new DataView(new ArrayBuffer(totalSize))

  let offset = 0
  const writeStr = (str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset++, str.charCodeAt(i))
  }
  const write32 = (val: number) => {
    view.setUint32(offset, val, true)
    offset += 4
  }
  const write16 = (val: number) => {
    view.setUint16(offset, val, true)
    offset += 2
  }

  writeStr('RIFF')
  write32(36 + dataSize)
  writeStr('WAVEfmt ')
  write32(16)
  write16(1)
  write16(numChannels)
  write32(sampleRate)
  write32(byteRate)
  write16(blockAlign)
  write16(bytesPerSample * 8)
  writeStr('data')
  write32(dataSize)

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = buffer.getChannelData(ch)[i]!
      sample = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([view.buffer], { type: 'audio/wav' })
}

export async function exportVideo(
  visualClips: PlayableClip[],
  audioClips: PlayableClip[],
  filename: string,
  audioContext: BaseAudioContext,
  options: VideoExportOptions = {
    fps: 30,
    quality: QUALITY_HIGH,
    width: 1920,
    height: 1080
  }
) {
  // An Output represents a new media file
  const output = new Output({
    format: new Mp4OutputFormat(), // The format of the file
    target: new BufferTarget() // Where to write the file (here, to memory)
  })

  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  const ctx = canvas.getContext('2d')

  // Example: add a video track driven by a canvas
  const videoSource = new CanvasSource(canvas, {
    codec: 'avc',
    bitrate: QUALITY_HIGH
  })
  output.addVideoTrack(videoSource)

  // Example: add an audio track driven by AudioBuffers
  const audioSource = new AudioBufferSource({
    codec: 'opus',
    bitrate: QUALITY_HIGH
  })
  output.addAudioTrack(audioSource)

  await output.start()

  // const totalDuration = Math.max(getTotalDuration(visualClips), getTotalDuration(audioClips))
  // TODO: Experiment with different Video Source and Sinks to see if we can get better performance
  let lastFrameTime = 0
  for (const clip of visualClips) {
    if (lastFrameTime < clip.start_ms / 1000) {
      // GAP DETECTED!
      ctx!.clearRect(0, 0, options.width, options.height)
      await videoSource.add(lastFrameTime, clip.start_ms / 1000)
      lastFrameTime = clip.start_ms / 1000
    }
    lastFrameTime = (clip.start_ms + clip.duration_ms) / 1000

    if (clip.type === 'video') {
      const file = await fetch(clip.src)
      const blob = await file.blob()
      const input = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(blob)
      })
      const videoTrack = await input.getPrimaryVideoTrack()
      const sink = new VideoSampleSink(videoTrack!)

      const fit = objectFitContain(
        { width: options.width, height: options.height },
        { width: videoTrack?.displayWidth!, height: videoTrack?.displayHeight! }
      )

      const frames = range(0, clip.duration_ms / 1000, 1 / options.fps)
      for await (const sample of sink.samplesAtTimestamps(frames)) {
        if (sample) {
          console.log('drawing frame', sample.timestamp)
          ctx?.clearRect(0, 0, options.width, options.height)
          sample.draw(ctx!, fit.x, fit.y, fit.width, fit.height)
          sample.close()
          await videoSource.add(clip.start_ms / 1000 + sample.timestamp, sample.duration)
        }
      }
    } else if (clip.type === 'image') {
      const response = await fetch(clip.src)
      const blob = await response.blob()
      const src = URL.createObjectURL(blob)
      const imageElement = await loadImage(src)

      const fit = objectFitContain(
        { width: options.width, height: options.height },
        { width: imageElement.width, height: imageElement.height }
      )

      ctx?.clearRect(0, 0, options.width, options.height)
      ctx?.drawImage(imageElement, fit.x, fit.y, fit.width, fit.height)
      imageElement.remove()
      URL.revokeObjectURL(src)
      await videoSource.add(clip.start_ms / 1000, 1 / options.fps)
    }
  }

  await output.finalize()

  const audioBlob = await exportAudio(audioClips, audioContext)
  const url = URL.createObjectURL(audioBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'combined.wav'
  a.click()

  const buffer = output.target.buffer // ArrayBuffer containing the final MP4 file
  downloadFile(buffer!, filename)
}
