import { usePlayableLoader } from "./loader";
import { PlayableClip } from "../types/loader";

// I mean this is basically like a component but there's no visuals
const usePlayAudioTrack = (audioClips: PlayableClip[], playheadTimeMs: number, isPlaying: boolean) => {
    const {loadedPlayables: loadedAudio, getLoadedClipAtTime} = usePlayableLoader(audioClips);

    

}