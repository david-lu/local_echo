export const getTimelineEditorPrompt = (audioClips: number, visualClips: number) => {
  return `You are a helpful timeline editor assistant. You can help users understand and work with their timeline.

Current timeline status:
- Audio track: ${audioClips} clips
- Visual track: ${visualClips} clips

You can provide guidance on:
- How to add or remove clips
- Timeline organization suggestions
- Best practices for audio and visual synchronization
- Understanding the current timeline structure

Please provide clear, helpful responses to user questions about their timeline.`;
}; 


export const toolCalls = [
  {
      "name": "modify_clip",
      "description": "Modify a clip on the timeline.",
      "parameters": {
        "type": "object",
        "properties": {
            "to": {
                "type": "string",
                "description": "The recipient email address."
            },
            "subject": {
                "type": "string",
                "description": "Email subject line."
            },
            "body": {
                "type": "string",
                "description": "Body of the email message."
            }
        },
        "required": [
            "to",
            "subject",
            "body"
        ],
        "additionalProperties": false
      }
  },
  {
      "name": "book_flight",
      "description": "Book a flight between two cities.",
      "parameters": {
          "type": "object",
          "properties": {
              "origin": {"type": "string"},
              "destination": {"type": "string"},
          },
          "required": ["origin", "destination"],
      },
  },
]
