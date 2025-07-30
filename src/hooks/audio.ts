import { usePlayableLoader } from "./loader";
import { PlayableClip } from "../types/loader";
import { updateLoadedClipTime } from "../utils/timeline";
import { useEffect } from "react";

// I mean this is basically like a component but there's no visuals
export const usePlayAudioTrack = (
    audioTrack: PlayableClip[],
    playheadTimeMs: number,
    isPlaying: boolean
) => {
    const { loadedPlayables: loadedAudio, getLoadedClipAtTime } =
        usePlayableLoader(audioTrack);

    useEffect(() => {
        const currentAudio = getLoadedClipAtTime(playheadTimeMs);
        if (currentAudio) {
            updateLoadedClipTime(currentAudio, playheadTimeMs);
        }
        for (const a of loadedAudio) {
            if (a === currentAudio) {
                if (isPlaying) {
                    a.audio?.play();
                } else {
                    a.audio?.pause();
                }
            } else {
                if (!!a.audio && a.audio?.currentTime !== 0) {
                    a.audio!.currentTime = 0;
                }
                a.audio?.pause();
            }
        }
    }, [isPlaying, playheadTimeMs]);
};
