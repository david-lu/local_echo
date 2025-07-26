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
        const audio = getLoadedClipAtTime(playheadTimeMs);
        if (audio) {
            updateLoadedClipTime(audio, playheadTimeMs);
        }
        for (const a of loadedAudio) {
            if (a.data === audio && isPlaying) {
                a.data?.audio?.play();
            } else {
                a.data?.audio?.pause();
            }
        }
    }, [isPlaying, playheadTimeMs]);
};
