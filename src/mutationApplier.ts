import { 
  Timeline, 
  AudioClip, 
  VisualClip,
  AddVisualMutation,
  AddAudioMutation,
  RemoveVisualMutation,
  RemoveAudioMutation,
  ModifyVisualMutation,
  ModifyAudioMutation
} from './type';

type AnyMutation = 
  | AddVisualMutation
  | AddAudioMutation
  | RemoveVisualMutation
  | RemoveAudioMutation
  | ModifyVisualMutation
  | ModifyAudioMutation;

/**
 * Applies a single mutation to the timeline
 */
export function applyMutation(timeline: Timeline, mutation: AnyMutation): Timeline {
  const newTimeline = {
    audio_track: [...timeline.audio_track],
    visual_track: [...timeline.visual_track]
  };

  switch (mutation.type) {
    case 'add_audio':
      newTimeline.audio_track.push(mutation.clip as AudioClip);
      break;

    case 'add_visual':
      newTimeline.visual_track.push(mutation.clip as VisualClip);
      break;

    case 'remove_audio': {
      const index = newTimeline.audio_track.findIndex(clip => clip.id === mutation.clip_id);
      if (index !== -1) newTimeline.audio_track.splice(index, 1);
      break;
    }

    case 'remove_visual': {
      const index = newTimeline.visual_track.findIndex(clip => clip.id === mutation.clip_id);
      if (index !== -1) newTimeline.visual_track.splice(index, 1);
      break;
    }

    case 'modify_audio': {
      const index = newTimeline.audio_track.findIndex(clip => clip.id === mutation.clip.id);
      if (index !== -1) newTimeline.audio_track[index] = mutation.clip as AudioClip;
      break;
    }

    case 'modify_visual': {
      const index = newTimeline.visual_track.findIndex(clip => clip.id === mutation.clip.id);
      if (index !== -1) newTimeline.visual_track[index] = mutation.clip as VisualClip;
      break;
    }
  }

  return newTimeline;
}

/**
 * Applies multiple mutations to the timeline in sequence
 */
export function applyMutations(timeline: Timeline, mutations: AnyMutation[]): Timeline {
  return mutations.reduce(applyMutation, timeline);
}

/**
 * Validates that a timeline has no overlapping clips
 */
export function validateTimeline(timeline: Timeline): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check audio track for overlaps
  for (let i = 0; i < timeline.audio_track.length; i++) {
    for (let j = i + 1; j < timeline.audio_track.length; j++) {
      const clip1 = timeline.audio_track[i];
      const clip2 = timeline.audio_track[j];
      
      if (clip1.start_ms < clip2.end_ms && clip1.end_ms > clip2.start_ms) {
        errors.push(`Audio clips ${clip1.id} and ${clip2.id} overlap`);
      }
    }
  }
  
  // Check visual track for overlaps
  for (let i = 0; i < timeline.visual_track.length; i++) {
    for (let j = i + 1; j < timeline.visual_track.length; j++) {
      const clip1 = timeline.visual_track[i];
      const clip2 = timeline.visual_track[j];
      
      if (clip1.start_ms < clip2.end_ms && clip1.end_ms > clip2.start_ms) {
        errors.push(`Visual clips ${clip1.id} and ${clip2.id} overlap`);
      }
    }
  }
  
  // Check for invalid timing
  [...timeline.audio_track, ...timeline.visual_track].forEach(clip => {
    if (clip.start_ms >= clip.end_ms) {
      errors.push(`Clip ${clip.id} has invalid timing: start_ms (${clip.start_ms}) >= end_ms (${clip.end_ms})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 