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

const safePatchSchema = z.union([
  z.object({
    type: z.literal("replace"),
    target: z.union([
      z.string().min(1),
      z.object({
        type: z.literal("exact"),
        match: z.string().min(1)
      })
    ]),
    content: z.string().optional(),
    replacement: z.string().optional()
  }).refine((patch) => typeof patch.content === "string" || typeof patch.replacement === "string", {
    message: "Safe replace patch requires content or replacement"
  }),
  z.object({
    type: z.literal("insertAfter"),
    anchor: z.object({
      text: z.string().min(1)
    }),
    content: z.string()
  }),
  z.object({
    type: z.literal("appendSafe"),
    content: z.string()
  })
]);

const changeOperationSchema = z
  .object({
    type: z.enum(["create", "modify", "replace", "delete"]),
    path: z.string().min(1),
    content: z.string().optional(),
    patch: z.union([patchSchema, safePatchSchema]).optional(),
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
