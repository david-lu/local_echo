import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { usePreloadVideosWithQueries } from '../loader';

interface VideoClip {
  src: string;
  startTimeMs: number;
  durationMs: number;
}

type Props = {
  clips: VideoClip[]; 
  currentTimeMs: number;
  width: number;
  height: number;
};

export const PixiVideoPlayer: React.FC<Props> = ({ clips, currentTimeMs, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const activeIndexRef = useRef<number | null>(null);

  const { loadedVideos, allLoaded } = usePreloadVideosWithQueries(clips);

  useEffect(() => {
    if (!canvasRef.current || !allLoaded) return;

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

    const textures = loadedVideos.map(({ video }) => PIXI.Texture.from(video!));

    app.ticker.add(() => {
      const index = findClipIndex(currentTimeMs);
      if (index === null) return;

      const { video, clip } = loadedVideos[index];
      const localTime = currentTimeMs - clip.startTimeMs;

      if (!video) return;
      if (Math.abs(video.currentTime * 1000 - localTime) > 50) {
        video.currentTime = localTime / 1000;
      }

      textures[index].update();

      if (activeIndexRef.current !== index) {
        sprite.texture = textures[index];
        activeIndexRef.current = index;
      }
    });

    return () => {
      app.destroy(true, { children: true, texture: true });
      for (const { video } of loadedVideos) {
        video?.pause();
        video?.removeAttribute('src');
        video?.load();
      }
    };
  }, [allLoaded, loadedVideos]);

  useEffect(() => {
    const app = appRef.current;
    const sprite = spriteRef.current;

    if (app && sprite) {
      app.renderer.resize(width, height);
      sprite.width = width;
      sprite.height = height;
    }
  }, [width, height]);

  function findClipIndex(ms: number): number | null {
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      if (ms >= clip.startTimeMs && ms < clip.startTimeMs + clip.durationMs) {
        return i;
      }
    }
    return null;
  }

  if (!allLoaded) return <div>Loading video assets...</div>;

  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
};
