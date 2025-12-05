/**
 * Pipeline Helper Functions
 *
 * Helper functions extracted from Pipeline to maintain <300 line limit
 */

import { ArchitectSpec } from '../blueprint/BlueprintGenerator';
import { ProjectMode } from '../blueprint/StrictnessProfiles';
import { parseBlueprint, BlueprintValidationReport } from '../blueprint/BlueprintSchema';
import { blueprintValidator } from '../validators/BlueprintValidator';
import { codeValidator } from '../validators/codeValidator';
import { structureValidator } from '../validators/structureValidator';
import { dependencyValidator } from '../validators/dependencyValidator';
import { robloxStructureValidator } from '../validators/RobloxStructureValidator';
import { rojoProjectValidator } from '../validators/RojoProjectValidator';
import { Logger } from '../utils/logger';
import * as fs from 'fs';

/**
 * Parse architect output into ArchitectSpec for blueprint generation
 */
export function parseArchitectOutput(
  architectOutput: string,
  projectName: string,
  userPrompt: string
): ArchitectSpec {
  const lowerOutput = architectOutput.toLowerCase();
  const lowerPrompt = userPrompt.toLowerCase();

  // Detect project mode
  let projectMode: ProjectMode = 'mvp'; // default
  if (lowerOutput.includes('prototype') || lowerPrompt.includes('prototype') ||
      lowerOutput.includes('quick') || lowerOutput.includes('rapid')) {
    projectMode = 'prototype';
  } else if (lowerOutput.includes('production') || lowerOutput.includes('enterprise')) {
    projectMode = 'production';
  }

  // Detect if Roblox project
  const isRobloxProject = lowerOutput.includes('roblox') || lowerOutput.includes('rojo') ||
                         lowerOutput.includes('.lua') || lowerOutput.includes('modulescript');

  // Extract folders (look for folder/directory mentions)
  const folders: string[] = [];
  const folderPatterns = [
    /(?:folder|directory|dir):\s*([^\n]+)/gi,
    /(?:create|make)\s+(?:folder|directory):\s*([^\n]+)/gi,
    /src\/([a-z-_]+)/gi,
  ];

  folderPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(architectOutput)) !== null) {
      const folder = match[1].trim();
      if (folder && !folders.includes(folder)) {
        folders.push(folder);
      }
    }
  });

  // Add default folders if none found
  if (folders.length === 0) {
    folders.push('src');
    if (isRobloxProject) {
      folders.push('src/client', 'src/server', 'src/shared');
    }
  }

  // Extract files (look for file mentions)
  const files: string[] = [];
  const filePatterns = [
    /file:\s*([^\n]+\.[a-z]+)/gi,
    /create\s+([^\s]+\.[a-z]+)/gi,
    /([a-z-_]+\.(ts|js|lua|luau|tsx|jsx))/gi,
  ];

  filePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(architectOutput)) !== null) {
      const file = match[1].trim();
      if (file && !files.includes(file)) {
        files.push(file);
      }
    }
  });

  // Extract dependencies
  const dependencies: string[] = [];
  const depPatterns = [
    /(?:dependency|dependencies|package):\s*([^\n]+)/gi,
    /npm install\s+([^\n]+)/gi,
  ];

  depPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(architectOutput)) !== null) {
      const deps = match[1].split(/[\s,]+/).filter(d => d && !d.startsWith('-'));
      dependencies.push(...deps);
    }
  });

  return {
    projectName,
    projectMode,
    description: `Generated from user prompt: ${userPrompt.substring(0, 100)}`,
    folders,
    files,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    isRobloxProject,
  };
}

/**
 * Run all validators and combine results
 */
export async function runValidators(
  blueprintPath: string,
  projectMode?: ProjectMode
): Promise<BlueprintValidationReport | null> {
  try {
    if (!fs.existsSync(blueprintPath)) {
      Logger.warn('Blueprint file not found, skipping validation');
      return null;
    }

    const blueprintJson = await fs.promises.readFile(blueprintPath, 'utf-8');
    const blueprint = parseBlueprint(blueprintJson);

    Logger.step('Running blueprint validators');

    // Run all validators in parallel
    const [
      blueprintReport,
      codeReport,
      structureReport,
      dependencyReport,
      robloxReport,
      rojoReport,
    ] = await Promise.all([
      blueprintValidator.validate(blueprint),
      codeValidator.validate(blueprint),
      structureValidator.validate(blueprint),
      dependencyValidator.validate(blueprint),
      blueprint.robloxRules ? robloxStructureValidator.validate(projectMode || 'mvp') : Promise.resolve({ valid: true, violations: [], warnings: [], info: [], summary: { totalViolations: 0, critical: 0, errors: 0, warnings: 0, info: 0 }, testedAt: new Date(), profile: projectMode || 'mvp' }),
      blueprint.robloxRules ? rojoProjectValidator.validate(projectMode || 'mvp') : Promise.resolve({ valid: true, violations: [], warnings: [], info: [], summary: { totalViolations: 0, critical: 0, errors: 0, warnings: 0, info: 0 }, testedAt: new Date(), profile: projectMode || 'mvp' }),
    ]);

    // Combine all violations
    const allViolations = [
      ...blueprintReport.violations,
      ...blueprintReport.warnings,
      ...codeReport.violations,
      ...codeReport.warnings,
      ...structureReport.violations,
      ...structureReport.warnings,
      ...dependencyReport.violations,
      ...dependencyReport.warnings,
      ...robloxReport.violations,
      ...robloxReport.warnings,
      ...rojoReport.violations,
      ...rojoReport.warnings,
    ];

    const critical = allViolations.filter(v => v.severity === 'critical');
    const errors = allViolations.filter(v => v.severity === 'error');
    const warnings = allViolations.filter(v => v.severity === 'warning');
    const info = allViolations.filter(v => v.severity === 'info');

    const combinedReport: BlueprintValidationReport = {
      valid: critical.length === 0 && errors.length === 0,
      violations: [...critical, ...errors],
      warnings,
      info,
      summary: {
        totalViolations: allViolations.length,
        critical: critical.length,
        errors: errors.length,
        warnings: warnings.length,
        info: info.length,
      },
      testedAt: new Date(),
      profile: projectMode || 'mvp',
    };

    // Log validation results
    Logger.info('Validation complete', {
      valid: combinedReport.valid,
      critical: combinedReport.summary.critical,
      errors: combinedReport.summary.errors,
      warnings: combinedReport.summary.warnings,
    });

    if (combinedReport.violations.length > 0) {
      Logger.warn('Validation violations found:', combinedReport.violations.slice(0, 5));
    }

    return combinedReport;
  } catch (error) {
    Logger.error('Validation failed', error);
    return null;
  }
}
