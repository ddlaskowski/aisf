import { z } from "zod";

export const briefSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  constraints: z.array(z.string()),
  acceptanceCriteria: z.array(z.string().min(1)).min(1)
});
