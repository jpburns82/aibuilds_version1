import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export class FileReader {
  readFile(filePath: string): { success: boolean; content?: string; error?: string } {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to read file: ${filePath}`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  readDirectory(dirPath: string): { success: boolean; files?: string[]; error?: string } {
    try {
      if (!fs.existsSync(dirPath)) {
        return { success: false, error: 'Directory does not exist' };
      }

      const files = fs.readdirSync(dirPath);
      return { success: true, files };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`Failed to read directory: ${dirPath}`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  getFileStats(filePath: string): { success: boolean; stats?: fs.Stats; error?: string } {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File does not exist' };
      }

      const stats = fs.statSync(filePath);
      return { success: true, stats };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  listFilesRecursive(dirPath: string, extensions?: string[]): string[] {
    const files: string[] = [];

    const walkDir = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          walkDir(fullPath);
        } else if (stats.isFile()) {
          if (!extensions || extensions.some(ext => fullPath.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    };

    if (fs.existsSync(dirPath)) {
      walkDir(dirPath);
    }

    return files;
  }
}
