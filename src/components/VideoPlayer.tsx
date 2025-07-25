import React, { useEffect, useLayoutEffect, useRef } from "react";
import type { Renderer } from "pixi.js";
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
    // console.log(clips, playheadTimeMs, isPlaying)
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const spriteRef = useRef<PIXI.Sprite | null>(null);
    const stageRef = useRef<PIXI.Container>(new PIXI.Container());
    const rendererRef = useRef<PIXI.Renderer | null>(null);

    const { loadedVisuals, allLoaded } = useVisualLoader(clips);

    const initPixiApp = async () => {
        contextRef.current = canvasRef.current!.getContext("2d");

        try {
            rendererRef.current = await PIXI.autoDetectRenderer({
                width: 1920,
                height: 1080,
                background: "black",
                preference: "webgpu",
            });
        } catch (error) {
            console.error(error);
        }

        const sprite = new PIXI.Sprite();
        sprite.width = width;
        sprite.height = height;
        stageRef.current.addChild(sprite);
        console.log("sprite", sprite);
        spriteRef.current = sprite;
    };

    useEffect(() => {
        console.log("initPixiApp", canvasRef.current);

        if (canvasRef.current) {
            initPixiApp();
        }

        return () => {
            rendererRef.current?.destroy(true);
            rendererRef.current = null;
            stageRef.current?.removeChildren();
            spriteRef.current = null;
            console.log("Cleaned up Pixi renderer");
        };
    }, []);

    const findClip = (timeMs: number): LoadedVisualClip | undefined => {
        return loadedVisuals.find(
            (visual) =>
                visual.start_ms <= timeMs &&
                visual.start_ms + visual.duration_ms > timeMs
        );
    };

    // // Resize renderer on canvas size change
    // useEffect(() => {
    //     const sprite = spriteRef.current;
    //     if (rendererRef.current && sprite) {
    //         rendererRef.current?.resize(width, height);
    //         sprite.width = width;
    //         sprite.height = height;
    //     }
    // }, [width, height]);

    const tick = (deltaMs: number) => {
        console.log("tick", deltaMs);
        const visual = findClip(playheadTimeMs);
        if (!visual) {
            // Set empty texture if no visual is found
            spriteRef.current!.texture = PIXI.Texture.EMPTY;
        } else {
            // Set texture
            console.log("setting texture", spriteRef.current, visual.texture);
            if (spriteRef.current!.texture?.uid !== visual.texture?.uid) {
                spriteRef.current!.texture = visual.texture!;
            }
            // Set video time
            const localTime = playheadTimeMs - visual.start_ms;
            const videoTime = visual.video!.currentTime * 1000;
            console.log("video time", videoTime, localTime);
            if (Math.abs(videoTime - localTime) > 50) {
                console.log("setting video time", localTime / 1000);
                visual.video!.currentTime = localTime / 1000;
            }
        }

        // Pause all other videos
        for (const v of loadedVisuals) {
            if (v === visual) {
                v.video?.play();
            } else {
                v.video?.pause();
            }
        }

        // Render
        console.log("render", rendererRef.current);
        rendererRef.current?.render(stageRef.current);
        contextRef.current?.clearRect(0, 0, width, height);
        contextRef.current?.drawImage(rendererRef.current?.canvas!, 0, 0);
    };

    useTicker(tick, isPlaying);

    // if (!allLoaded) return <div>Loading video assets...</div>;

    return (
        <div className="flex-1 p-4">
            <canvas
                id="pixi-canvas"
                ref={canvasRef}
                style={{
                    height: "100%",
                    width: "100%",
                    objectFit: "contain",
                }}
            />
        </div>
    );
};
