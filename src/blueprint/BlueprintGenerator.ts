/**
 * Blueprint Generator
 *
 * Generates architectural blueprints from ArchitectAgent specifications.
 * Saves blueprints to disk and triggers validation automatically.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Blueprint,
  DependencyRules,
  RobloxRules,
  NamingRules,
  serializeBlueprint,
} from './BlueprintSchema';
import {
  ProjectMode,
  getStrictnessProfile,
  StrictnessProfile,
} from './StrictnessProfiles';
import { buildFolderTree } from './BlueprintTreeBuilder';

/**
 * Architect's specification input
 */
export interface ArchitectSpec {
  projectName: string;
  projectMode: ProjectMode;
  description?: string;
  folders: string[];
  files: string[];
  dependencies?: string[];
  isRobloxProject?: boolean;
  customRules?: Partial<DependencyRules>;
}

/**
 * Blueprint generation result
 */
export interface GenerationResult {
  success: boolean;
  blueprint: Blueprint;
  savedTo?: string;
  errors?: string[];
}

/**
 * BlueprintGenerator class
 */
export class BlueprintGenerator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate blueprint from architect specification
   */
  generate(spec: ArchitectSpec): GenerationResult {
    try {
      const profile = getStrictnessProfile(spec.projectMode);
      const blueprint = this.buildBlueprint(spec, profile);
      return {
        success: true,
        blueprint,
      };
    } catch (error) {
      return {
        success: false,
        blueprint: this.createFallbackBlueprint(spec),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Generate and save blueprint to disk
   */
  async generateAndSave(spec: ArchitectSpec): Promise<GenerationResult> {
    const result = this.generate(spec);

    if (result.success) {
      try {
        const savePath = this.getSavePath(spec.projectName);
        await this.saveBlueprint(result.blueprint, savePath);
        result.savedTo = savePath;
      } catch (error) {
        result.success = false;
        result.errors = [
          ...(result.errors || []),
          `Failed to save: ${error instanceof Error ? error.message : 'Unknown'}`,
        ];
      }
    }

    return result;
  }

  /**
   * Build blueprint from specification
   */
  private buildBlueprint(
    spec: ArchitectSpec,
    profile: StrictnessProfile
  ): Blueprint {
    const folderTree = buildFolderTree(
      spec.projectName,
      spec.folders,
      spec.files
    );
    const requiredFiles = this.extractRequiredFiles(spec, profile);
    const dependencyRules = this.buildDependencyRules(spec);
    const robloxRules = spec.isRobloxProject
      ? this.buildRobloxRules(profile)
      : undefined;
    const namingRules = this.buildNamingRules(profile);

    return {
      projectName: spec.projectName,
      projectMode: spec.projectMode,
      strictnessProfile: profile.mode,
      version: '1.0.0',
      generatedAt: new Date(),
      generatedBy: 'ArchitectAgent',
      folderTree,
      requiredFiles,
      maxLinesPerFile: profile.maxLinesPerFile,
      dependencyRules,
      robloxRules,
      namingRules,
      description: spec.description,
      tags: spec.isRobloxProject ? ['roblox', 'game'] : [],
    };
  }

  /**
   * Extract required files
   */
  private extractRequiredFiles(
    spec: ArchitectSpec,
    profile: StrictnessProfile
  ): string[] {
    if (!profile.structureRequired) {
      return [];
    }
    return spec.files;
  }

  /**
   * Build dependency rules
   */
  private buildDependencyRules(spec: ArchitectSpec): DependencyRules {
    const defaults: DependencyRules = {
      allowedImports: [],
      forbiddenImports: ['eval', 'Function', 'require.cache'],
      allowRelativeImports: true,
      allowCrossFolderImports: true,
    };

    if (spec.customRules) {
      return { ...defaults, ...spec.customRules };
    }

    if (spec.dependencies) {
      defaults.allowedDependencies = spec.dependencies;
    }

    return defaults;
  }

  /**
   * Build Roblox rules
   */
  private buildRobloxRules(profile: StrictnessProfile): RobloxRules {
    return {
      requiresClientFolder: profile.mode !== 'prototype',
      requiresServerFolder: profile.mode !== 'prototype',
      requiresSharedFolder: false,
      moduleSuffix: '.lua',
      rojoMappingValidation: profile.robloxValidation === 'warnings' ? 'warning' : profile.robloxValidation,
      forbidServerInClient: profile.mode !== 'prototype',
      requireModuleScript: profile.mode === 'production',
      luauStrictMode: profile.mode === 'production',
    };
  }

  /**
   * Build naming rules
   */
  private buildNamingRules(profile: StrictnessProfile): NamingRules {
    if (profile.naming === 'loose') {
      return {
        fileNaming: 'any',
        folderNaming: 'any',
      };
    }

    if (profile.naming === 'moderate') {
      return {
        fileNaming: 'camelCase',
        folderNaming: 'kebab-case',
        variableNaming: 'camelCase',
      };
    }

    // Strict
    return {
      fileNaming: 'camelCase',
      folderNaming: 'kebab-case',
      variableNaming: 'camelCase',
      constantNaming: 'SCREAMING_SNAKE_CASE',
      componentNaming: 'PascalCase',
    };
  }

  /**
   * Create fallback blueprint on error
   */
  private createFallbackBlueprint(spec: ArchitectSpec): Blueprint {
    return {
      projectName: spec.projectName,
      projectMode: 'prototype',
      strictnessProfile: 'prototype',
      version: '1.0.0-fallback',
      generatedAt: new Date(),
      generatedBy: 'ArchitectAgent (fallback)',
      folderTree: {
        name: spec.projectName,
        type: 'folder',
        path: '/',
        required: true,
        children: [],
      },
      requiredFiles: [],
      maxLinesPerFile: 400,
      dependencyRules: {
        allowedImports: [],
        forbiddenImports: [],
        allowRelativeImports: true,
        allowCrossFolderImports: true,
      },
      namingRules: {
        fileNaming: 'any',
        folderNaming: 'any',
      },
      description: 'Fallback blueprint due to generation error',
    };
  }

  /**
   * Get save path for blueprint
   */
  private getSavePath(projectName: string): string {
    return path.join(this.projectRoot, 'blueprints', `${projectName}.json`);
  }

  /**
   * Save blueprint to disk
   */
  private async saveBlueprint(
    blueprint: Blueprint,
    savePath: string
  ): Promise<void> {
    const dir = path.dirname(savePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write blueprint
    const json = serializeBlueprint(blueprint);
    await fs.promises.writeFile(savePath, json, 'utf-8');
  }
}

/**
 * Singleton instance
 */
export const blueprintGenerator = new BlueprintGenerator();
