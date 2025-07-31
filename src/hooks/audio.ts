import { usePlayableLoader } from "./loader";
import { PlayableClip } from "../types/loader";
import { useEffect, useRef, useState } from "react";

// I mean this is basically like a component but there's no visuals
export const usePlayAudioTrack = (
    audioContext: AudioContext | null,
    audioTrack: PlayableClip[],
    playheadTimeMs: number,
    isPlaying: boolean
) => {
    const { getLoadedClipAtTime } =
        usePlayableLoader(audioTrack, audioContext || undefined);
    const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        if (!audioContext) return
        const currentAudio = getLoadedClipAtTime(playheadTimeMs);
        if (currentAudio && currentAudio.audio && isPlaying) { 
            if (currentSourceRef.current?.buffer !== currentAudio.audio) {
                // Stop the current source
                currentSourceRef.current?.stop()
                currentSourceRef.current?.disconnect()
                // New source
                currentSourceRef.current = audioContext.createBufferSource()
                currentSourceRef.current.buffer = currentAudio.audio!
                currentSourceRef.current.connect(audioContext.destination)
                currentSourceRef.current.start(audioContext.currentTime, (playheadTimeMs - currentAudio.start_ms) / 1000)
            }
        } else {
            currentSourceRef.current?.stop()
            currentSourceRef.current?.disconnect()
            currentSourceRef.current = null
        }
    }, [isPlaying, playheadTimeMs]);
};
