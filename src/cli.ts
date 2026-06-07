#!/usr/bin/env node
import 'dotenv/config';
import path from "node:path";
import fs from "fs-extra";
import { Command } from "commander";
import chalk from "chalk";
import { z } from "zod";
import { runTask } from "./orchestrator/runTask.js";
import { getRunsIndexPath, type RunsIndex } from "./repair/runIndex.js";
import {
  buildMissingRunIndexDashboard,
  buildRunIndexDashboard,
  renderRunIndexDashboardText,
  RUN_INDEX_DASHBOARD_STATUSES,
  type RunIndexDashboardOptions
} from "./repair/runIndexDashboard.js";
import { exportRunIndexDashboard, type RunIndexExportFormat } from "./repair/runIndexExport.js";
import {
  exportGovernanceInsights,
  loadGovernanceInsights,
  renderGovernanceInsightsMarkdown
} from "./repair/governanceInsights.js";
import {
  isGovernancePolicyProfileName,
  listGovernancePolicyProfiles,
  type GovernancePolicyProfileName
} from "./repair/governancePolicyProfile.js";
import {
  buildGovernanceCiSummary,
  exportGovernanceCiSummary,
  renderGovernanceCiSummaryMarkdown
} from "./repair/governanceCiSummary.js";
import { renderCliControlledProjectGenerationApprovalBoundaryContract, renderCliControlledProjectGenerationContractBundle, renderCliControlledProjectGenerationDesignContract, renderCliControlledProjectGenerationInputContract, renderCliControlledProjectGenerationMutationBoundaryContract, renderCliControlledProjectGenerationOutputContract, renderCliControlledProjectGenerationRuntimeBoundaryContract, renderCliGovernanceArtifactQueryResult, renderCliGovernanceArtifactReviewPack, renderCliGovernanceArtifactSnapshot, renderCliGovernanceConsolidationAudit, renderCliProjectGenerationApprovalPlanPreview, renderCliProjectGenerationBlueprintPreview, renderCliProjectGenerationCapabilityMap, renderCliProjectGenerationDependencyPlanPreview, renderCliProjectGenerationFilePlanPreview, renderCliProjectGenerationPlanBundlePreview, renderCliProjectGenerationReadinessAssessment, renderCliProjectGenerationReadinessCompletionAudit, renderCliProjectGenerationRiskPlanPreview, renderCliProjectGenerationRollbackPlanPreview, renderCliProjectGenerationValidationPlanPreview } from "./cli/render/cliArtifactRenderer.js";
import { createGovernanceArtifactIndex } from "./governance/governanceArtifactIndex.js";
import {
  createGovernanceArtifactExportContract,
  createGovernanceArtifactExportPayload,
  exportGovernanceArtifactQueryResultAsJson,
  exportGovernanceArtifactQueryResultAsMarkdown,
  type GovernanceArtifactExportFormat
} from "./governance/governanceArtifactExport.js";
import { queryPreviewOnlyGovernanceArtifacts, type GovernanceArtifactQueryResult } from "./governance/governanceArtifactQuery.js";
import {
  createExportSnapshotSection,
  createGovernanceArtifactSnapshot,
  createQuerySnapshotSection,
  type GovernanceArtifactSnapshot
} from "./governance/governanceArtifactSnapshot.js";
import {
  createGovernanceArtifactReviewPack,
  createReviewPackExportSection,
  createReviewPackOverviewSection,
  createReviewPackQuerySection,
  createReviewPackSnapshotSection,
  type GovernanceArtifactReviewPack
} from "./governance/governanceArtifactReviewPack.js";
import {
  createAuditArtifactPipelineSection,
  createAuditCliSection,
  createAuditInvariantsSection,
  createAuditReadonlyGuaranteeSection,
  createAuditRendererSection,
  createAuditSchemaSection,
  createAuditValidationSuiteSection,
  createGovernanceConsolidationAudit,
  type GovernanceConsolidationAudit
} from "./governance/governanceConsolidationAudit.js";
import {
  createProjectGenerationApprovalPlanPreview,
  type ProjectGenerationApprovalPlanPreview
} from "./governance/projectGenerationApprovalPlanPreview.js";
import {
  createProjectGenerationRiskPlanPreview,
  type ProjectGenerationRiskPlanPreview
} from "./governance/projectGenerationRiskPlanPreview.js";
import {
  createProjectGenerationRollbackPlanPreview,
  type ProjectGenerationRollbackPlanPreview
} from "./governance/projectGenerationRollbackPlanPreview.js";
import {
  createProjectGenerationPlanBundlePreview,
  type ProjectGenerationPlanBundlePreview
} from "./governance/projectGenerationPlanBundlePreview.js";
import {
  createProjectGenerationReadinessCompletionAudit,
  type ProjectGenerationReadinessCompletionAudit
} from "./governance/projectGenerationReadinessCompletionAudit.js";
import {
  createControlledProjectGenerationDesignContract,
  type ControlledProjectGenerationDesignContract
} from "./governance/controlledProjectGenerationDesignContract.js";
import {
  createControlledProjectGenerationInputContract,
  type ControlledProjectGenerationInputContract
} from "./governance/controlledProjectGenerationInputContract.js";
import {
  createControlledProjectGenerationOutputContract,
  type ControlledProjectGenerationOutputContract
} from "./governance/controlledProjectGenerationOutputContract.js";
import {
  createControlledProjectGenerationMutationBoundaryContract,
  type ControlledProjectGenerationMutationBoundaryContract
} from "./governance/controlledProjectGenerationMutationBoundaryContract.js";
import {
  createControlledProjectGenerationApprovalBoundaryContract,
  type ControlledProjectGenerationApprovalBoundaryContract
} from "./governance/controlledProjectGenerationApprovalBoundaryContract.js";
import {
  createControlledProjectGenerationRuntimeBoundaryContract,
  type ControlledProjectGenerationRuntimeBoundaryContract
} from "./governance/controlledProjectGenerationRuntimeBoundaryContract.js";
import {
  createControlledProjectGenerationContractBundle,
  type ControlledProjectGenerationContractBundle
} from "./governance/controlledProjectGenerationContractBundle.js";
import {
  createProjectGenerationBlueprintPreview,
  type ProjectGenerationBlueprintPreview
} from "./governance/projectGenerationBlueprintPreview.js";
import {
  createProjectGenerationCapabilityMap,
  type ProjectGenerationCapabilityMap
} from "./governance/projectGenerationCapabilityMap.js";
import {
  createProjectGenerationDependencyPlanPreview,
  type ProjectGenerationDependencyPlanPreview
} from "./governance/projectGenerationDependencyPlanPreview.js";
import {
  createProjectGenerationFilePlanPreview,
  type ProjectGenerationFilePlanPreview
} from "./governance/projectGenerationFilePlanPreview.js";
import {
  createProjectGenerationValidationPlanPreview,
  type ProjectGenerationValidationPlanPreview
} from "./governance/projectGenerationValidationPlanPreview.js";
import {
  createArtifactPipelineReadinessSection,
  createBuilderAgentReadinessSection,
  createCliInspectionReadinessSection,
  createGovernanceConsolidationReadinessSection,
  createHumanApprovalReadinessSection,
  createOrchestrationReadinessSection,
  createProjectGenerationReadinessAssessment,
  createProjectScaffoldingReadinessSection,
  createReadonlyContractReadinessSection,
  createRuntimeActivationDisabledReadinessSection,
  createSafePatchBoundaryReadinessSection,
  createSingleFileMutationBoundaryReadinessSection,
  createValidationSuiteReadinessSection,
  type ProjectGenerationReadinessAssessment
} from "./governance/projectGenerationReadiness.js";
import { archiveGovernanceFiles, type GovernanceArchiveInputFile, type GovernanceArchiveKind, type GovernanceArchiveResult } from "./repair/governanceArchive.js";
import {
  buildGovernanceArchiveIndexEntry,
  getGovernanceArchiveIndexPath,
  loadGovernanceArchiveIndex,
  saveGovernanceArchiveIndex,
  updateGovernanceArchiveIndex,
  type GovernanceArchiveIndexEntry
} from "./repair/governanceArchiveIndex.js";
import {
  buildGovernanceArchiveDashboard,
  buildMissingGovernanceArchiveDashboard,
  isGovernanceArchiveKind,
  renderGovernanceArchiveDashboardText,
  type GovernanceArchiveDashboardOptions
} from "./repair/governanceArchiveDashboard.js";
import {
  buildGovernanceArchiveDiff,
  loadGovernanceArchiveSnapshot,
  renderGovernanceArchiveDiffText
} from "./repair/governanceArchiveDiff.js";
import {
  buildGovernanceTrendAnalysis,
  loadGovernanceTrendSnapshots,
  renderGovernanceTrendAnalysisText
} from "./repair/governanceTrendAnalysis.js";
import {
  buildGovernanceDriftDetection,
  loadGovernanceDriftSnapshots,
  renderGovernanceDriftDetectionText
} from "./repair/governanceDriftDetection.js";
import {
  buildGovernanceStabilityScore,
  renderGovernanceStabilityScoreText
} from "./repair/governanceStabilityScore.js";
import {
  buildGovernanceEscalation,
  renderGovernanceEscalationText
} from "./repair/governanceEscalation.js";
import {
  buildGovernancePolicyEnforcement,
  renderGovernancePolicyEnforcementText
} from "./repair/governancePolicyEnforcement.js";
import {
  buildGovernanceDecisionMatrix,
  renderGovernanceDecisionMatrixText
} from "./repair/governanceDecisionMatrix.js";
import { buildGovernanceEvidencePack } from "./repair/governanceEvidencePack.js";
import {
  buildGovernanceEvidenceIndexEntry,
  filterGovernanceEvidenceIndex,
  getGovernanceEvidenceIndexPath,
  GOVERNANCE_EVIDENCE_ESCALATION_LEVELS,
  GOVERNANCE_EVIDENCE_POLICY_MODES,
  loadGovernanceEvidenceIndex,
  readGovernanceEvidenceManifest,
  renderGovernanceEvidenceIndexText,
  saveGovernanceEvidenceIndex,
  updateGovernanceEvidenceIndex,
  type GovernanceEvidenceIndexFilterOptions
} from "./repair/governanceEvidenceIndex.js";
import {
  buildGovernanceEvidenceDiff,
  loadGovernanceEvidencePack,
  renderGovernanceEvidenceDiffText
} from "./repair/governanceEvidenceDiff.js";
import {
  buildGovernanceControlPlane,
  renderGovernanceControlPlaneText
} from "./repair/governanceControlPlane.js";
import {
  buildGovernanceConfigPreview,
  renderGovernanceConfigPreviewText
} from "./repair/governanceConfigPreview.js";
import {
  buildGovernanceConfigExample,
  renderGovernanceConfigExampleMarkdown,
  renderGovernanceConfigExampleWriteText,
  writeGovernanceConfigExample
} from "./repair/governanceConfigExample.js";
import {
  renderGovernanceConfigValidationText,
  validateGovernanceConfig
} from "./repair/governanceConfigValidator.js";
import {
  buildGovernanceConfigEffectivePreview,
  renderGovernanceConfigEffectivePreviewText
} from "./repair/governanceConfigEffectivePreview.js";
import {
  buildGovernanceConfigActivationPlan,
  renderGovernanceConfigActivationPlanText,
  writeGovernanceConfigActivationPlanArtifacts
} from "./governance/configActivationPlan.js";
import {
  buildGovernanceConfigLoadPreview,
  renderGovernanceConfigLoadPreviewText,
  writeGovernanceConfigLoadPreviewArtifacts
} from "./governance/configLoadPreview.js";
import {
  buildGovernanceConfigSnapshotLock,
  renderGovernanceConfigSnapshotLockText,
  writeGovernanceConfigSnapshotLockArtifacts
} from "./governance/configSnapshotLock.js";
import {
  buildGovernanceConfigAuditTrail,
  renderGovernanceConfigAuditTrailText,
  writeGovernanceConfigAuditTrailArtifacts
} from "./governance/configAuditTrail.js";
import {
  buildGovernancePolicyRuntimePreview,
  renderGovernancePolicyRuntimePreviewText,
  writeGovernancePolicyRuntimePreviewArtifacts
} from "./governance/policyRuntimePreview.js";
import {
  buildGovernanceProfileInheritancePreview,
  renderGovernanceProfileInheritancePreviewText,
  writeGovernanceProfileInheritancePreviewArtifacts
} from "./governance/profileInheritancePreview.js";
import {
  buildGovernanceRepoClassificationPreview,
  renderGovernanceRepoClassificationPreviewText,
  writeGovernanceRepoClassificationPreviewArtifacts
} from "./governance/repoClassificationPreview.js";
import {
  buildGovernanceAttestation,
  renderGovernanceAttestationText,
  writeGovernanceAttestationArtifacts
} from "./governance/governanceAttestation.js";
import {
  buildGovernanceCiAnnotationsPreview,
  renderGovernanceCiAnnotationsPreviewText,
  writeGovernanceCiAnnotationsPreviewArtifacts
} from "./governance/ciGovernanceAnnotationsPreview.js";
import {
  buildGovernanceGithubPrSummaryPreview,
  renderGovernanceGithubPrSummaryPreviewText,
  writeGovernanceGithubPrSummaryPreviewArtifacts
} from "./governance/githubPrGovernanceSummaryPreview.js";
import {
  buildGovernanceExceptionReviewPreview,
  renderGovernanceExceptionReviewPreviewText,
  writeGovernanceExceptionReviewPreviewArtifacts
} from "./governance/governanceExceptionReviewPreview.js";
import {
  buildGovernanceSimulationPreview,
  renderGovernanceSimulationPreviewText,
  writeGovernanceSimulationPreviewArtifacts
} from "./governance/governanceSimulationPreview.js";
import {
  buildGovernanceGuardedPolicyActivationCandidatesPreview,
  renderGovernanceGuardedPolicyActivationCandidatesPreviewText,
  writeGovernanceGuardedPolicyActivationCandidatesPreviewArtifacts
} from "./governance/guardedPolicyActivationCandidatesPreview.js";
import {
  buildGovernanceRuntimeActivationGatesPreview,
  renderGovernanceRuntimeActivationGatesPreviewText,
  writeGovernanceRuntimeActivationGatesPreviewArtifacts
} from "./governance/runtimeActivationGatesPreview.js";
import {
  buildGovernanceAutonomyReadiness,
  renderGovernanceAutonomyReadinessText,
  writeGovernanceAutonomyReadinessArtifacts
} from "./governance/autonomyReadiness.js";
import {
  buildGovernanceAutonomyDesignReviewPack,
  renderGovernanceAutonomyDesignReviewPackText,
  writeGovernanceAutonomyDesignReviewPackArtifacts
} from "./governance/autonomyDesignReviewPack.js";
import {
  buildGovernanceHumanApprovalWorkflowPreview,
  renderGovernanceHumanApprovalWorkflowPreviewText,
  writeGovernanceHumanApprovalWorkflowPreviewArtifacts
} from "./governance/humanApprovalWorkflowPreview.js";
import {
  buildGovernanceAutonomyScopePreview,
  renderGovernanceAutonomyScopePreviewText,
  writeGovernanceAutonomyScopePreviewArtifacts
} from "./governance/autonomyScopePreview.js";
import {
  buildGovernanceAutonomyRiskRegisterPreview,
  renderGovernanceAutonomyRiskRegisterPreviewText,
  writeGovernanceAutonomyRiskRegisterPreviewArtifacts
} from "./governance/autonomyRiskRegisterPreview.js";
import {
  buildGovernanceAutonomySandboxPlanPreview,
  renderGovernanceAutonomySandboxPlanPreviewText,
  writeGovernanceAutonomySandboxPlanPreviewArtifacts
} from "./governance/autonomySandboxPlanPreview.js";
import {
  buildGovernanceAutonomySandboxEvidencePreview,
  renderGovernanceAutonomySandboxEvidencePreviewText,
  writeGovernanceAutonomySandboxEvidencePreviewArtifacts
} from "./governance/autonomySandboxEvidencePreview.js";
import {
  buildGovernanceAutonomyObservabilityPreview,
  renderGovernanceAutonomyObservabilityPreviewText,
  writeGovernanceAutonomyObservabilityPreviewArtifacts
} from "./governance/autonomyObservabilityPreview.js";
import {
  buildGovernanceAutonomyControlPlanePreview,
  renderGovernanceAutonomyControlPlanePreviewText,
  writeGovernanceAutonomyControlPlanePreviewArtifacts
} from "./governance/autonomyControlPlanePreview.js";
import {
  buildGovernanceAutonomyLifecyclePreview,
  renderGovernanceAutonomyLifecyclePreviewText,
  writeGovernanceAutonomyLifecyclePreviewArtifacts
} from "./governance/autonomyGovernanceLifecyclePreview.js";
import {
  buildGovernanceRuntimeSafetyDesignPreview,
  renderGovernanceRuntimeSafetyDesignPreviewText,
  writeGovernanceRuntimeSafetyDesignPreviewArtifacts
} from "./governance/runtimeSafetyDesignPreview.js";
import {
  buildGovernanceRuntimeSafetyEvidencePreview,
  renderGovernanceRuntimeSafetyEvidencePreviewText,
  writeGovernanceRuntimeSafetyEvidencePreviewArtifacts
} from "./governance/runtimeSafetyEvidencePreview.js";
import {
  buildGovernanceRuntimeSafetyObservabilityPreview,
  renderGovernanceRuntimeSafetyObservabilityPreviewText,
  writeGovernanceRuntimeSafetyObservabilityPreviewArtifacts
} from "./governance/runtimeSafetyObservabilityPreview.js";
import {
  buildGovernanceRuntimeControlPlanePreview,
  renderGovernanceRuntimeControlPlanePreviewText,
  writeGovernanceRuntimeControlPlanePreviewArtifacts
} from "./governance/runtimeControlPlanePreview.js";
import {
  buildGovernanceRuntimeLifecyclePreview,
  renderGovernanceRuntimeLifecyclePreviewText,
  writeGovernanceRuntimeLifecyclePreviewArtifacts
} from "./governance/runtimeGovernanceLifecyclePreview.js";
import {
  buildGovernanceRuntimeActivationReadinessPreview,
  renderGovernanceRuntimeActivationReadinessPreviewText,
  writeGovernanceRuntimeActivationReadinessPreviewArtifacts
} from "./governance/runtimeActivationReadinessPreview.js";
import {
  buildGovernanceRuntimeSafetyCertificationPreview,
  renderGovernanceRuntimeSafetyCertificationPreviewText,
  writeGovernanceRuntimeSafetyCertificationPreviewArtifacts
} from "./governance/runtimeSafetyCertificationPreview.js";
import {
  buildGovernanceRuntimeActivationGovernanceReviewPreview,
  renderGovernanceRuntimeActivationGovernanceReviewPreviewText,
  writeGovernanceRuntimeActivationGovernanceReviewPreviewArtifacts
} from "./governance/runtimeActivationGovernanceReviewPreview.js";
import {
  buildGovernanceRuntimeActivationBoundaryPreview,
  renderGovernanceRuntimeActivationBoundaryPreviewText,
  writeGovernanceRuntimeActivationBoundaryPreviewArtifacts
} from "./governance/runtimeActivationBoundaryPreview.js";
import {
  buildGovernanceRuntimeActivationFreezePreview,
  renderGovernanceRuntimeActivationFreezePreviewText,
  writeGovernanceRuntimeActivationFreezePreviewArtifacts
} from "./governance/runtimeActivationFreezePreview.js";
import {
  buildGovernanceRuntimeSafetyFinalReviewPreview,
  renderGovernanceRuntimeSafetyFinalReviewPreviewText,
  writeGovernanceRuntimeSafetyFinalReviewPreviewArtifacts
} from "./governance/runtimeSafetyFinalReviewPreview.js";
import {
  buildGovernancePostV9RuntimeResearchPreview,
  renderGovernancePostV9RuntimeResearchPreviewText,
  writeGovernancePostV9RuntimeResearchPreviewArtifacts
} from "./governance/postV9RuntimeResearchPreview.js";
import {
  buildGovernanceRuntimeResearchIndexPreview,
  renderGovernanceRuntimeResearchIndexPreviewText,
  writeGovernanceRuntimeResearchIndexPreviewArtifacts
} from "./governance/runtimeGovernanceResearchIndexPreview.js";
import {
  buildGovernanceRuntimeResearchMapPreview,
  renderGovernanceRuntimeResearchMapPreviewText,
  writeGovernanceRuntimeResearchMapPreviewArtifacts
} from "./governance/runtimeGovernanceResearchMapPreview.js";
import {
  buildGovernanceRuntimeResearchTimelinePreview,
  renderGovernanceRuntimeResearchTimelinePreviewText,
  writeGovernanceRuntimeResearchTimelinePreviewArtifacts
} from "./governance/runtimeGovernanceResearchTimelinePreview.js";
import {
  buildGovernanceRuntimeResearchArchivePreview,
  renderGovernanceRuntimeResearchArchivePreviewText,
  writeGovernanceRuntimeResearchArchivePreviewArtifacts
} from "./governance/runtimeGovernanceResearchArchivePreview.js";
import {
  buildGovernanceRuntimeResearchCatalogPreview,
  renderGovernanceRuntimeResearchCatalogPreviewText,
  writeGovernanceRuntimeResearchCatalogPreviewArtifacts
} from "./governance/runtimeGovernanceResearchCatalogPreview.js";
import {
  buildGovernanceRuntimeResearchRegistryPreview,
  renderGovernanceRuntimeResearchRegistryPreviewText,
  writeGovernanceRuntimeResearchRegistryPreviewArtifacts
} from "./governance/runtimeGovernanceResearchRegistryPreview.js";
import {
  buildGovernanceRuntimeResearchManifestPreview,
  renderGovernanceRuntimeResearchManifestPreviewText,
  writeGovernanceRuntimeResearchManifestPreviewArtifacts
} from "./governance/runtimeGovernanceResearchManifestPreview.js";
import {
  buildGovernanceRuntimeResearchAttestationPreview,
  renderGovernanceRuntimeResearchAttestationPreviewText,
  writeGovernanceRuntimeResearchAttestationPreviewArtifacts
} from "./governance/runtimeGovernanceResearchAttestationPreview.js";
import {
  renderArchiveRequiresExportError,
  renderArchiveHelp,
  renderCiSummaryHelp,
  renderDecisionMatrixHelp,
  renderDriftHelp,
  renderEvidencePackHelp,
  renderEvidenceListHelp,
  renderEvidenceDiffHelp,
  renderGovernanceConfigAuditTrailHelp,
  renderGovernanceConfigActivationPlanHelp,
  renderGovernanceConfigEffectiveHelp,
  renderGovernanceConfigExampleHelp,
  renderGovernanceConfigHelp,
  renderGovernanceConfigLoadPreviewHelp,
  renderGovernanceAttestationHelp,
  renderGovernanceCiAnnotationsPreviewHelp,
  renderGovernanceExceptionReviewPreviewHelp,
  renderGovernanceGithubPrSummaryPreviewHelp,
  renderGovernanceSimulationPreviewHelp,
  renderGovernanceGuardedPolicyActivationCandidatesPreviewHelp,
  renderGovernanceRuntimeActivationGatesPreviewHelp,
  renderGovernanceAutonomyDesignReviewPackHelp,
  renderGovernanceHumanApprovalWorkflowPreviewHelp,
  renderGovernanceAutonomyRiskRegisterPreviewHelp,
  renderGovernanceAutonomySandboxPlanPreviewHelp,
  renderGovernanceAutonomySandboxEvidencePreviewHelp,
  renderGovernanceAutonomyObservabilityPreviewHelp,
  renderGovernanceAutonomyControlPlanePreviewHelp,
  renderGovernanceAutonomyLifecyclePreviewHelp,
  renderGovernanceRuntimeSafetyDesignPreviewHelp,
  renderGovernanceRuntimeSafetyEvidencePreviewHelp,
  renderGovernanceRuntimeSafetyObservabilityPreviewHelp,
  renderGovernanceRuntimeControlPlanePreviewHelp,
  renderGovernanceRuntimeLifecyclePreviewHelp,
  renderGovernanceRuntimeActivationReadinessPreviewHelp,
  renderGovernanceRuntimeSafetyCertificationPreviewHelp,
  renderGovernanceRuntimeActivationGovernanceReviewPreviewHelp,
  renderGovernanceRuntimeActivationBoundaryPreviewHelp,
  renderGovernanceRuntimeActivationFreezePreviewHelp,
  renderGovernanceRuntimeSafetyFinalReviewPreviewHelp,
  renderGovernancePostV9RuntimeResearchPreviewHelp,
  renderGovernanceRuntimeResearchIndexPreviewHelp,
  renderGovernanceRuntimeResearchMapPreviewHelp,
  renderGovernanceRuntimeResearchTimelinePreviewHelp,
  renderGovernanceRuntimeResearchArchivePreviewHelp,
  renderGovernanceRuntimeResearchCatalogPreviewHelp,
  renderGovernanceRuntimeResearchRegistryPreviewHelp,
  renderGovernanceRuntimeResearchManifestPreviewHelp,
  renderGovernanceRuntimeResearchAttestationPreviewHelp,
  renderGovernanceControlledProjectGenerationContractHelp,
  renderGovernanceControlledProjectGenerationApprovalBoundaryHelp,
  renderGovernanceControlledProjectGenerationContractBundleHelp,
  renderGovernanceControlledProjectGenerationInputContractHelp,
  renderGovernanceControlledProjectGenerationMutationBoundaryHelp,
  renderGovernanceControlledProjectGenerationOutputContractHelp,
  renderGovernanceControlledProjectGenerationRuntimeBoundaryHelp,
  renderGovernanceConsolidationAuditHelp,
  renderGovernanceProjectGenerationApprovalPlanHelp,
  renderGovernanceProjectGenerationBlueprintHelp,
  renderGovernanceProjectGenerationCapabilitiesHelp,
  renderGovernanceProjectGenerationDependencyPlanHelp,
  renderGovernanceProjectGenerationFilePlanHelp,
  renderGovernanceProjectGenerationReadinessHelp,
  renderGovernanceProjectGenerationRiskPlanHelp,
  renderGovernanceProjectGenerationRollbackPlanHelp,
  renderGovernanceProjectGenerationPlanBundleHelp,
  renderGovernanceProjectGenerationReadinessAuditHelp,
  renderGovernanceProjectGenerationValidationPlanHelp,
  renderGovernanceArtifactIndexHelp,
  renderGovernanceAutonomyScopePreviewHelp,
  renderGovernanceAutonomyReadinessHelp,
  renderGovernanceProfileInheritancePreviewHelp,
  renderGovernanceRepoClassificationPreviewHelp,
  renderGovernancePolicyRuntimePreviewHelp,
  renderGovernanceConfigSnapshotLockHelp,
  renderGovernanceConfigValidateHelp,
  renderGovernanceHelp,
  renderEscalationHelp,
  renderInsightsHelp,
  renderInvalidFlagError,
  renderMainHelp,
  renderPolicyHelp,
  renderRunsHelp,
  renderStabilityHelp,
  renderTrendsHelp,
  renderUnknownCommandError
} from "./cliHelp.js";

const runInputSchema = z.object({
  repo: z.string().min(1),
  task: z.string().min(1),
  branch: z.boolean().optional(),
  commit: z.boolean().optional(),
  yes: z.boolean().optional()
});

const program = new Command();

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidRunsIndex(value: unknown): value is RunsIndex {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { runs?: unknown }).runs)
  );
}

function printDashboardResult(result: ReturnType<typeof buildRunIndexDashboard>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(renderRunIndexDashboardText(result));
}

function parseExportFormat(value: unknown): RunIndexExportFormat | null {
  if (value === true) {
    return "all";
  }
  if (typeof value !== "string") {
    return null;
  }
  return ["json", "markdown", "csv", "all"].includes(value) ? (value as RunIndexExportFormat) : null;
}

function printExportResult(result: ReturnType<typeof exportRunIndexDashboard>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("Exported run dashboard:");
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
  if (result.warnings.length) {
    console.log("Warnings:");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

function printInsightsExportResult(result: ReturnType<typeof exportGovernanceInsights>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("Exported governance insights:");
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
}

function printCiSummaryExportResult(result: ReturnType<typeof exportGovernanceCiSummary>, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("Exported governance CI summary:");
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
}

function archiveInputFiles(files: string[]): GovernanceArchiveInputFile[] {
  return files.map((file) => ({
    sourcePath: file,
    archiveName: path.basename(file)
  }));
}

function printArchiveResult(label: string, result: GovernanceArchiveResult): void {
  console.log(label);
  for (const file of result.files) {
    console.log(`- ${file}`);
  }
  if (result.warnings.length) {
    console.log("Archive warnings:");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

function printExportAndArchiveResult<T extends { files: string[] }>(
  exportResult: T,
  archiveResult: GovernanceArchiveResult | null,
  asJson: boolean,
  textPrinter: (result: T, asJson: boolean) => void,
  archiveLabel: string
): void {
  if (asJson) {
    if (archiveResult === null) {
      textPrinter(exportResult, true);
      return;
    }
    console.log(JSON.stringify({ export: exportResult, archive: archiveResult }, null, 2));
    return;
  }
  textPrinter(exportResult, false);
  if (archiveResult !== null) {
    console.log("");
    printArchiveResult(archiveLabel, archiveResult);
  }
}

function archiveExportResult(
  repoPath: string,
  kind: GovernanceArchiveKind,
  files: string[],
  sourceCommand: string,
  metadata?: GovernanceArchiveIndexEntry["metadata"]
): GovernanceArchiveResult {
  const archiveResult = archiveGovernanceFiles(repoPath, kind, archiveInputFiles(files));
  if (archiveResult.archived) {
    const entry = buildGovernanceArchiveIndexEntry({
      archiveResult,
      kind,
      sourceCommand,
      metadata
    });
    const updatedIndex = updateGovernanceArchiveIndex(loadGovernanceArchiveIndex(repoPath), entry);
    saveGovernanceArchiveIndex(repoPath, updatedIndex);
  }
  return archiveResult;
}
function printGovernancePolicyProfiles(asJson: boolean): void {
  const profiles = listGovernancePolicyProfiles();
  if (asJson) {
    console.log(JSON.stringify(profiles, null, 2));
    return;
  }

  console.log("Available governance policy profiles:");
  for (const profile of profiles) {
    console.log(`- ${profile.name}: ${profile.description}`);
  }
}

function parseGovernancePolicyProfileOption(value: unknown): GovernancePolicyProfileName | null {
  if (value === undefined) {
    return "balanced";
  }
  return typeof value === "string" && isGovernancePolicyProfileName(value) ? value : null;
}

function parseTrendWindow(value: unknown): number | null {
  if (value === undefined) {
    return 10;
  }
  const parsed = parsePositiveInteger(value);
  if (parsed === null) {
    return null;
  }
  return Math.min(parsed, 100);
}

function parseDriftWindow(value: unknown, fallback: number): number | null {
  if (value === undefined) {
    return fallback;
  }
  const parsed = parsePositiveInteger(value);
  if (parsed === null) {
    return null;
  }
  return Math.min(parsed, 100);
}

async function buildGovernanceSignalBundle(repoPath: string, windowSize: number, baselineWindowSize: number, comparisonWindowSize: number) {
  const archiveIndexPath = getGovernanceArchiveIndexPath(repoPath);
  const archiveIndex = (await fs.pathExists(archiveIndexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
  const trendSnapshots = archiveIndex
    ? loadGovernanceTrendSnapshots({
        projectRoot: repoPath,
        index: archiveIndex,
        kind: "governance-insights",
        windowSize
      })
    : [];
  const driftSnapshots = archiveIndex
    ? loadGovernanceDriftSnapshots({
        projectRoot: repoPath,
        index: archiveIndex,
        kind: "governance-insights",
        maxSnapshots: baselineWindowSize + comparisonWindowSize
      })
    : [];
  const totalSnapshots = archiveIndex?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
  const trend = buildGovernanceTrendAnalysis({
    snapshots: trendSnapshots,
    analyzedKind: "governance-insights",
    windowSize,
    totalSnapshots
  });
  const drift = buildGovernanceDriftDetection({
    snapshots: driftSnapshots,
    analyzedKind: "governance-insights",
    baselineWindowSize,
    comparisonWindowSize
  });
  const stability = buildGovernanceStabilityScore({ trend, drift });
  const escalation = buildGovernanceEscalation({ stability });
  const policy = buildGovernancePolicyEnforcement({ escalation });
  return {
    archiveIndex,
    trend,
    drift,
    stability,
    escalation,
    policy
  };
}

const GOVERNANCE_COMMANDS = ["runs", "insights", "ci-summary", "archive", "trends", "drift", "stability", "escalation", "policy", "decision-matrix", "evidence-pack", "evidence-list", "evidence-diff", "governance"] as const;
const KNOWN_COMMANDS = new Set(["run", ...GOVERNANCE_COMMANDS]);
const GOVERNANCE_COMMAND_FLAGS: Record<string, Set<string>> = {
  runs: new Set(["--repo", "--limit", "--status", "--blocked", "--human-review", "--latest", "--json", "--export", "--archive", "--help", "-h"]),
  insights: new Set(["--repo", "--profile", "--profiles", "--json", "--export", "--archive", "--help", "-h"]),
  "ci-summary": new Set(["--repo", "--profile", "--json", "--export", "--archive", "--help", "-h"]),
  archive: new Set(["--repo", "--latest", "--kind", "--limit", "--json", "--help", "-h"]),
  trends: new Set(["--repo", "--kind", "--window", "--json", "--help", "-h"]),
  drift: new Set(["--repo", "--kind", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  stability: new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  escalation: new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  policy: new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  "decision-matrix": new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  "evidence-pack": new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"]),
  "evidence-list": new Set(["--repo", "--latest", "--limit", "--policy", "--escalation", "--json", "--help", "-h"]),
  "evidence-diff": new Set(["--repo", "--json", "--help", "-h"]),
  governance: new Set(["--repo", "--window", "--baseline-window", "--comparison-window", "--json", "--help", "-h"])
};

function printAndExit(message: string, exitCode: number): void {
  const writer = exitCode === 0 ? console.log : console.error;
  writer(message.trimEnd());
  process.exit(exitCode);
}

function renderCommandHelp(command: string): string | null {
  if (command === "runs") {
    return renderRunsHelp();
  }
  if (command === "insights") {
    return renderInsightsHelp();
  }
  if (command === "ci-summary") {
    return renderCiSummaryHelp();
  }
  if (command === "archive") {
    return renderArchiveHelp();
  }
  if (command === "trends") {
    return renderTrendsHelp();
  }
  if (command === "drift") {
    return renderDriftHelp();
  }
  if (command === "stability") {
    return renderStabilityHelp();
  }
  if (command === "escalation") {
    return renderEscalationHelp();
  }
  if (command === "policy") {
    return renderPolicyHelp();
  }
  if (command === "decision-matrix") {
    return renderDecisionMatrixHelp();
  }
  if (command === "evidence-pack") {
    return renderEvidencePackHelp();
  }
  if (command === "evidence-list") {
    return renderEvidenceListHelp();
  }
  if (command === "evidence-diff") {
    return renderEvidenceDiffHelp();
  }
  if (command === "governance") {
    return renderGovernanceHelp();
  }
  return null;
}

function findInvalidGovernanceFlag(command: string, args: string[]): string | null {
  const allowed = GOVERNANCE_COMMAND_FLAGS[command];
  if (!allowed) {
    return null;
  }
  for (const arg of args) {
    if (!arg.startsWith("-")) {
      continue;
    }
    const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
    if (!allowed.has(flag)) {
      return flag;
    }
  }
  return null;
}

function buildGovernanceArtifactIndexSampleQuery(): GovernanceArtifactQueryResult {
  const index = createGovernanceArtifactIndex("Governance Artifact CLI Inspection Sample Index");
  return queryPreviewOnlyGovernanceArtifacts({
    ...index,
    entries: [
      {
        artifactType: "manifest",
        status: "preview",
        severity: "info",
        source: "governance-artifact-index-cli-sample",
        version: "v10.6",
        previewOnly: true,
        readonly: true,
        summary: "Deterministic read-only governance artifact inspection sample."
      }
    ],
    summary: {
      totalEntries: 1,
      artifactTypeGroups: [{ key: "manifest", totalEntries: 1 }],
      statusGroups: [{ key: "preview", totalEntries: 1 }],
      readonlyEntries: 1,
      previewOnlyEntries: 1,
      allReadonly: true,
      allPreviewOnly: true
    }
  });
}

function buildGovernanceArtifactIndexExportMetadata(format: GovernanceArtifactExportFormat) {
  return {
    version: "v10.7",
    source: "governance-artifact-index-cli-export-preview",
    command: `governance artifact-index --export ${format}`,
    readonly: true,
    previewOnly: true
  };
}

function buildGovernanceArtifactIndexSnapshotPreview(result: GovernanceArtifactQueryResult): GovernanceArtifactSnapshot {
  const metadata = {
    version: "v10.8",
    source: "governance-artifact-index-cli-snapshot-preview",
    command: "governance artifact-index --snapshot",
    readonly: true,
    previewOnly: true
  };
  const exportPayload = createGovernanceArtifactExportPayload(
    createGovernanceArtifactExportContract({
      format: "json",
      dataType: "query-result",
      metadata
    }),
    result
  );
  return createGovernanceArtifactSnapshot({
    title: "Governance Artifact Index Snapshot Preview",
    metadata,
    sections: [
      createQuerySnapshotSection(result, "CLI Query Result"),
      createExportSnapshotSection(exportPayload, "CLI Export Payload")
    ]
  });
}

function buildGovernanceArtifactIndexReviewPackPreview(result: GovernanceArtifactQueryResult): GovernanceArtifactReviewPack {
  const snapshot = buildGovernanceArtifactIndexSnapshotPreview(result);
  const metadata = {
    version: "v10.9",
    source: "governance-artifact-index-cli-review-pack-preview",
    command: "governance artifact-index --review-pack",
    readonly: true,
    previewOnly: true
  };
  const exportPayload = createGovernanceArtifactExportPayload(
    createGovernanceArtifactExportContract({
      format: "json",
      dataType: "query-result",
      metadata
    }),
    result
  );
  return createGovernanceArtifactReviewPack({
    title: "Governance Artifact Index Review Pack Preview",
    metadata,
    sections: [
      createReviewPackOverviewSection("Deterministic governance artifact review pack preview for human inspection."),
      createReviewPackQuerySection(result, "CLI Query Result"),
      createReviewPackExportSection(exportPayload, "CLI Export Payload"),
      createReviewPackSnapshotSection(snapshot, "CLI Snapshot Preview")
    ]
  });
}

function buildGovernanceConsolidationAuditPreview(): GovernanceConsolidationAudit {
  return createGovernanceConsolidationAudit({
    title: "Governance Consolidation Completion Audit",
    metadata: {
      version: "v10.10",
      source: "governance-consolidation-audit-cli-preview",
      command: "governance consolidation-audit",
      readonly: true,
      previewOnly: true
    },
    sections: [
      createAuditInvariantsSection(),
      createAuditSchemaSection(),
      createAuditRendererSection(),
      createAuditCliSection(),
      createAuditArtifactPipelineSection(),
      createAuditValidationSuiteSection(),
      createAuditReadonlyGuaranteeSection()
    ]
  });
}

function buildProjectGenerationReadinessAssessmentPreview(): ProjectGenerationReadinessAssessment {
  return createProjectGenerationReadinessAssessment({
    title: "Project Generation Readiness Assessment",
    metadata: {
      version: "v11.0",
      source: "project-generation-readiness-cli-preview",
      command: "governance project-generation-readiness",
      readonly: true,
      previewOnly: true
    },
    sections: [
      createGovernanceConsolidationReadinessSection(),
      createArtifactPipelineReadinessSection(),
      createCliInspectionReadinessSection(),
      createValidationSuiteReadinessSection(),
      createReadonlyContractReadinessSection(),
      createSafePatchBoundaryReadinessSection(),
      createSingleFileMutationBoundaryReadinessSection(),
      createRuntimeActivationDisabledReadinessSection(),
      createBuilderAgentReadinessSection(),
      createProjectScaffoldingReadinessSection(),
      createOrchestrationReadinessSection(),
      createHumanApprovalReadinessSection()
    ]
  });
}

function buildProjectGenerationCapabilityMapPreview(): ProjectGenerationCapabilityMap {
  return createProjectGenerationCapabilityMap({
    title: "Project Generation Capability Map",
    metadata: {
      version: "v11.1",
      source: "project-generation-capability-map-cli-preview",
      command: "governance project-generation-capabilities",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationBlueprintPreview(): ProjectGenerationBlueprintPreview {
  return createProjectGenerationBlueprintPreview({
    title: "Project Generation Blueprint Preview",
    metadata: {
      version: "v11.2",
      source: "project-generation-blueprint-cli-preview",
      command: "governance project-generation-blueprint",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationFilePlanPreview(): ProjectGenerationFilePlanPreview {
  return createProjectGenerationFilePlanPreview({
    title: "Project Generation File Plan Preview",
    metadata: {
      version: "v11.3",
      source: "project-generation-file-plan-cli-preview",
      command: "governance project-generation-file-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationDependencyPlanPreview(): ProjectGenerationDependencyPlanPreview {
  return createProjectGenerationDependencyPlanPreview({
    title: "Project Generation Dependency Plan Preview",
    metadata: {
      version: "v11.4",
      source: "project-generation-dependency-plan-cli-preview",
      command: "governance project-generation-dependency-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationValidationPlanPreview(): ProjectGenerationValidationPlanPreview {
  return createProjectGenerationValidationPlanPreview({
    title: "Project Generation Validation Plan Preview",
    metadata: {
      version: "v11.5",
      source: "project-generation-validation-plan-cli-preview",
      command: "governance project-generation-validation-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationApprovalPlanPreview(): ProjectGenerationApprovalPlanPreview {
  return createProjectGenerationApprovalPlanPreview({
    title: "Project Generation Approval Plan Preview",
    metadata: {
      version: "v11.6",
      source: "project-generation-approval-plan-cli-preview",
      command: "governance project-generation-approval-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationRiskPlanPreview(): ProjectGenerationRiskPlanPreview {
  return createProjectGenerationRiskPlanPreview({
    title: "Project Generation Risk Plan Preview",
    metadata: {
      version: "v11.7",
      source: "project-generation-risk-plan-cli-preview",
      command: "governance project-generation-risk-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationRollbackPlanPreview(): ProjectGenerationRollbackPlanPreview {
  return createProjectGenerationRollbackPlanPreview({
    title: "Project Generation Rollback Plan Preview",
    metadata: {
      version: "v11.8",
      source: "project-generation-rollback-plan-cli-preview",
      command: "governance project-generation-rollback-plan",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationPlanBundlePreview(): ProjectGenerationPlanBundlePreview {
  return createProjectGenerationPlanBundlePreview({
    title: "Project Generation Plan Bundle Preview",
    metadata: {
      version: "v11.9",
      source: "project-generation-plan-bundle-cli-preview",
      command: "governance project-generation-plan-bundle",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildProjectGenerationReadinessCompletionAuditPreview(): ProjectGenerationReadinessCompletionAudit {
  return createProjectGenerationReadinessCompletionAudit({
    title: "Project Generation Readiness Completion Audit",
    metadata: {
      version: "v11.10",
      source: "project-generation-readiness-completion-audit-cli-preview",
      command: "governance project-generation-readiness-audit",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationDesignContractPreview(): ControlledProjectGenerationDesignContract {
  return createControlledProjectGenerationDesignContract({
    title: "Controlled Project Generation Design Contract",
    metadata: {
      version: "v12.0",
      source: "controlled-project-generation-design-contract-cli-preview",
      command: "governance controlled-project-generation-contract",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationInputContractPreview(): ControlledProjectGenerationInputContract {
  return createControlledProjectGenerationInputContract({
    title: "Controlled Project Generation Input Contract",
    metadata: {
      version: "v12.1",
      source: "controlled-project-generation-input-contract-cli-preview",
      command: "governance controlled-project-generation-input-contract",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationOutputContractPreview(): ControlledProjectGenerationOutputContract {
  return createControlledProjectGenerationOutputContract({
    title: "Controlled Project Generation Output Contract",
    metadata: {
      version: "v12.2",
      source: "controlled-project-generation-output-contract-cli-preview",
      command: "governance controlled-project-generation-output-contract",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationMutationBoundaryContractPreview(): ControlledProjectGenerationMutationBoundaryContract {
  return createControlledProjectGenerationMutationBoundaryContract({
    title: "Controlled Project Generation Mutation Boundary Contract",
    metadata: {
      version: "v12.3",
      source: "controlled-project-generation-mutation-boundary-contract-cli-preview",
      command: "governance controlled-project-generation-mutation-boundary",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationApprovalBoundaryContractPreview(): ControlledProjectGenerationApprovalBoundaryContract {
  return createControlledProjectGenerationApprovalBoundaryContract({
    title: "Controlled Project Generation Approval Boundary Contract",
    metadata: {
      version: "v12.4",
      source: "controlled-project-generation-approval-boundary-contract-cli-preview",
      command: "governance controlled-project-generation-approval-boundary",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationRuntimeBoundaryContractPreview(): ControlledProjectGenerationRuntimeBoundaryContract {
  return createControlledProjectGenerationRuntimeBoundaryContract({
    title: "Controlled Project Generation Runtime Boundary Contract",
    metadata: {
      version: "v12.5",
      source: "controlled-project-generation-runtime-boundary-contract-cli-preview",
      command: "governance controlled-project-generation-runtime-boundary",
      readonly: true,
      previewOnly: true
    }
  });
}

function buildControlledProjectGenerationContractBundlePreview(): ControlledProjectGenerationContractBundle {
  return createControlledProjectGenerationContractBundle({
    title: "Controlled Project Generation Contract Bundle",
    metadata: {
      version: "v12.6",
      source: "controlled-project-generation-contract-bundle-cli-preview",
      command: "governance controlled-project-generation-contract-bundle",
      readonly: true,
      previewOnly: true
    }
  });
}

function handleCliHelpAndGovernanceUx(argv: string[]): void {
  const args = argv.slice(2);
  const command = args[0];

  if (args.length === 0 || command === "--help" || command === "-h" || command === "help") {
    printAndExit(renderMainHelp(), 0);
  }

  if (command === undefined) {
    return;
  }

  if (command === "governance" && args[1] === "consolidation-audit") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance consolidation-audit", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceConsolidationAuditHelp(), 0);
    }

    const audit = buildGovernanceConsolidationAuditPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(audit, null, 2), 0);
    }
    printAndExit(renderCliGovernanceConsolidationAudit(audit), 0);
  }

  if (command === "governance" && args[1] === "project-generation-readiness") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-readiness", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationReadinessHelp(), 0);
    }

    const assessment = buildProjectGenerationReadinessAssessmentPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(assessment, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationReadinessAssessment(assessment), 0);
  }

  if (command === "governance" && args[1] === "project-generation-capabilities") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-capabilities", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationCapabilitiesHelp(), 0);
    }

    const capabilityMap = buildProjectGenerationCapabilityMapPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(capabilityMap, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationCapabilityMap(capabilityMap), 0);
  }

  if (command === "governance" && args[1] === "project-generation-blueprint") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-blueprint", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationBlueprintHelp(), 0);
    }

    const blueprint = buildProjectGenerationBlueprintPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(blueprint, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationBlueprintPreview(blueprint), 0);
  }

  if (command === "governance" && args[1] === "project-generation-file-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-file-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationFilePlanHelp(), 0);
    }

    const filePlan = buildProjectGenerationFilePlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(filePlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationFilePlanPreview(filePlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-dependency-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-dependency-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationDependencyPlanHelp(), 0);
    }

    const dependencyPlan = buildProjectGenerationDependencyPlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(dependencyPlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationDependencyPlanPreview(dependencyPlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-validation-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-validation-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationValidationPlanHelp(), 0);
    }

    const validationPlan = buildProjectGenerationValidationPlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(validationPlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationValidationPlanPreview(validationPlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-approval-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-approval-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationApprovalPlanHelp(), 0);
    }

    const approvalPlan = buildProjectGenerationApprovalPlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(approvalPlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationApprovalPlanPreview(approvalPlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-risk-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-risk-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationRiskPlanHelp(), 0);
    }

    const riskPlan = buildProjectGenerationRiskPlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(riskPlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationRiskPlanPreview(riskPlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-rollback-plan") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-rollback-plan", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationRollbackPlanHelp(), 0);
    }

    const rollbackPlan = buildProjectGenerationRollbackPlanPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(rollbackPlan, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationRollbackPlanPreview(rollbackPlan), 0);
  }

  if (command === "governance" && args[1] === "project-generation-plan-bundle") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-plan-bundle", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationPlanBundleHelp(), 0);
    }

    const planBundle = buildProjectGenerationPlanBundlePreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(planBundle, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationPlanBundlePreview(planBundle), 0);
  }

  if (command === "governance" && args[1] === "project-generation-readiness-audit") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance project-generation-readiness-audit", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProjectGenerationReadinessAuditHelp(), 0);
    }

    const audit = buildProjectGenerationReadinessCompletionAuditPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(audit, null, 2), 0);
    }
    printAndExit(renderCliProjectGenerationReadinessCompletionAudit(audit), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-contract") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-contract", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationContractHelp(), 0);
    }

    const contract = buildControlledProjectGenerationDesignContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationDesignContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-input-contract") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-input-contract", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationInputContractHelp(), 0);
    }

    const contract = buildControlledProjectGenerationInputContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationInputContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-output-contract") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-output-contract", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationOutputContractHelp(), 0);
    }

    const contract = buildControlledProjectGenerationOutputContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationOutputContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-mutation-boundary") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-mutation-boundary", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationMutationBoundaryHelp(), 0);
    }

    const contract = buildControlledProjectGenerationMutationBoundaryContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationMutationBoundaryContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-approval-boundary") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-approval-boundary", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationApprovalBoundaryHelp(), 0);
    }

    const contract = buildControlledProjectGenerationApprovalBoundaryContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationApprovalBoundaryContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-runtime-boundary") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-runtime-boundary", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationRuntimeBoundaryHelp(), 0);
    }

    const contract = buildControlledProjectGenerationRuntimeBoundaryContractPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(contract, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationRuntimeBoundaryContract(contract), 0);
  }

  if (command === "governance" && args[1] === "controlled-project-generation-contract-bundle") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance controlled-project-generation-contract-bundle", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceControlledProjectGenerationContractBundleHelp(), 0);
    }

    const bundle = buildControlledProjectGenerationContractBundlePreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(bundle, null, 2), 0);
    }
    printAndExit(renderCliControlledProjectGenerationContractBundle(bundle), 0);
  }

  if (command === "governance" && args[1] === "artifact-index") {
    const allowed = new Set(["--json", "--export", "--snapshot", "--review-pack", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance artifact-index", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceArtifactIndexHelp(), 0);
    }

    const result = buildGovernanceArtifactIndexSampleQuery();
    if (args.includes("--review-pack")) {
      const reviewPack = buildGovernanceArtifactIndexReviewPackPreview(result);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(reviewPack, null, 2), 0);
      }
      printAndExit(renderCliGovernanceArtifactReviewPack(reviewPack), 0);
    }
    if (args.includes("--snapshot")) {
      const snapshot = buildGovernanceArtifactIndexSnapshotPreview(result);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(snapshot, null, 2), 0);
      }
      printAndExit(renderCliGovernanceArtifactSnapshot(snapshot), 0);
    }
    const exportEquals = args.find((arg) => arg.startsWith("--export="));
    const exportIndex = args.indexOf("--export");
    const exportFormat = exportEquals ? exportEquals.slice("--export=".length) : exportIndex === -1 ? null : args[exportIndex + 1];
    if (exportFormat !== null) {
      if (exportFormat !== "json" && exportFormat !== "markdown") {
        printAndExit("Invalid export format for governance artifact-index. Expected one of: json, markdown", 1);
      }
      const format: GovernanceArtifactExportFormat = exportFormat === "json" ? "json" : "markdown";
      const metadata = buildGovernanceArtifactIndexExportMetadata(format);
      if (format === "json") {
        printAndExit(exportGovernanceArtifactQueryResultAsJson(result, metadata), 0);
      }
      printAndExit(exportGovernanceArtifactQueryResultAsMarkdown(result, metadata), 0);
    }
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(result, null, 2), 0);
    }
    printAndExit(renderCliGovernanceArtifactQueryResult(result), 0);
  }

  if (command === "governance" && args[1] === "config") {
    if (args[2] === "audit-trail") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config audit-trail", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigAuditTrailHelp(), 0);
      }

      const { result, artifact } = buildGovernanceConfigAuditTrail(process.cwd());
      writeGovernanceConfigAuditTrailArtifacts(process.cwd(), artifact, result);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(result, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigAuditTrailText(result), 0);
    }

    if (args[2] === "snapshot-lock") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config snapshot-lock", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigSnapshotLockHelp(), 0);
      }

      const snapshotLock = buildGovernanceConfigSnapshotLock(process.cwd());
      writeGovernanceConfigSnapshotLockArtifacts(process.cwd(), snapshotLock);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(snapshotLock, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigSnapshotLockText(snapshotLock), 0);
    }

    if (args[2] === "load-preview") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config load-preview", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigLoadPreviewHelp(), 0);
      }

      const preview = buildGovernanceConfigLoadPreview(process.cwd());
      writeGovernanceConfigLoadPreviewArtifacts(process.cwd(), preview);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(preview, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigLoadPreviewText(preview), 0);
    }

    if (args[2] === "activation-plan") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config activation-plan", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigActivationPlanHelp(), 0);
      }

      const plan = buildGovernanceConfigActivationPlan(process.cwd());
      writeGovernanceConfigActivationPlanArtifacts(process.cwd(), plan);
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(plan, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigActivationPlanText(plan), 0);
    }

    if (args[2] === "effective") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config effective", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigEffectiveHelp(), 0);
      }

      const preview = buildGovernanceConfigEffectivePreview(process.cwd());
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(preview, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigEffectivePreviewText(preview), 0);
    }

    if (args[2] === "validate") {
      const allowed = new Set(["--json", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config validate", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigValidateHelp(), 0);
      }

      const result = validateGovernanceConfig(process.cwd());
      const exitCode = result.status === "invalid" ? 1 : 0;
      if (args.includes("--json")) {
        printAndExit(JSON.stringify(result, null, 2), exitCode);
      }
      printAndExit(renderGovernanceConfigValidationText(result), exitCode);
    }

    if (args[2] === "example") {
      const allowed = new Set(["--json", "--write", "--help", "-h"]);
      for (const arg of args.slice(3)) {
        if (!arg.startsWith("-")) {
          continue;
        }
        const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
        if (!allowed.has(flag)) {
          printAndExit(renderInvalidFlagError("governance config example", flag), 1);
        }
      }

      if (args.includes("--help") || args.includes("-h")) {
        printAndExit(renderGovernanceConfigExampleHelp(), 0);
      }

      const asJson = args.includes("--json");
      const shouldWrite = args.includes("--write");
      const example = buildGovernanceConfigExample();
      if (shouldWrite) {
        const result = writeGovernanceConfigExample(process.cwd());
        if (asJson) {
          printAndExit(JSON.stringify(result, null, 2), 0);
        }
        printAndExit(renderGovernanceConfigExampleWriteText(result), 0);
      }

      if (asJson) {
        printAndExit(JSON.stringify(example, null, 2), 0);
      }
      printAndExit(renderGovernanceConfigExampleMarkdown(example), 0);
    }

    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(2)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance config", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceConfigHelp(), 0);
    }

    const preview = buildGovernanceConfigPreview();
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceConfigPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "policy" && args[2] === "runtime-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance policy runtime-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernancePolicyRuntimePreviewHelp(), 0);
    }

    const preview = buildGovernancePolicyRuntimePreview(process.cwd());
    writeGovernancePolicyRuntimePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernancePolicyRuntimePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "profile" && args[2] === "inheritance-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance profile inheritance-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceProfileInheritancePreviewHelp(), 0);
    }

    const preview = buildGovernanceProfileInheritancePreview(process.cwd());
    writeGovernanceProfileInheritancePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceProfileInheritancePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "repo" && args[2] === "classification-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance repo classification-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRepoClassificationPreviewHelp(), 0);
    }

    const preview = buildGovernanceRepoClassificationPreview(process.cwd());
    writeGovernanceRepoClassificationPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRepoClassificationPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "attestation" && args[2] === "generate") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance attestation generate", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAttestationHelp(), 0);
    }

    const attestation = buildGovernanceAttestation(process.cwd());
    writeGovernanceAttestationArtifacts(process.cwd(), attestation);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(attestation, null, 2), 0);
    }
    printAndExit(renderGovernanceAttestationText(attestation), 0);
  }

  if (command === "governance" && args[1] === "ci" && args[2] === "annotations-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance ci annotations-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceCiAnnotationsPreviewHelp(), 0);
    }

    const preview = buildGovernanceCiAnnotationsPreview(process.cwd());
    writeGovernanceCiAnnotationsPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceCiAnnotationsPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "github" && args[2] === "pr-summary-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance github pr-summary-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceGithubPrSummaryPreviewHelp(), 0);
    }

    const preview = buildGovernanceGithubPrSummaryPreview(process.cwd());
    writeGovernanceGithubPrSummaryPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceGithubPrSummaryPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "exception" && args[2] === "review-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance exception review-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceExceptionReviewPreviewHelp(), 0);
    }

    const preview = buildGovernanceExceptionReviewPreview(process.cwd());
    writeGovernanceExceptionReviewPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceExceptionReviewPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "simulation" && args[2] === "preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance simulation preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceSimulationPreviewHelp(), 0);
    }

    const preview = buildGovernanceSimulationPreview(process.cwd());
    writeGovernanceSimulationPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceSimulationPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "policy" && args[2] === "activation-candidates-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance policy activation-candidates-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceGuardedPolicyActivationCandidatesPreviewHelp(), 0);
    }

    const preview = buildGovernanceGuardedPolicyActivationCandidatesPreview(process.cwd());
    writeGovernanceGuardedPolicyActivationCandidatesPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceGuardedPolicyActivationCandidatesPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "activation-gates-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime activation-gates-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeActivationGatesPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeActivationGatesPreview(process.cwd());
    writeGovernanceRuntimeActivationGatesPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeActivationGatesPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "readiness") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy readiness", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyReadinessHelp(), 0);
    }

    const readiness = buildGovernanceAutonomyReadiness(process.cwd());
    writeGovernanceAutonomyReadinessArtifacts(process.cwd(), readiness);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(readiness, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyReadinessText(readiness), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "design-review-pack") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy design-review-pack", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyDesignReviewPackHelp(), 0);
    }

    const pack = buildGovernanceAutonomyDesignReviewPack(process.cwd());
    writeGovernanceAutonomyDesignReviewPackArtifacts(process.cwd(), pack);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(pack, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyDesignReviewPackText(pack), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "approval-workflow-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy approval-workflow-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceHumanApprovalWorkflowPreviewHelp(), 0);
    }

    const preview = buildGovernanceHumanApprovalWorkflowPreview(process.cwd());
    writeGovernanceHumanApprovalWorkflowPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceHumanApprovalWorkflowPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "scope-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy scope-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyScopePreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomyScopePreview(process.cwd());
    writeGovernanceAutonomyScopePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyScopePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "risk-register-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy risk-register-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyRiskRegisterPreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomyRiskRegisterPreview(process.cwd());
    writeGovernanceAutonomyRiskRegisterPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyRiskRegisterPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "sandbox-plan-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy sandbox-plan-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomySandboxPlanPreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomySandboxPlanPreview(process.cwd());
    writeGovernanceAutonomySandboxPlanPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomySandboxPlanPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "sandbox-evidence-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy sandbox-evidence-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomySandboxEvidencePreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomySandboxEvidencePreview(process.cwd());
    writeGovernanceAutonomySandboxEvidencePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomySandboxEvidencePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "observability-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy observability-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyObservabilityPreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomyObservabilityPreview(process.cwd());
    writeGovernanceAutonomyObservabilityPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyObservabilityPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "control-plane-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy control-plane-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyControlPlanePreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomyControlPlanePreview(process.cwd());
    writeGovernanceAutonomyControlPlanePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyControlPlanePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "autonomy" && args[2] === "lifecycle-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance autonomy lifecycle-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceAutonomyLifecyclePreviewHelp(), 0);
    }

    const preview = buildGovernanceAutonomyLifecyclePreview(process.cwd());
    writeGovernanceAutonomyLifecyclePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceAutonomyLifecyclePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "safety-design-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime safety-design-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeSafetyDesignPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeSafetyDesignPreview(process.cwd());
    writeGovernanceRuntimeSafetyDesignPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeSafetyDesignPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "safety-evidence-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime safety-evidence-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeSafetyEvidencePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeSafetyEvidencePreview(process.cwd());
    writeGovernanceRuntimeSafetyEvidencePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeSafetyEvidencePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "safety-observability-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime safety-observability-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeSafetyObservabilityPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeSafetyObservabilityPreview(process.cwd());
    writeGovernanceRuntimeSafetyObservabilityPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeSafetyObservabilityPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "control-plane-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime control-plane-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeControlPlanePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeControlPlanePreview(process.cwd());
    writeGovernanceRuntimeControlPlanePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeControlPlanePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "lifecycle-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime lifecycle-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeLifecyclePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeLifecyclePreview(process.cwd());
    writeGovernanceRuntimeLifecyclePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeLifecyclePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "activation-readiness-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime activation-readiness-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeActivationReadinessPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeActivationReadinessPreview(process.cwd());
    writeGovernanceRuntimeActivationReadinessPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeActivationReadinessPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "certification-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime certification-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeSafetyCertificationPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeSafetyCertificationPreview(process.cwd());
    writeGovernanceRuntimeSafetyCertificationPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeSafetyCertificationPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "activation-governance-review-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime activation-governance-review-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeActivationGovernanceReviewPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeActivationGovernanceReviewPreview(process.cwd());
    writeGovernanceRuntimeActivationGovernanceReviewPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeActivationGovernanceReviewPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "activation-boundary-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime activation-boundary-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeActivationBoundaryPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeActivationBoundaryPreview(process.cwd());
    writeGovernanceRuntimeActivationBoundaryPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeActivationBoundaryPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "activation-freeze-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime activation-freeze-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeActivationFreezePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeActivationFreezePreview(process.cwd());
    writeGovernanceRuntimeActivationFreezePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeActivationFreezePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "final-review-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime final-review-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeSafetyFinalReviewPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeSafetyFinalReviewPreview(process.cwd());
    writeGovernanceRuntimeSafetyFinalReviewPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeSafetyFinalReviewPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernancePostV9RuntimeResearchPreviewHelp(), 0);
    }

    const preview = buildGovernancePostV9RuntimeResearchPreview(process.cwd());
    writeGovernancePostV9RuntimeResearchPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernancePostV9RuntimeResearchPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-index-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-index-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchIndexPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchIndexPreview(process.cwd());
    writeGovernanceRuntimeResearchIndexPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchIndexPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-map-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-map-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchMapPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchMapPreview(process.cwd());
    writeGovernanceRuntimeResearchMapPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchMapPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-timeline-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-timeline-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchTimelinePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchTimelinePreview(process.cwd());
    writeGovernanceRuntimeResearchTimelinePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchTimelinePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-archive-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-archive-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchArchivePreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchArchivePreview(process.cwd());
    writeGovernanceRuntimeResearchArchivePreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchArchivePreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-catalog-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-catalog-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchCatalogPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchCatalogPreview(process.cwd());
    writeGovernanceRuntimeResearchCatalogPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchCatalogPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-registry-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) {
        continue;
      }
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-registry-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchRegistryPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchRegistryPreview(process.cwd());
    writeGovernanceRuntimeResearchRegistryPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchRegistryPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-manifest-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) continue;
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-manifest-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchManifestPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchManifestPreview(process.cwd());
    writeGovernanceRuntimeResearchManifestPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchManifestPreviewText(preview), 0);
  }

  if (command === "governance" && args[1] === "runtime" && args[2] === "research-attestation-preview") {
    const allowed = new Set(["--json", "--help", "-h"]);
    for (const arg of args.slice(3)) {
      if (!arg.startsWith("-")) continue;
      const flag = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;
      if (!allowed.has(flag)) {
        printAndExit(renderInvalidFlagError("governance runtime research-attestation-preview", flag), 1);
      }
    }

    if (args.includes("--help") || args.includes("-h")) {
      printAndExit(renderGovernanceRuntimeResearchAttestationPreviewHelp(), 0);
    }

    const preview = buildGovernanceRuntimeResearchAttestationPreview(process.cwd());
    writeGovernanceRuntimeResearchAttestationPreviewArtifacts(process.cwd(), preview);
    if (args.includes("--json")) {
      printAndExit(JSON.stringify(preview, null, 2), 0);
    }
    printAndExit(renderGovernanceRuntimeResearchAttestationPreviewText(preview), 0);
  }

  const commandHelp = renderCommandHelp(command);
  if (commandHelp !== null && (args.includes("--help") || args.includes("-h"))) {
    printAndExit(commandHelp, 0);
  }

  if (!command.startsWith("-") && !KNOWN_COMMANDS.has(command)) {
    printAndExit(renderUnknownCommandError(command), 1);
  }

  if (commandHelp !== null) {
    const invalidFlag = findInvalidGovernanceFlag(command, args.slice(1));
    if (invalidFlag !== null) {
      printAndExit(renderInvalidFlagError(command, invalidFlag), 1);
    }
  }
}

handleCliHelpAndGovernanceUx(process.argv);

program
  .name("factory")
  .description("software-factory CLI v0.1")
  .version("0.1.0");

program
  .command("run")
  .requiredOption("--repo <path>", "Path to target repository")
  .requiredOption("--task <task>", "Task description")
  .option("--branch", "Create factory branch before applying changes")
  .option("--commit", "Auto-commit relevant files after successful validation")
  .option("--yes", "Auto-approve safety prompts for non-interactive runs")
  .action(async (options) => {
    try {
      const parsed = runInputSchema.parse(options);
      const repoPath = path.resolve(parsed.repo);

      const exists = await fs.pathExists(repoPath);
      if (!exists) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
      }

      const stats = await fs.stat(repoPath);
      if (!stats.isDirectory()) {
        throw new Error(`Repository path is not a directory: ${repoPath}`);
      }

      const summary = await runTask({
        repoPath,
        task: parsed.task.trim(),
        createBranch: !!parsed.branch,
        autoCommit: !!parsed.commit,
        autoApprove: !!parsed.yes
      });

      console.log(chalk.bold("\nFinal Summary"));
      console.log(`Run ID: ${summary.runId}`);
      console.log(`Repo: ${summary.repoPath}`);
      console.log(`Task: ${summary.task}`);
      console.log(`Attempts: ${summary.attempts}`);
      console.log(`Applied changes: ${summary.appliedChanges}`);
      console.log(`Final status: ${summary.reviewStatus}`);
      console.log(`Review status: ${summary.reviewStatus}`);
      console.log(`Successful commands: ${summary.successfulCommands.length ? summary.successfulCommands.join(", ") : "None"}`);
      console.log(`Skipped commands: ${summary.skippedCommands.length ? summary.skippedCommands.join(", ") : "None"}`);
      console.log(`Failed commands: ${summary.failedCommands.length ? summary.failedCommands.join(", ") : "None"}`);
      if (summary.notes.length) {
        console.log(`Notes: ${summary.notes.join(" | ")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(chalk.red(`Error: ${message}`));
      process.exitCode = 1;
    }
  });

program
  .command("runs")
  .description("Show a read-only dashboard for historical repair runs")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--limit <n>", "Show the latest n runs")
  .option("--status <status>", "Filter by governance status")
  .option("--blocked", "Show only blocked runs")
  .option("--human-review", "Show only runs requiring human review")
  .option("--latest", "Show only the latest run")
  .option("--json", "Print machine-readable JSON")
  .option("--export [format]", "Export dashboard as json, markdown, csv, or all")
  .option("--archive", "Archive generated export files")
  .action(async (options) => {
    const asJson = !!options.json;
    const dashboardOptions: RunIndexDashboardOptions = {
      blockedOnly: !!options.blocked,
      humanReviewOnly: !!options.humanReview,
      latestOnly: !!options.latest,
      json: asJson
    };

    if (options.limit !== undefined) {
      const limit = parsePositiveInteger(options.limit);
      if (limit === null) {
        console.error(`Invalid limit value: ${options.limit}`);
        console.error("Limit must be a positive integer.");
        console.error("Run:\n  node dist/cli.js runs --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      dashboardOptions.limit = limit;
    }

    if (options.status !== undefined) {
      if (!RUN_INDEX_DASHBOARD_STATUSES.includes(options.status)) {
        console.error(`Invalid status filter: ${options.status}`);
        console.error(`Allowed statuses: ${RUN_INDEX_DASHBOARD_STATUSES.join(", ")}`);
        console.error("Run:\n  node dist/cli.js runs --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      dashboardOptions.status = options.status;
    }

    const repoPath = path.resolve(options.repo);
    if (options.archive && options.export === undefined) {
      console.error(renderArchiveRequiresExportError("runs").trimEnd());
      process.exitCode = 1;
      return;
    }
    if (options.export !== undefined) {
      const exportFormat = parseExportFormat(options.export);
      if (exportFormat === null) {
        console.error(`Invalid export format: ${options.export}`);
        console.error("Allowed formats: json, markdown, csv, all");
        console.error("Run:\n  node dist/cli.js runs --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }

      const exportResult = exportRunIndexDashboard(repoPath, {
        format: exportFormat,
        limit: dashboardOptions.limit,
        status: dashboardOptions.status,
        blockedOnly: dashboardOptions.blockedOnly,
        humanReviewOnly: dashboardOptions.humanReviewOnly,
        latestOnly: dashboardOptions.latestOnly
      });
      const archiveResult = options.archive
        ? archiveExportResult(repoPath, "runs-dashboard", exportResult.files, `runs --export ${exportFormat} --archive`, {
            exportFormat,
            displayedRuns: exportResult.displayedRuns
          })
        : null;
      printExportAndArchiveResult(exportResult, archiveResult, asJson, printExportResult, "Archived run dashboard:");
      return;
    }

    const indexPath = getRunsIndexPath(repoPath);
    if (!(await fs.pathExists(indexPath))) {
      printDashboardResult(buildMissingRunIndexDashboard(dashboardOptions), asJson);
      return;
    }

    try {
      const index = await fs.readJson(indexPath);
      if (!isValidRunsIndex(index)) {
        throw new Error("invalid index shape");
      }
      printDashboardResult(buildRunIndexDashboard(index, dashboardOptions), asJson);
    } catch {
      console.error("Could not read .factory/runs-index.json.");
      console.error("Reason: malformed JSON or invalid index shape.");
      process.exitCode = 1;
    }
  });

program
  .command("insights")
  .description("Show read-only governance insights for historical repair runs")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--json", "Print machine-readable JSON")
  .option("--export", "Export governance insights JSON and Markdown")
  .option("--archive", "Archive generated export files")
  .option("--profile <name>", "Governance policy profile: conservative, balanced, or experimental")
  .option("--profiles", "List available governance policy profiles")
  .action(async (options) => {
    const repoPath = path.resolve(options.repo);
    const asJson = !!options.json;

    if (options.archive && !options.export) {
      console.error(renderArchiveRequiresExportError("insights").trimEnd());
      process.exitCode = 1;
      return;
    }

    if (options.profiles) {
      printGovernancePolicyProfiles(asJson);
      return;
    }

    let profile: GovernancePolicyProfileName = "balanced";
    if (options.profile !== undefined) {
      if (!isGovernancePolicyProfileName(options.profile)) {
        console.error(`Invalid governance policy profile: ${options.profile}`);
        console.error("Allowed profiles: conservative, balanced, experimental");
        console.error("Run:\n  node dist/cli.js insights --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      profile = options.profile;
    }

    const insights = loadGovernanceInsights(repoPath, { profile });

    if (options.export) {
      const exportResult = exportGovernanceInsights(repoPath, insights);
      const archiveResult = options.archive
        ? archiveExportResult(repoPath, "governance-insights", exportResult.files, "insights --export --archive", {
            profile: insights.policyProfile.name,
            runCount: insights.totalRuns
          })
        : null;
      printExportAndArchiveResult(exportResult, archiveResult, asJson, printInsightsExportResult, "Archived governance insights:");
      return;
    }

    if (asJson) {
      console.log(JSON.stringify(insights, null, 2));
      return;
    }

    console.log(renderGovernanceInsightsMarkdown(insights));
  });

program
  .command("ci-summary")
  .description("Show CI-friendly governance summary for historical repair runs")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--profile <name>", "Governance policy profile: conservative, balanced, or experimental")
  .option("--json", "Print machine-readable JSON")
  .option("--export", "Export governance CI summary JSON and Markdown")
  .option("--archive", "Archive generated export files")
  .action(async (options) => {
    const profile = parseGovernancePolicyProfileOption(options.profile);
    if (profile === null) {
      console.error(`Invalid governance policy profile: ${options.profile}`);
      console.error("Allowed profiles: conservative, balanced, experimental");
      console.error("Run:\n  node dist/cli.js ci-summary --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    if (options.archive && !options.export) {
      console.error(renderArchiveRequiresExportError("ci-summary").trimEnd());
      process.exitCode = 1;
      return;
    }

    const repoPath = path.resolve(options.repo);
    const summary = buildGovernanceCiSummary(loadGovernanceInsights(repoPath, { profile }));
    const asJson = !!options.json;

    if (options.export) {
      const exportResult = exportGovernanceCiSummary(repoPath, summary);
      const archiveResult = options.archive
        ? archiveExportResult(repoPath, "governance-ci-summary", exportResult.files, "ci-summary --export --archive", {
            profile: summary.evaluatedProfile.name,
            ciStatus: summary.status,
            runCount: summary.metrics.totalRuns
          })
        : null;
      printExportAndArchiveResult(exportResult, archiveResult, asJson, printCiSummaryExportResult, "Archived governance CI summary:");
    } else if (asJson) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderGovernanceCiSummaryMarkdown(summary));
    }

    if (summary.status === "fail") {
      process.exitCode = 1;
    }
  });

program
  .command("archive")
  .description("Show governance archive snapshot history")
  .argument("[subcommand]", "Optional archive subcommand")
  .argument("[archiveIdA]", "First archive ID for diff")
  .argument("[archiveIdB]", "Second archive ID for diff")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--latest", "Show latest archive snapshot only")
  .option("--kind <kind>", "Filter by archive kind")
  .option("--limit <n>", "Show latest n archive snapshots")
  .option("--json", "Print machine-readable JSON")
  .action(async (subcommand, archiveIdA, archiveIdB, options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    if (subcommand !== undefined) {
      if (subcommand !== "diff") {
        console.error(`Unknown archive subcommand: ${subcommand}`);
        console.error("Run:\n  node dist/cli.js archive --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      if (!archiveIdA || !archiveIdB) {
        console.error("Archive diff requires two archive IDs.");
        console.error("Run:\n  node dist/cli.js archive --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }

      try {
        const index = loadGovernanceArchiveIndex(repoPath);
        const previous = loadGovernanceArchiveSnapshot(repoPath, index, archiveIdA);
        const current = loadGovernanceArchiveSnapshot(repoPath, index, archiveIdB);
        if (previous.entry.kind !== current.entry.kind) {
          console.error("Archive diff requires both archives to have the same kind.");
          process.exitCode = 1;
          return;
        }
        const diff = buildGovernanceArchiveDiff({ previous, current });
        if (asJson) {
          console.log(JSON.stringify(diff, null, 2));
          return;
        }
        console.log(renderGovernanceArchiveDiffText(diff));
        return;
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Archive diff failed.");
        process.exitCode = 1;
        return;
      }
    }

    const dashboardOptions: GovernanceArchiveDashboardOptions = {
      latestOnly: !!options.latest
    };

    if (options.limit !== undefined) {
      const limit = parsePositiveInteger(options.limit);
      if (limit === null) {
        console.error(`Invalid limit value: ${options.limit}`);
        console.error("Limit must be a positive integer.");
        console.error("Run:\n  node dist/cli.js archive --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      dashboardOptions.limit = limit;
    } else if (!dashboardOptions.latestOnly) {
      dashboardOptions.limit = 20;
    }

    if (options.kind !== undefined) {
      if (!isGovernanceArchiveKind(options.kind)) {
        console.error(`Invalid archive kind: ${options.kind}`);
        console.error("Allowed kinds: runs-dashboard, governance-insights, governance-ci-summary");
        console.error("Run:\n  node dist/cli.js archive --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      dashboardOptions.kind = options.kind;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const result = (await fs.pathExists(indexPath))
      ? buildGovernanceArchiveDashboard(loadGovernanceArchiveIndex(repoPath), dashboardOptions)
      : buildMissingGovernanceArchiveDashboard(dashboardOptions);

    if (asJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(renderGovernanceArchiveDashboardText(result));
  });

program
  .command("trends")
  .description("Show read-only governance trend analysis from archive history")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--kind <kind>", "Archive kind to analyze", "governance-insights")
  .option("--window <n>", "Snapshot window size")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);
    const kind = options.kind ?? "governance-insights";

    if (kind !== "governance-insights") {
      console.error("Governance trend analysis currently supports:");
      console.error("- governance-insights");
      console.error("Run:\n  node dist/cli.js trends --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js trends --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const snapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind,
          windowSize
        })
      : [];

    const totalSnapshots = index?.archives.filter((entry) => entry.kind === kind).length ?? 0;
    const analysis = buildGovernanceTrendAnalysis({
      snapshots,
      analyzedKind: kind,
      windowSize,
      totalSnapshots
    });

    if (asJson) {
      console.log(JSON.stringify(analysis, null, 2));
      return;
    }

    console.log(renderGovernanceTrendAnalysisText(analysis));
  });

program
  .command("drift")
  .description("Show read-only governance drift detection from archive history")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--kind <kind>", "Archive kind to analyze", "governance-insights")
  .option("--baseline-window <n>", "Historical baseline window")
  .option("--comparison-window <n>", "Recent comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);
    const kind = options.kind ?? "governance-insights";

    if (kind !== "governance-insights") {
      console.error("Governance drift detection currently supports:");
      console.error("- governance-insights");
      console.error("Run:\n  node dist/cli.js drift --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js drift --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js drift --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const snapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind,
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];

    const drift = buildGovernanceDriftDetection({
      snapshots,
      analyzedKind: kind,
      baselineWindowSize,
      comparisonWindowSize
    });

    if (asJson) {
      console.log(JSON.stringify(drift, null, 2));
      return;
    }

    console.log(renderGovernanceDriftDetectionText(drift));
  });

program
  .command("stability")
  .description("Show read-only governance operational stability score")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js stability --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js stability --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js stability --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const trendSnapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          windowSize
        })
      : [];
    const driftSnapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];
    const totalSnapshots = index?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
    const trend = buildGovernanceTrendAnalysis({
      snapshots: trendSnapshots,
      analyzedKind: "governance-insights",
      windowSize,
      totalSnapshots
    });
    const drift = buildGovernanceDriftDetection({
      snapshots: driftSnapshots,
      analyzedKind: "governance-insights",
      baselineWindowSize,
      comparisonWindowSize
    });
    const stability = buildGovernanceStabilityScore({ trend, drift });

    if (asJson) {
      console.log(JSON.stringify(stability, null, 2));
      return;
    }

    console.log(renderGovernanceStabilityScoreText(stability));
  });

program
  .command("escalation")
  .description("Show read-only governance operator escalation status")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js escalation --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js escalation --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js escalation --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const trendSnapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          windowSize
        })
      : [];
    const driftSnapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];
    const totalSnapshots = index?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
    const trend = buildGovernanceTrendAnalysis({
      snapshots: trendSnapshots,
      analyzedKind: "governance-insights",
      windowSize,
      totalSnapshots
    });
    const drift = buildGovernanceDriftDetection({
      snapshots: driftSnapshots,
      analyzedKind: "governance-insights",
      baselineWindowSize,
      comparisonWindowSize
    });
    const stability = buildGovernanceStabilityScore({ trend, drift });
    const escalation = buildGovernanceEscalation({ stability });

    if (asJson) {
      console.log(JSON.stringify(escalation, null, 2));
      return;
    }

    console.log(renderGovernanceEscalationText(escalation));
  });

program
  .command("policy")
  .description("Show read-only governance policy recommendation")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js policy --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js policy --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js policy --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const trendSnapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          windowSize
        })
      : [];
    const driftSnapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];
    const totalSnapshots = index?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
    const trend = buildGovernanceTrendAnalysis({
      snapshots: trendSnapshots,
      analyzedKind: "governance-insights",
      windowSize,
      totalSnapshots
    });
    const drift = buildGovernanceDriftDetection({
      snapshots: driftSnapshots,
      analyzedKind: "governance-insights",
      baselineWindowSize,
      comparisonWindowSize
    });
    const stability = buildGovernanceStabilityScore({ trend, drift });
    const escalation = buildGovernanceEscalation({ stability });
    const policy = buildGovernancePolicyEnforcement({ escalation });

    if (asJson) {
      console.log(JSON.stringify(policy, null, 2));
      return;
    }

    console.log(renderGovernancePolicyEnforcementText(policy));
  });

program
  .command("decision-matrix")
  .description("Show read-only governance decision reasoning matrix")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js decision-matrix --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js decision-matrix --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js decision-matrix --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const trendSnapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          windowSize
        })
      : [];
    const driftSnapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];
    const totalSnapshots = index?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
    const trend = buildGovernanceTrendAnalysis({
      snapshots: trendSnapshots,
      analyzedKind: "governance-insights",
      windowSize,
      totalSnapshots
    });
    const drift = buildGovernanceDriftDetection({
      snapshots: driftSnapshots,
      analyzedKind: "governance-insights",
      baselineWindowSize,
      comparisonWindowSize
    });
    const stability = buildGovernanceStabilityScore({ trend, drift });
    const escalation = buildGovernanceEscalation({ stability });
    const policy = buildGovernancePolicyEnforcement({ escalation });
    const decisionMatrix = buildGovernanceDecisionMatrix({ trend, drift, stability, escalation, policy });

    if (asJson) {
      console.log(JSON.stringify(decisionMatrix, null, 2));
      return;
    }

    console.log(renderGovernanceDecisionMatrixText(decisionMatrix));
  });

program
  .command("evidence-pack")
  .description("Export deterministic governance evidence pack")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js evidence-pack --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js evidence-pack --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js evidence-pack --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const indexPath = getGovernanceArchiveIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath)) ? loadGovernanceArchiveIndex(repoPath) : null;
    const trendSnapshots = index
      ? loadGovernanceTrendSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          windowSize
        })
      : [];
    const driftSnapshots = index
      ? loadGovernanceDriftSnapshots({
          projectRoot: repoPath,
          index,
          kind: "governance-insights",
          maxSnapshots: baselineWindowSize + comparisonWindowSize
        })
      : [];
    const totalSnapshots = index?.archives.filter((entry) => entry.kind === "governance-insights").length ?? 0;
    const trend = buildGovernanceTrendAnalysis({
      snapshots: trendSnapshots,
      analyzedKind: "governance-insights",
      windowSize,
      totalSnapshots
    });
    const drift = buildGovernanceDriftDetection({
      snapshots: driftSnapshots,
      analyzedKind: "governance-insights",
      baselineWindowSize,
      comparisonWindowSize
    });
    const stability = buildGovernanceStabilityScore({ trend, drift });
    const escalation = buildGovernanceEscalation({ stability });
    const policy = buildGovernancePolicyEnforcement({ escalation });
    const decisionMatrix = buildGovernanceDecisionMatrix({ trend, drift, stability, escalation, policy });
    const evidencePack = buildGovernanceEvidencePack({
      projectRoot: repoPath,
      trend,
      drift,
      stability,
      escalation,
      policy,
      decisionMatrix
    });
    const manifest = readGovernanceEvidenceManifest(repoPath, evidencePack.manifestPath);
    const evidenceEntry = buildGovernanceEvidenceIndexEntry({ manifest, evidencePack });
    const evidenceIndex = updateGovernanceEvidenceIndex(loadGovernanceEvidenceIndex(repoPath), evidenceEntry);
    saveGovernanceEvidenceIndex(repoPath, evidenceIndex);

    if (asJson) {
      console.log(JSON.stringify(evidencePack, null, 2));
      return;
    }

    console.log("Generated governance evidence pack:");
    console.log(`Evidence pack ID: ${evidencePack.evidencePackId}`);
    console.log(`Output directory: ${evidencePack.outputDirectory}`);
    console.log("Generated files:");
    for (const file of evidencePack.generatedFiles) {
      console.log(`- ${file}`);
    }
  });

program
  .command("evidence-list")
  .description("Show governance evidence pack registry")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--latest", "Show latest evidence pack only")
  .option("--limit <n>", "Limit results")
  .option("--policy <mode>", "Filter by policy mode")
  .option("--escalation <level>", "Filter by escalation level")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);
    const filterOptions: GovernanceEvidenceIndexFilterOptions = {
      latestOnly: !!options.latest
    };

    if (options.limit !== undefined) {
      const limit = parsePositiveInteger(options.limit);
      if (limit === null) {
        console.error(`Invalid limit value: ${options.limit}`);
        console.error("Limit must be a positive integer.");
        console.error("Run:\n  node dist/cli.js evidence-list --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      filterOptions.limit = Math.min(limit, 100);
    }

    if (options.policy !== undefined) {
      if (!GOVERNANCE_EVIDENCE_POLICY_MODES.includes(options.policy)) {
        console.error(`Invalid policy mode: ${options.policy}`);
        console.error(`Allowed policy modes: ${GOVERNANCE_EVIDENCE_POLICY_MODES.join(", ")}`);
        console.error("Run:\n  node dist/cli.js evidence-list --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      filterOptions.policyMode = options.policy;
    }

    if (options.escalation !== undefined) {
      if (!GOVERNANCE_EVIDENCE_ESCALATION_LEVELS.includes(options.escalation)) {
        console.error(`Invalid escalation level: ${options.escalation}`);
        console.error(`Allowed escalation levels: ${GOVERNANCE_EVIDENCE_ESCALATION_LEVELS.join(", ")}`);
        console.error("Run:\n  node dist/cli.js evidence-list --help\n\nfor usage.");
        process.exitCode = 1;
        return;
      }
      filterOptions.escalationLevel = options.escalation;
    }

    const indexPath = getGovernanceEvidenceIndexPath(repoPath);
    const index = (await fs.pathExists(indexPath))
      ? loadGovernanceEvidenceIndex(repoPath)
      : { version: 1 as const, updatedAt: "1970-01-01T00:00:00.000Z", entries: [] };
    const filtered = filterGovernanceEvidenceIndex(index, filterOptions);

    if (asJson) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }

    console.log(renderGovernanceEvidenceIndexText(filtered));
  });

program
  .command("evidence-diff")
  .description("Compare two governance evidence packs")
  .argument("<evidencePackIdA>", "Previous evidence pack ID")
  .argument("<evidencePackIdB>", "Current evidence pack ID")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--json", "Print machine-readable JSON")
  .action(async (evidencePackIdA, evidencePackIdB, options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);
    const indexPath = getGovernanceEvidenceIndexPath(repoPath);

    if (!(await fs.pathExists(indexPath))) {
      console.error("No governance evidence index found.");
      console.error("Run node dist/cli.js evidence-pack first.");
      process.exitCode = 1;
      return;
    }

    try {
      const index = loadGovernanceEvidenceIndex(repoPath);
      const previous = loadGovernanceEvidencePack(repoPath, index, evidencePackIdA);
      const current = loadGovernanceEvidencePack(repoPath, index, evidencePackIdB);
      const diff = buildGovernanceEvidenceDiff({ previous, current });

      if (asJson) {
        console.log(JSON.stringify(diff, null, 2));
        return;
      }

      console.log(renderGovernanceEvidenceDiffText(diff));
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Governance evidence diff failed.");
      process.exitCode = 1;
    }
  });

program
  .command("governance")
  .description("Show unified governance control plane summary")
  .option("--repo <path>", "Path to target repository", process.cwd())
  .option("--window <n>", "Trend analysis window")
  .option("--baseline-window <n>", "Drift baseline window")
  .option("--comparison-window <n>", "Drift comparison window")
  .option("--json", "Print machine-readable JSON")
  .action(async (options) => {
    const asJson = !!options.json;
    const repoPath = path.resolve(options.repo);

    const windowSize = parseTrendWindow(options.window);
    if (windowSize === null) {
      console.error(`Invalid window value: ${options.window}`);
      console.error("Window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js governance --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const baselineWindowSize = parseDriftWindow(options.baselineWindow, 20);
    if (baselineWindowSize === null) {
      console.error(`Invalid baseline window value: ${options.baselineWindow}`);
      console.error("Baseline window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js governance --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const comparisonWindowSize = parseDriftWindow(options.comparisonWindow, 5);
    if (comparisonWindowSize === null) {
      console.error(`Invalid comparison window value: ${options.comparisonWindow}`);
      console.error("Comparison window must be a positive integer.");
      console.error("Run:\n  node dist/cli.js governance --help\n\nfor usage.");
      process.exitCode = 1;
      return;
    }

    const signals = await buildGovernanceSignalBundle(repoPath, windowSize, baselineWindowSize, comparisonWindowSize);
    const ciSummary = buildGovernanceCiSummary(loadGovernanceInsights(repoPath));
    const archiveIndexPath = getGovernanceArchiveIndexPath(repoPath);
    const evidenceIndexPath = getGovernanceEvidenceIndexPath(repoPath);
    const archiveIndexExists = await fs.pathExists(archiveIndexPath);
    const evidenceIndexExists = await fs.pathExists(evidenceIndexPath);
    const evidenceIndex = evidenceIndexExists ? loadGovernanceEvidenceIndex(repoPath) : null;
    const controlPlane = buildGovernanceControlPlane({
      stability: signals.stability,
      escalation: signals.escalation,
      policy: signals.policy,
      ciSummary,
      latestArchive: signals.archiveIndex?.archives[0],
      latestEvidencePack: evidenceIndex?.entries[0],
      missingArchiveIndex: !archiveIndexExists,
      missingEvidenceIndex: !evidenceIndexExists
    });

    if (asJson) {
      console.log(JSON.stringify(controlPlane, null, 2));
      return;
    }

    console.log(renderGovernanceControlPlaneText(controlPlane));
  });

program.parseAsync(process.argv);
