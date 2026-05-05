import { z } from "zod";

export const reviewSchema = z.object({
  verdict: z.enum(["pass", "fail"]),
  status: z.enum(["pass", "fail"]),
  notes: z.array(z.string())
});
