import { z } from 'zod'

export const RangeSchema = z
  .object({
    start_ms: z.number().describe('Start time of the span in milliseconds'),
    end_ms: z.number().describe('End time of the span in milliseconds')
  })
  .describe('A span of time in a Timeline track.')
export type Range = z.infer<typeof RangeSchema>
// Core timeline schemas

export const ClipSchema = z
  .object({
    id: z.string().describe('Unique identifier for the clip'),
    start_ms: z.number().describe('Start time of the clip in milliseconds'),
    duration_ms: z.number().describe('Duration of the clip in milliseconds'),
    speaker: z
      .string()
      .nullable()
      .describe(
        "Name of the speaker for the clips. The speaker of an audio and a visual clip should match if they're the same person."
      )
  })
  .describe('A clip is a span of time in a Timeline track.')
export type Clip = z.infer<typeof ClipSchema>
