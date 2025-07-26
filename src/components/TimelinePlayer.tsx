import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { usePlayableLoader } from "../hooks/loader";
import { PlayableClip, LoadedClip } from "../types/loader";
import { objectFitContain } from "../utils/misc";
import { updateLoadedClipTime } from "../utils/timeline";

type Props = {
    visualClips: PlayableClip[];
    playheadTimeMs: number;
    isPlaying: boolean;
    width: number;
    height: number;
};

export const TimelinePlayer: React.FC<Props> = ({
    visualClips: clips,
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

    const {
        loadedPlayables: loadedVisuals,
        allLoaded,
        getLoadedClipAtTime,
    } = usePlayableLoader(clips);

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
    }, [allLoaded]);

    // TODO: Refactor this
    const renderPrep = () => {
        console.log("RENDER", playheadTimeMs);
        const currentVisual = getLoadedClipAtTime(playheadTimeMs);
        console.log("visual", currentVisual);
        if (!currentVisual) {
            // Set empty texture if no visual is found
            spriteRef.current!.texture = PIXI.Texture.EMPTY;
        } else {
            // Set texture
            if (spriteRef.current!.texture?.uid !== currentVisual.texture?.uid) {
                console.log(
                    "setting texture",
                    spriteRef.current,
                    currentVisual.texture
                );
                spriteRef.current!.texture = currentVisual.texture!;
            }
            // Set video time
            updateLoadedClipTime(currentVisual, playheadTimeMs);

            const container = { width, height };
            const child = {
                width: currentVisual!.texture!.width,
                height: currentVisual!.texture!.height,
            };
            const rect = objectFitContain(container, child);
            console.log("rect", container, child, rect);
            spriteRef.current!.width = rect.width;
            spriteRef.current!.height = rect.height;
            spriteRef.current!.x = rect.x;
            spriteRef.current!.y = rect.y;
        }

        // Pause all other videos
        for (const v of loadedVisuals) {
            if (v.type === "video") {
                if (v === currentVisual && isPlaying) {
                    v.video?.play();
                } else {
                    // We do a lil trick here to set all non-current videos to time 0
                    // This way the videos are immediately ready when we get to them
                    if (v.video?.currentTime !== 0) {
                        v.video!.currentTime = 0;
                    }
                    v.video?.pause();
                }
            }
        }
    };

    const renderCanvas = () => {
        if (rendererRef.current?.canvas) {
            rendererRef.current?.render(stageRef.current);
            contextRef.current?.clearRect(0, 0, width, height);
            console.log("drawImage", rendererRef.current?.canvas);
            contextRef.current?.drawImage(rendererRef.current?.canvas!, 0, 0);
        }
    };

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
                    objectFit: "contain",
                }}
            />
        </div>
    );
};
