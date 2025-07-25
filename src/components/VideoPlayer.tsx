import React, { useEffect, useRef } from "react";
import type { Renderer } from 'pixi.js'
import * as PIXI from "pixi.js";
import {
  PlayableVisualClip,
  useVisualLoader,
  LoadedVisualClip,
} from "../loader";
import { useTicker } from "../tick";

type Props = {
  clips: PlayableVisualClip[];
  playheadTimeMs: number;
  isPlaying: boolean;
  width: number;
  height: number;
};

export const PixiVideoPlayer: React.FC<Props> = ({
  clips,
  playheadTimeMs,
  isPlaying,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const stageRef = useRef<PIXI.Container>(new PIXI.Container());
  const rendererRef = useRef<PIXI.Renderer | null>(null);

  const { loadedVisuals, allLoaded } = useVisualLoader(clips);

  const initPixiApp = async () => {
    if (!canvasRef.current) return;
    contextRef.current = canvasRef.current.getContext("2d");

    try {
        rendererRef.current = await PIXI.autoDetectRenderer({ width: 1920, height: 1080, background: 'black', preference: 'webgpu' })
    } catch (error) {
      console.error(error)
    }

    const sprite = new PIXI.Sprite();
    sprite.width = width;
    sprite.height = height;
    stageRef.current.addChild(sprite);
    spriteRef.current = sprite;
  };

  useEffect(() => {
    initPixiApp();
  }, []);

  const findClip = (timeMs: number): LoadedVisualClip | undefined => {
    return loadedVisuals.find(
      (visual) =>
        visual.start_ms <= timeMs &&
        visual.start_ms + visual.duration_ms > timeMs
    );
  };

  // Resize renderer on canvas size change
  useEffect(() => {
    const sprite = spriteRef.current;
    if (rendererRef.current && sprite) {
      rendererRef.current?.resize(width, height);
      sprite.width = width;
      sprite.height = height;
    }
  }, [width, height]);

  const tick = (deltaMs: number) => {
    console.log("tick", deltaMs);
    const visual = findClip(playheadTimeMs);
    if (!visual) {
      spriteRef.current!.texture = PIXI.Texture.EMPTY;
    } else {
        const localTime = playheadTimeMs - visual.start_ms;

        if (visual.video) {
          if (Math.abs(visual.video.currentTime * 1000 - localTime) > 50) {
            visual.video.currentTime = localTime / 1000;
          }
        }    
    }

    console.log("render", rendererRef.current);
    rendererRef.current?.render(stageRef.current);
    contextRef.current?.clearRect(0, 0, width, height);
    contextRef.current?.beginPath(); // Start a new path
    contextRef.current!.fillStyle = "blue";
    contextRef.current?.rect(10, 20, 100, 100); // Add a rectangle to the current path
    contextRef.current?.fill(); // Render the path
    // contextRef.current?.drawImage(rendererRef.current?.canvas!, 0, 0);
  };

  useTicker(tick, isPlaying);

  if (!allLoaded) return <div>Loading video assets...</div>;

  return (
    <div className="flex-1">
      <canvas
        ref={canvasRef}
        style={{
          width,
          height,
          maxHeight: "100%",
          maxWidth: "100%",
          backgroundColor: "red",
        }}
      />
      ;
    </div>
  );
};
