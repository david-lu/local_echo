import { TimelineSchema, Timeline } from './type';

// Convert JSON to Timeline with Zod validation
export function parseTimeline(jsonData: unknown): Timeline {
  return TimelineSchema.parse(jsonData);
}

// Safe parse - returns null if validation fails
export function safeParseTimeline(jsonData: unknown): Timeline | null {
  const result = TimelineSchema.safeParse(jsonData);
  return result.success ? result.data : null;
}


// Example usage:
// const myTimeline = parseTimeline(jsonData);
// const safeTimeline = safeParseTimeline(jsonData); 