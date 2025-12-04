import * as path from 'path';
import { FileWriter } from '../tools/fileWriter';
import { Logger } from '../utils/logger';

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

  scaffoldProject(structure: ProjectStructure): {
    success: boolean;
    projectPath: string;
    filesCreated: number;
    errors: string[];
  } {
    Logger.step(`Scaffolding project: ${structure.name}`);

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
