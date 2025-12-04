import { FileWriter} from './fileWriter';
import { FileReader } from './fileReader';

export interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any> | any;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private fileWriter: FileWriter;
  private fileReader: FileReader;

  constructor(outputDir: string = './output') {
    this.fileWriter = new FileWriter(outputDir);
    this.fileReader = new FileReader();
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    this.register({
      name: 'write_file',
      description: 'Write content to a file',
      execute: (params: { path: string; content: string; overwrite?: boolean }) => {
        return this.fileWriter.writeFile(params.path, params.content, {
          overwrite: params.overwrite,
        });
      },
    });

    this.register({
      name: 'write_files',
      description: 'Write multiple files at once',
      execute: (params: { files: Array<{ path: string; content: string }>; overwrite?: boolean }) => {
        return this.fileWriter.writeFiles(params.files, {
          overwrite: params.overwrite,
        });
      },
    });

    this.register({
      name: 'read_file',
      description: 'Read content from a file',
      execute: (params: { path: string }) => {
        return this.fileReader.readFile(params.path);
      },
    });

    this.register({
      name: 'list_files',
      description: 'List files in a directory',
      execute: (params: { path: string; extensions?: string[] }) => {
        return this.fileReader.listFilesRecursive(params.path, params.extensions);
      },
    });
  }

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  execute(name: string, params: any): any {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(params);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getFileWriter(): FileWriter {
    return this.fileWriter;
  }

  getFileReader(): FileReader {
    return this.fileReader;
  }
}
