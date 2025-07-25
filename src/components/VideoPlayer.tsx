import React, { useEffect, useRef } from "react";
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
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const activeIndexRef = useRef<number | null>(null);

  const { loadedVisuals, allLoaded } = useVisualLoader(clips);

  const initPixiApp = () => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      view: canvasRef.current,
      width,
      height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      autoStart: true,
    });

    appRef.current = app;

    const sprite = new PIXI.Sprite();
    sprite.width = width;
    sprite.height = height;
    app.stage.addChild(sprite);
    spriteRef.current = sprite;

    return app;
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
    const app = appRef.current;
    const sprite = spriteRef.current;
    if (app && sprite) {
      app.renderer?.resize(width, height);
      sprite.width = width;
      sprite.height = height;
    }
  }, [width, height]);

  const tick = (deltaMs: number) => {
    const visual = findClip(playheadTimeMs);
    if (!visual) {
      spriteRef.current!.texture = PIXI.Texture.EMPTY;
      return;
    }

    const localTime = playheadTimeMs - visual.start_ms;

    if (!visual.video) return;
    if (Math.abs(visual.video.currentTime * 1000 - localTime) > 50) {
      visual.video.currentTime = localTime / 1000;
    }
  };

  useTicker(tick, isPlaying);

  if (!allLoaded) return <div>Loading video assets...</div>;

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
};
