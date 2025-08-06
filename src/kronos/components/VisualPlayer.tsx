import React, { useEffect, useRef } from 'react'

import { usePlayableLoader } from '../hooks/loader'
import { LoadedClip, AssetClip } from '../types/timeline'
import { WrappedCanvas } from 'mediabunny'
import { objectFitContain } from '../utils/misc'

type VisualPlayerProps = {
  visualClips: AssetClip[]
  playheadTimeMs: number
  isPlaying: boolean
  isLandscape: boolean
}

export const VisualPlayer: React.FC<VisualPlayerProps> = ({
  visualClips: clips,
  playheadTimeMs,
  isPlaying,
  isLandscape
}) => {
  // Canvas logir
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  // Frame logic
  const lastIsPlayingRef = useRef(isPlaying)
  const lastPlayheadTimeMs = useRef(Infinity)
  const videoFrameIterator = useRef<AsyncGenerator<WrappedCanvas, void, unknown> | null>(null)
  const nextFrame = useRef<WrappedCanvas | null>(null)
  const asyncIndex = useRef(0)

  const width = isLandscape ? 1280 : 720
  const height = isLandscape ? 720 : 1280

  const { loadedPlayables: loadedVisuals, getLoadedClipAtTime } = usePlayableLoader(clips)

  const initCanvas = async () => {
    canvasRef.current!.width = width
    canvasRef.current!.height = height
    contextRef.current = canvasRef.current!.getContext('2d')
    contextRef.current!.fillStyle = 'black'
    contextRef.current!.imageSmoothingEnabled = false
  }

  useEffect(() => {
    if (canvasRef.current) {
      initCanvas()
    }
  }, [])

  // TODO: Every clip should have one of these to allow for some transition between clips
  const initIterator = async (visual: LoadedClip) => {
    asyncIndex.current++
    const currentAsyncIndex = asyncIndex.current
    if (videoFrameIterator.current) {
      await videoFrameIterator.current.return()
    }
    if (visual?.video) {
      const playbackTime = (playheadTimeMs - visual!.start_ms) / 1000
      videoFrameIterator.current = visual.video.canvas_sink.canvases(playbackTime)

      const currentFrame = await videoFrameIterator.current.next()
      if (currentFrame.value && currentAsyncIndex === asyncIndex.current) {
        drawFrameCanvas(currentFrame.value.canvas)
      }
      nextFrame.current = (await videoFrameIterator.current.next()).value ?? null
    }
  }

  const tickNextFrame = async () => {
    asyncIndex.current++
    const currentAsyncIndex = asyncIndex.current
    const currentVisual = getLoadedClipAtTime(playheadTimeMs)
    let newNextFrame: WrappedCanvas | null = nextFrame.current

    const playbackTime = (playheadTimeMs - currentVisual!.start_ms) / 1000

    while (newNextFrame && newNextFrame.timestamp <= playbackTime) {
      newNextFrame = (await videoFrameIterator.current!.next()).value ?? null
      if (!newNextFrame) {
        return
      }
      if (currentAsyncIndex === asyncIndex.current) {
        drawFrameCanvas(newNextFrame.canvas)
      }
    }
    nextFrame.current = newNextFrame
  }

  const drawFrameCanvas = (frame: HTMLCanvasElement | HTMLImageElement | OffscreenCanvas) => {
    const rect = objectFitContain({ width, height }, { width: frame.width, height: frame.height })
    contextRef.current?.fillRect(0, 0, width, height)
    contextRef.current?.drawImage(frame, rect.x, rect.y, rect.width, rect.height)
  }

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width
      canvasRef.current.height = height
    }
  }, [width, height])

  useEffect(() => {
    const lastVisual = getLoadedClipAtTime(lastPlayheadTimeMs.current)
    const visual = getLoadedClipAtTime(playheadTimeMs)
    const notPlaying = !isPlaying && !lastIsPlayingRef.current
    const differentVisual = visual !== lastVisual
    // console.log(visual)
    if (!visual) {
      contextRef.current?.fillRect(0, 0, width, height)
    } else if (visual?.image) {
      // console.log('draw image frame')
      asyncIndex.current++
      drawFrameCanvas(visual.image)
    } else if (notPlaying || differentVisual) {
      // console.log('init iterator')
      initIterator(visual!)
    } else if (isPlaying) {
      // console.log('tick next frame')
      tickNextFrame()
    }

    lastPlayheadTimeMs.current = playheadTimeMs
    lastIsPlayingRef.current = isPlaying
  }, [isPlaying, playheadTimeMs, loadedVisuals])

  // useTicker(render, isPlaying);

  // if (!allLoaded) return <div>Loading video assets...</div>;

  return (
    <canvas
      id="canvas"
      ref={canvasRef}
      style={{
        // aspectRatio: width / height,
        height: '100%',
        width: '100%',
        display: 'block',
        objectFit: 'contain'
      }}
    />
  )
}
