import { z } from "zod";

export const planSchema = z.object({
  steps: z.array(z.string().min(1)).min(1),
  proposedCommands: z.array(z.string())
});
