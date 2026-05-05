import { z } from "zod";

const patchSchema = z
  .object({
  insertBefore: z.string().optional(),
  insertAfter: z.string().optional(),
  content: z.string().optional(),
  replace: z
    .object({
      target: z.string().min(1),
      with: z.string()
    })
    .optional()
  })
  .refine((patch) => !!patch.content || !!patch.replace, {
    message: "Patch must have content or replace"
  });

const changeOperationSchema = z
  .object({
    type: z.enum(["create", "modify", "replace", "delete"]),
    path: z.string().min(1),
    content: z.string().optional(),
    patch: patchSchema.optional(),
    reason: z.string().optional()
  })
  .superRefine((op, ctx) => {
    if (op.type === "create" || op.type === "replace") {
      if (!op.content || !op.content.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${op.type} requires content` });
      }
    }

    if (op.type === "modify") {
      const hasContent = typeof op.content === "string" && op.content.trim().length > 0;
      const hasPatch = !!op.patch;
      if (!hasContent && !hasPatch) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "modify requires patch or content" });
      }
    }
  });

export const changesSchema = z.object({
  operations: z.array(changeOperationSchema)
});
