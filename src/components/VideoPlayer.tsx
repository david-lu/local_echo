import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import {
  PlayableVisualClip,
  useVisualLoader,
  LoadedVisualClip,
} from "../loader";

type Props = {
  clips: PlayableVisualClip[];
  playheadTimeMs: number;
  width: number;
  height: number;
};

export const PixiVideoPlayer: React.FC<Props> = ({
  clips,
  playheadTimeMs,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const activeIndexRef = useRef<number | null>(null);

  const { loadedVisuals, allLoaded } = useVisualLoader(clips);

  // Clean up any existing app
  const cleanup = () => {
    appRef.current?.destroy(true, { children: true, texture: true });
    appRef.current = null;
    spriteRef.current = null;

    loadedVisuals.forEach(({ video }) => {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    });
  };

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

  const bindTicker = (app: PIXI.Application) => {
    console.log("bindTicker", app);
    app.ticker.add(() => {
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
    });
  };

  const findClip = (timeMs: number): LoadedVisualClip | undefined => {
    return loadedVisuals.find(
      (visual) =>
        visual.start_ms <= timeMs &&
        visual.start_ms + visual.duration_ms > timeMs
    );
  };

  // Handle full app init and cleanup when loadedVideos change
  useEffect(() => {
    const app = initPixiApp();
    bindTicker(app!);
    return cleanup;
  }, []);

  // Resize renderer on canvas size change
  useEffect(() => {
    const app = appRef.current;
    const sprite = spriteRef.current;
    if (app && sprite) {
      app.renderer.resize(width, height);
      sprite.width = width;
      sprite.height = height;
    }
  }, [width, height]);

  if (!allLoaded) return <div>Loading video assets...</div>;

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
};
