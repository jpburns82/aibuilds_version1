import * as path from 'path';
import * as fs from 'fs';
import { FileWriter } from '../tools/fileWriter';
import { Logger } from '../utils/logger';
import { parseBlueprint, Blueprint } from '../blueprint/BlueprintSchema';
import { shouldBlockScaffolding } from '../blueprint/StrictnessProfiles';

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectStructure {
  name: string;
  description: string;
  files: ProjectFile[];
  directories: string[];
}

export class ProjectScaffolder {
  private fileWriter: FileWriter;

  constructor(baseOutputDir: string = './output') {
    this.fileWriter = new FileWriter(baseOutputDir);
  }

  scaffoldProject(
    structure: ProjectStructure,
    blueprintPath?: string
  ): {
    success: boolean;
    projectPath: string;
    filesCreated: number;
    errors: string[];
    blocked?: boolean;
  } {
    Logger.step(`Scaffolding project: ${structure.name}`);

    // Pre-scaffolding validation
    if (blueprintPath) {
      const validationResult = this.validateBeforeScaffolding(structure, blueprintPath);
      if (validationResult.blocked) {
        Logger.error('Scaffolding BLOCKED due to validation failures', {
          critical: validationResult.criticalCount,
          errors: validationResult.errorCount,
        });
        return {
          success: false,
          projectPath: '',
          filesCreated: 0,
          errors: validationResult.violations.map(v => v.message),
          blocked: true,
        };
      }
    }

    const projectPath = path.join(
      this.fileWriter.getOutputDirectory(),
      this.sanitizeProjectName(structure.name)
    );

    this.fileWriter.setOutputDirectory(projectPath);

    const errors: string[] = [];
    let filesCreated = 0;

    Logger.info(`Creating ${structure.directories.length} directories`);
    for (const dir of structure.directories) {
      try {
        const result = this.fileWriter.writeFile(
          path.join(dir, '.gitkeep'),
          '',
          { overwrite: true }
        );
        if (result.success) {
          filesCreated++;
        }
      } catch (error) {
        errors.push(`Failed to create directory ${dir}: ${error}`);
      }
    }

    Logger.info(`Writing ${structure.files.length} files`);
    const writeResult = this.fileWriter.writeFiles(structure.files, {
      overwrite: true,
    });

    filesCreated += writeResult.filesWritten;
    errors.push(...writeResult.errors);

    if (errors.length > 0) {
      Logger.warn('Project scaffolding completed with errors', errors);
    } else {
      Logger.info(`Project scaffolded successfully: ${projectPath}`);
    }

    return {
      success: errors.length === 0,
      projectPath,
      filesCreated,
      errors,
    };
  }

  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Validate project structure before scaffolding
   */
  private validateBeforeScaffolding(
    structure: ProjectStructure,
    blueprintPath: string
  ): {
    blocked: boolean;
    violations: Array<{ message: string; severity: string }>;
    criticalCount: number;
    errorCount: number;
  } {
    try {
      if (!fs.existsSync(blueprintPath)) {
        Logger.warn('Blueprint not found, skipping pre-scaffolding validation');
        return { blocked: false, violations: [], criticalCount: 0, errorCount: 0 };
      }

      const blueprintJson = fs.readFileSync(blueprintPath, 'utf-8');
      const blueprint: Blueprint = parseBlueprint(blueprintJson);

      Logger.info('Running pre-scaffolding validation');

      const violations: Array<{ message: string; severity: string }> = [];

      // Validate line counts
      for (const file of structure.files) {
        const lineCount = file.content.split('\n').length;
        if (lineCount > blueprint.maxLinesPerFile) {
          const severity = 'error';
          violations.push({
            message: `File ${file.path} exceeds ${blueprint.maxLinesPerFile} lines (${lineCount} lines)`,
            severity,
          });
        }
      }

      // Validate required files exist
      if (blueprint.requiredFiles) {
        for (const requiredFile of blueprint.requiredFiles) {
          const exists = structure.files.some(f => f.path.includes(requiredFile));
          if (!exists) {
            violations.push({
              message: `Required file missing: ${requiredFile}`,
              severity: 'warning',
            });
          }
        }
      }

      const criticalCount = violations.filter(v => v.severity === 'critical').length;
      const errorCount = violations.filter(v => v.severity === 'error').length;

      // Check if scaffolding should be blocked
      const profile = { mode: blueprint.strictnessProfile };
      const shouldBlock = violations.some(v => shouldBlockScaffolding(v.severity as any, profile as any));

      if (violations.length > 0) {
        Logger.warn('Pre-scaffolding validation violations found:', violations.slice(0, 5));
      }

      return {
        blocked: shouldBlock,
        violations,
        criticalCount,
        errorCount,
      };
    } catch (error) {
      Logger.error('Pre-scaffolding validation failed', error);
      return { blocked: false, violations: [], criticalCount: 0, errorCount: 0 };
    }
  }

  parseAgentOutputToProject(
    projectName: string,
    agentOutputs: { role: string; content: string }[]
  ): ProjectStructure {
    const files: ProjectFile[] = [];
    const directories: Set<string> = new Set();

    for (const output of agentOutputs) {
      const extractedFiles = this.extractFilesFromMarkdown(output.content);
      files.push(...extractedFiles);

      for (const file of extractedFiles) {
        const dir = path.dirname(file.path);
        if (dir && dir !== '.') {
          directories.add(dir);
        }
      }
    }

    return {
      name: projectName,
      description: `Generated project: ${projectName}`,
      files,
      directories: Array.from(directories),
    };
  }

  private extractFilesFromMarkdown(markdown: string): ProjectFile[] {
    const files: ProjectFile[] = [];
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
    const filePathRegex = /^(?:#+\s*)?(?:File|Path):\s*`?([^\n`]+)`?/gim;

    let currentFilePath: string | null = null;
    const lines = markdown.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const pathMatch = filePathRegex.exec(line);

      if (pathMatch) {
        currentFilePath = pathMatch[1].trim();
        continue;
      }

      if (line.trim().startsWith('```')) {
        const match = codeBlockRegex.exec(markdown.substring(markdown.indexOf(line)));
        if (match && currentFilePath) {
          files.push({
            path: currentFilePath,
            content: match[2].trim(),
          });
          currentFilePath = null;
        }
      }
    }

    const explicitFileRegex = /#### `([^`]+)`\n\n```[\w]*\n([\s\S]*?)```/g;
    let match;
    while ((match = explicitFileRegex.exec(markdown)) !== null) {
      files.push({
        path: match[1],
        content: match[2].trim(),
      });
    }

    return files;
  }
}
