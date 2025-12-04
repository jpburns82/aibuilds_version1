import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface WriteFileOptions {
  overwrite?: boolean;
  createDirectories?: boolean;
}

export class FileWriter {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      Logger.info(`Created output directory: ${this.outputDir}`);
    }
  }

  writeFile(
    relativePath: string,
    content: string,
    options: WriteFileOptions = {}
  ): { success: boolean; path: string; error?: string } {
    try {
      const fullPath = path.join(this.outputDir, relativePath);
      const directory = path.dirname(fullPath);

      if (options.createDirectories !== false) {
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
      }

      if (fs.existsSync(fullPath) && !options.overwrite) {
        return {
          success: false,
          path: fullPath,
          error: 'File already exists and overwrite is false',
        };
      }

      fs.writeFileSync(fullPath, content, 'utf-8');
      Logger.info(`File written: ${relativePath}`);

      return { success: true, path: fullPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to write file: ${relativePath}`, errorMessage);
      return { success: false, path: '', error: errorMessage };
    }
  }

  writeFiles(
    files: Array<{ path: string; content: string }>,
    options: WriteFileOptions = {}
  ): { success: boolean; filesWritten: number; errors: string[] } {
    const errors: string[] = [];
    let filesWritten = 0;

    for (const file of files) {
      const result = this.writeFile(file.path, file.content, options);
      if (result.success) {
        filesWritten++;
      } else {
        errors.push(`${file.path}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      filesWritten,
      errors,
    };
  }

  deleteFile(relativePath: string): boolean {
    try {
      const fullPath = path.join(this.outputDir, relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        Logger.info(`File deleted: ${relativePath}`);
        return true;
      }
      return false;
    } catch (error) {
      Logger.error(`Failed to delete file: ${relativePath}`, error);
      return false;
    }
  }

  setOutputDirectory(dir: string): void {
    this.outputDir = dir;
    this.ensureOutputDir();
  }

  getOutputDirectory(): string {
    return this.outputDir;
  }
}
