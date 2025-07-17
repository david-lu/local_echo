# Sample Timelines

This folder contains various sample timeline configurations for testing and demonstration purposes.

## Available Samples

### 1. `sampleTimeline.json` (Basic)
A simple timeline with basic audio and visual clips demonstrating the fundamental structure.

**Features:**
- 2 audio clips (narrator, expert)
- 3 visual clips (images and video)
- 12-second duration
- Basic speaker transitions

### 2. `presentationTimeline.json` (Complex Presentation)
A comprehensive presentation timeline with multiple speakers and overlapping content.

**Features:**
- 5 audio clips (host, dr_smith, analyst, moderator)
- 6 visual clips (slides, animations, videos)
- 52-second duration
- Multiple speaker transitions
- Overlapping audio/visual content
- Q&A session structure

### 3. `productDemo.json` (Product Demonstration)
A product demonstration timeline showcasing features and capabilities.

**Features:**
- 7 audio clips (demo_host, product_manager, tech_lead, data_scientist, sales_director)
- 7 visual clips (logo, dashboard, demos, pricing)
- 60-second duration
- Feature-focused structure
- Sales-oriented content
- Integration demonstrations

### 4. `educationalCourse.json` (Educational Content)
An educational course timeline with lessons and interactive elements.

**Features:**
- 8 audio clips (instructor)
- 7 visual clips (slides, animations, interactive demos)
- 60-second duration
- Educational structure
- Interactive exercises
- Progressive learning flow

## Usage

```typescript
// Import individual timelines
import sampleTimeline from './data/sampleTimeline.json';
import presentationTimeline from './data/presentationTimeline.json';

// Or import all timelines
import { sampleTimelines } from './data';
const { basic, presentation, productDemo, educationalCourse } = sampleTimelines;
```

## Timeline Structure

Each timeline follows the same structure:

```json
{
  "audio_track": [
    {
      "id": "unique_id",
      "type": "audio",
      "start_ms": 0,
      "end_ms": 5000,
      "speaker": "speaker_name",
      "audio_generation_params": {
        "text": "Audio content to generate",
        "speed": 1.0,
        "stability": 0.8
      },
      "audio_task_id": "task_id",
      "audio_asset_id": "asset_id"
    }
  ],
  "visual_track": [
    {
      "id": "unique_id",
      "type": "visual",
      "start_ms": 0,
      "end_ms": 5000,
      "speaker": "speaker_name",
      "image_generation_params": {
        "type": "text_to_image",
        "ai_model_id": "dall-e-3",
        "prompt": "Image generation prompt",
        "aspect_ratio": "16:9"
      },
      "image_task_id": "task_id",
      "image_asset_id": "asset_id",
      "video_generation_params": null,
      "video_task_id": null,
      "video_asset_id": null
    }
  ]
}
```

## Common Patterns

1. **Speaker Synchronization**: Audio and visual clips with the same speaker are typically aligned
2. **Overlapping Content**: Visual content often extends beyond audio clips for smooth transitions
3. **Progressive Complexity**: Later samples demonstrate more complex timing and content relationships
4. **Real-world Scenarios**: Each sample represents a different use case for timeline editing 