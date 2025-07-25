import React, { useEffect, useLayoutEffect, useRef } from "react";
import type { Renderer } from "pixi.js";
import * as PIXI from "pixi.js";
import {
    PlayableVisualClip,
    useVisualLoader,
    LoadedVisualClip,
} from "../loader";
import { useTicker } from "../tick";
import { objectFitContain } from "../utils";

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
    const isReadyRef = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const spriteRef = useRef<PIXI.Sprite | null>(null);
    const stageRef = useRef<PIXI.Container>(new PIXI.Container());
    const rendererRef = useRef<PIXI.Renderer | null>(null);

    const { loadedVisuals, allLoaded } = useVisualLoader(clips);

    const initPixiApp = async () => {
        canvasRef.current!.width = width;
        canvasRef.current!.height = height;
        contextRef.current = canvasRef.current!.getContext("2d");
        contextRef.current!.imageSmoothingEnabled = false;

        const sprite = new PIXI.Sprite();
        stageRef.current.addChild(sprite);
        // console.log("sprite", sprite);
        spriteRef.current = sprite;

        try {
            rendererRef.current = await PIXI.autoDetectRenderer({
                width: width,
                height: height,
                background: "black",
                preference: "webgpu",
            });
            isReadyRef.current = true;
        } catch (error) {
            console.error(error);
        }
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

    // More garbage...
    useEffect(() => {
        if (allLoaded) {
            renderPrep();
            renderCanvas();
        }
    }, [allLoaded])

    const findClip = (timeMs: number): LoadedVisualClip | undefined => {
        return loadedVisuals.find(
            (visual) =>
                visual.start_ms <= timeMs &&
                visual.start_ms + visual.duration_ms > timeMs
        );
    };

    // TODO: Refactor this
    const renderPrep = () => {
        console.log("RENDER", playheadTimeMs);
        const visual = findClip(playheadTimeMs);
        if (!visual) {
            // Set empty texture if no visual is found
            spriteRef.current!.texture = PIXI.Texture.EMPTY;
        } else {
            // Set texture
            if (spriteRef.current!.texture?.uid !== visual.texture?.uid) {
                console.log("setting texture", spriteRef.current, visual.texture);
                spriteRef.current!.texture = visual.texture!;
            }
            // Set video time
            const localTime = playheadTimeMs - visual.start_ms;
            const videoTime = visual.video!.currentTime * 1000;
            console.log("video time", playheadTimeMs, videoTime);
            if (Math.abs(videoTime - localTime) > 100) {
                console.log("setting video time", localTime / 1000);
                visual.video!.currentTime = localTime / 1000;
            }

            const container = { width, height };
            const child = { width: visual!.texture!.width, height: visual!.texture!.height };
            const rect = objectFitContain(container, child);
            console.log("rect", container, child, rect);
            spriteRef.current!.width = rect.width;
            spriteRef.current!.height = rect.height;
            spriteRef.current!.x = rect.x;
            spriteRef.current!.y = rect.y;
        }

        // Pause all other videos
        for (const v of loadedVisuals) {
            if (v === visual && isPlaying) {
                v.video?.play();
            } else {
                v.video?.pause();
            }
        }
    };

    const renderCanvas = () => {
        rendererRef.current?.render(stageRef.current);
        contextRef.current?.clearRect(0, 0, width, height);
        console.log("drawImage", rendererRef.current?.canvas);
        contextRef.current?.drawImage(rendererRef.current?.canvas!, 0, 0);
    }

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.resize(width, height);
        }
    }, [width, height]);

    // UGH this sucks...
    useEffect(() => {
        if (!isReadyRef.current) {
            return;
        }
        renderPrep();
        renderCanvas();
    }, [isPlaying, playheadTimeMs]);

    // useTicker(render, isPlaying);

    // if (!allLoaded) return <div>Loading video assets...</div>;

    return (
        <div className="flex-1 p-4">
            <canvas
                id="pixi-canvas"
                ref={canvasRef}
                style={{
                    aspectRatio: width / height,
                    height: "100%",
                    width: "100%",
                    objectFit: "contain"
                }}
            />
        </div>
    );
};
