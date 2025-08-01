import * as PIXI from 'pixi.js'
import React, { useEffect, useRef } from 'react'

import { usePlayableLoader } from '../hooks/loader'
import { PlayableClip } from '../types/loader'
import { objectFitContain } from '../utils/misc'
import { updateMediaCurrentTime } from '../utils/timeline'

type Props = {
  visualClips: PlayableClip[]
  playheadTimeMs: number
  isPlaying: boolean
  isLandscape: boolean
}

export const TimelinePlayer: React.FC<Props> = ({
  visualClips: clips,
  playheadTimeMs,
  isPlaying,
  isLandscape
}) => {
  // console.log(clips, playheadTimeMs, isPlaying)
  const isReadyRef = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const spriteRef = useRef<PIXI.Sprite | null>(null)
  const stageRef = useRef<PIXI.Container>(new PIXI.Container())
  const rendererRef = useRef<PIXI.Renderer | null>(null)

  const width = isLandscape ? 1280 : 720
  const height = isLandscape ? 720 : 1280

  const {
    loadedPlayables: loadedVisuals,
    allLoaded,
    getLoadedClipAtTime
  } = usePlayableLoader(clips)

  const initPixiApp = async () => {
    canvasRef.current!.width = width
    canvasRef.current!.height = height
    contextRef.current = canvasRef.current!.getContext('2d')
    contextRef.current!.imageSmoothingEnabled = false

    const sprite = new PIXI.Sprite()
    stageRef.current.addChild(sprite)
    // console.log("sprite", sprite);
    spriteRef.current = sprite

    try {
      rendererRef.current = await PIXI.autoDetectRenderer({
        width: width,
        height: height,
        background: 'black',
        preference: 'webgpu'
      })
      isReadyRef.current = true
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    // console.log('initPixiApp', canvasRef.current)

    if (canvasRef.current) {
      initPixiApp()
    }

    return () => {
      rendererRef.current?.destroy(true)
      rendererRef.current = null
      stageRef.current?.removeChildren()
      spriteRef.current = null
    }
  }, [])

  // More garbage...
  useEffect(() => {
    if (allLoaded) {
      loadedVisuals[0]?.video?.addEventListener(
        'timeupdate',
        () => {
          renderPrep()
          renderCanvas()
        },
        { once: true }
      )
    }
  }, [allLoaded])

  // TODO: Refactor this
  const renderPrep = () => {
    // console.log("RENDER", playheadTimeMs);
    const currentVisual = getLoadedClipAtTime(playheadTimeMs)
    // console.log("visual", currentVisual);
    if (!currentVisual) {
      // Set empty texture if no visual is found
      spriteRef.current!.texture = PIXI.Texture.EMPTY
    } else {
      // Set texture
      if (spriteRef.current!.texture?.uid !== currentVisual.texture?.uid) {
        spriteRef.current!.texture = currentVisual.texture!
      }
      // Set video time
      if (currentVisual.video) {
        updateMediaCurrentTime(currentVisual.video, currentVisual.start_ms, playheadTimeMs)
      }
      if (!isPlaying) {
        currentVisual?.video?.addEventListener(
          'seeked',
          async () => {
            renderCanvas()
          },
          { once: true }
        )
        // currentVisual?.video?.requestVideoFrameCallback(() => {
        //   renderCanvas()
        // })
      }

      // TODO: Refactor out this logic
      const container = { width, height }
      const child = {
        width: currentVisual!.texture!.width,
        height: currentVisual!.texture!.height
      }
      const rect = objectFitContain(container, child)
      spriteRef.current!.width = rect.width
      spriteRef.current!.height = rect.height
      spriteRef.current!.x = rect.x
      spriteRef.current!.y = rect.y
    }

    // Pause all other videos
    for (const v of loadedVisuals) {
      if (v.type === 'video') {
        if (v === currentVisual) {
          if (isPlaying) {
            v.video?.play()
          } else {
            v.video?.pause()
          }
        } else {
          // We do a lil trick here to set all non-current videos to time 0
          // This way the videos are immediately ready when we get to them
          if (v.video?.currentTime !== 0) {
            v.video!.currentTime = 0
          }
          v.video?.pause()
        }
      }
    }
  }

  const renderCanvas = () => {
    if (rendererRef.current?.canvas) {
      rendererRef.current?.render(stageRef.current)
      contextRef.current?.clearRect(0, 0, width, height)
      contextRef.current?.drawImage(rendererRef.current?.canvas!, 0, 0)
    }
  }

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height)
    }
    if (canvasRef.current) {
      canvasRef.current.width = width
      canvasRef.current.height = height
    }
  }, [width, height])

  // UGH this sucks...
  useEffect(() => {
    if (!isReadyRef.current) {
      return
    }
    renderPrep()
    renderCanvas()
  }, [isPlaying, playheadTimeMs])

  // useTicker(render, isPlaying);

  // if (!allLoaded) return <div>Loading video assets...</div>;

  return (
    <div className="relative flex h-full w-full">
      {!allLoaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white">
          Loading...
        </div>
      )}
      <canvas
        id="pixi-canvas"
        ref={canvasRef}
        style={{
          // aspectRatio: width / height,
          height: '100%',
          width: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}
