export type ValidationDeltaOutcome = "resolved" | "unchanged" | "changed" | "worsened";

export type ValidationDelta = {
  beforeSignature?: string;
  afterSignature?: string;
  changed: boolean;
  outcome: ValidationDeltaOutcome;
};

export function buildValidationDelta(input: {
  beforeSignature?: string | null;
  afterSignature?: string | null;
  validationPassed?: boolean;
  validationProgressed?: boolean;
  validationRegressed?: boolean;
}): ValidationDelta {
  const beforeSignature = input.beforeSignature ?? undefined;
  const afterSignature = input.afterSignature ?? undefined;

  if (input.validationPassed === true) {
    return {
      beforeSignature,
      afterSignature,
      changed: beforeSignature !== afterSignature,
      outcome: "resolved"
    };
  }

  if (input.validationRegressed === true) {
    return {
      beforeSignature,
      afterSignature,
      changed: beforeSignature !== afterSignature,
      outcome: "worsened"
    };
  }

  if (beforeSignature && afterSignature && beforeSignature === afterSignature) {
    return {
      beforeSignature,
      afterSignature,
      changed: false,
      outcome: "unchanged"
    };
  }

  if (input.validationProgressed === true || (beforeSignature && afterSignature && beforeSignature !== afterSignature)) {
    return {
      beforeSignature,
      afterSignature,
      changed: true,
      outcome: "changed"
    };
  }

  return {
    beforeSignature,
    afterSignature,
    changed: false,
    outcome: "unchanged"
  };
}
