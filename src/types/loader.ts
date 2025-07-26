import z from "zod";
import { ClipSchema } from "./timeline";
import * as PIXI from "pixi.js";

export const PlayableClipSchema = ClipSchema.extend({
    type: z.enum(["image", "video", "audio"]),
    src: z.string(),
});
export type PlayableClip = z.infer<typeof PlayableClipSchema>;

export const LoadedClipSchema = PlayableClipSchema.extend({
    video: z.instanceof(HTMLVideoElement).nullable().optional(),
    image: z.instanceof(HTMLImageElement).nullable().optional(),
    audio: z.instanceof(HTMLAudioElement).nullable().optional(),
    texture: z.instanceof(PIXI.Texture).nullable().optional(),
});
export type LoadedClip = z.infer<typeof LoadedClipSchema>;
