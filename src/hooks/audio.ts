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

    console.log('loadedAudio', loadedAudio)

    useEffect(() => {
        const currentAudio = getLoadedClipAtTime(playheadTimeMs);
        if (currentAudio) {
            updateLoadedClipTime(currentAudio, playheadTimeMs);
        }
        for (const a of loadedAudio) {
            if (a === currentAudio && isPlaying) {
                a.audio?.play();
            } else {
                a.audio?.pause();
            }
        }
    }, [isPlaying, playheadTimeMs]);
};
