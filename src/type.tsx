type ImageGenerationType = "text_to_image" | "image_to_image";

interface Timeline {
    audio_track: AudioClip[];
    visual_track: VisualClip[];
}

interface BaseClip {
    start_ms: number;
    end_ms: number;
    speaker?: string
}

interface AudioGenerationParams {
    speaker: string;
    text: string;
    speed: number;
    stability: number;
}

interface AudioClip extends BaseClip {
    type: "audio";
    audio_generation_params?: AudioGenerationParams;
    audio_task_id?: string;
    audio_asset_id?: string;
}


interface ImageGenerationParams {
    type: ImageGenerationType;
    ai_model_id: string;
    prompt: string;
    aspect_ratio: string;
}

interface ImageToImageGenerationParams extends ImageGenerationParams {
    type: "image_to_image";
    reference_image_asset_id: string;
}

interface TextToImageGenerationParams extends ImageGenerationParams {
    type: "text_to_image";
}

interface VideoGenerationParams {
    type: "video";
    ai_model_id: string;
    description: string;
    aspect_ratio: string;
}

interface VisualClip extends BaseClip {
    type: "visual";
    image_generation_params?: TextToImageGenerationParams | ImageToImageGenerationParams;
    image_task_id?: string;
    image_asset_id?: string;

    video_generation_params?: VideoGenerationParams;
    video_task_id?: string;
    video_asset_id?: string;
}