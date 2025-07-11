export const timelineEditorFunction = {
  name: "modify_timeline",
  description: "Modifies the timeline by adding or removing audio and visual clips",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      events: {
        type: "array",
        description: "Array of timeline modification events",
        items: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description: "The action to perform on the timeline",
              enum: ["add", "remove"]
            },
            track: {
              type: "string",
              description: "The track to modify",
              enum: ["audio", "visual"]
            },
            clip: {
              type: "object",
              description: "Clip data for add operations",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the clip"
                },
                type: {
                  type: "string",
                  description: "Type of clip",
                  enum: ["audio", "visual"]
                },
                start_ms: {
                  type: "number",
                  description: "Start time in milliseconds"
                },
                end_ms: {
                  type: "number",
                  description: "End time in milliseconds"
                },
                speaker: {
                  type: "string",
                  description: "Speaker for the current clip"
                },
                audio_generation_params: {
                  type: "object",
                  description: "Audio generation parameters",
                  properties: {
                    text: {
                      type: "string",
                      description: "Text to convert to speech"
                    },
                    speed: {
                      type: "number",
                      description: "Speech speed"
                    },
                    stability: {
                      type: "number",
                      description: "Speech stability"
                    }
                  },
                  required: ["text", "speed", "stability"],
                  additionalProperties: false
                }
              },
              required: ["id", "type", "start_ms", "end_ms", "speaker"],
              additionalProperties: false
            },
            targetId: {
              type: "string",
              description: "ID of clip to remove"
            }
          },
          required: ["action", "track"],
          additionalProperties: false
        }
      },
      message: {
        type: "string",
        description: "Human readable description of the changes made"
      }
    },
    additionalProperties: false,
    required: ["events", "message"]
  }
};

export const getTimelineEditorPrompt = (audioClips: number, visualClips: number) => {
  return `You are a timeline editor. Modify the timeline by adding or removing audio and visual clips.

Current timeline:
- Audio track: ${audioClips} clips
- Visual track: ${visualClips} clips

Available actions: add, remove
Available tracks: audio, visual

Generate unique IDs for new clips using the format: clip_[timestamp]_[random]`;
}; 