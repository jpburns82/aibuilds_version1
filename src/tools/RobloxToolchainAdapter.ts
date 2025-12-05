/**
 * RobloxToolchainAdapter - Interface for Rojo-based Roblox Development
 *
 * PHASE 2 - CONFIGURATION HELPERS ONLY
 *
 * Purpose: Provides tools for Roblox game development via Rojo + VS Code
 * Scope: Configuration helpers, template generation, validation
 * Integration Method: Rojo syncs to Roblox Studio (preview only)
 *
 * Architecture Rules:
 * - Agents NEVER launch Roblox Studio
 * - Agents NEVER modify .rbxl or .rbxlx binary files
 * - All Roblox work occurs in /game/src/* and default.project.json
 * - Roblox Studio is preview-only, not editing workspace
 */

/**
 * Rojo project configuration structure
 * Matches default.project.json schema
 */
export interface RojoProjectConfig {
  name: string;
  tree: RojoTree;
  servePlaceIds?: number[];
  servePort?: number;
  globIgnorePaths?: string[];
}

/**
 * Rojo tree structure (maps folders to Roblox instances)
 */
export interface RojoTree {
  $className?: string;
  $path?: string;
  $ignoreUnknownInstances?: boolean;
  [key: string]: RojoTree | string | boolean | undefined;
}

/**
 * Standard Roblox project structure
 */
export interface RobloxProjectStructure {
  /** Project root directory */
  projectRoot: string;

  /** Client-side code folder */
  clientPath: string;

  /** Server-side code folder */
  serverPath: string;

  /** Shared code folder */
  sharedPath: string;

  /** Rojo configuration file path */
  rojoConfigPath: string;
}

/**
 * Roblox folder mapping validation result
 */
export interface RojoValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * RobloxToolchainAdapter - Configuration and validation helpers
 */
export class RobloxToolchainAdapter {
  /**
   * Generate a default Rojo project configuration
   * Creates standard client/server/shared structure
   */
  static generateRojoConfig(projectName: string): RojoProjectConfig {
    return {
      name: projectName,
      tree: {
        $className: 'DataModel',
        ReplicatedStorage: {
          $className: 'ReplicatedStorage',
          Shared: {
            $path: 'src/shared',
          },
        },
        ServerScriptService: {
          $className: 'ServerScriptService',
          Server: {
            $path: 'src/server',
          },
        },
        StarterPlayer: {
          $className: 'StarterPlayer',
          StarterPlayerScripts: {
            $className: 'StarterPlayerScripts',
            Client: {
              $path: 'src/client',
            },
          },
        },
      },
      servePort: 34872,
    };
  }

  /**
   * Generate default.project.json content as string
   */
  static generateRojoConfigString(projectName: string): string {
    const config = this.generateRojoConfig(projectName);
    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate standard Roblox folder structure specification
   * Returns paths that should be created
   */
  static generateFolderStructure(projectRoot: string): RobloxProjectStructure {
    return {
      projectRoot,
      clientPath: `${projectRoot}/src/client`,
      serverPath: `${projectRoot}/src/server`,
      sharedPath: `${projectRoot}/src/shared`,
      rojoConfigPath: `${projectRoot}/default.project.json`,
    };
  }

  /**
   * Validate Rojo project configuration
   * Checks for common issues and missing required fields
   */
  static validateRojoConfig(config: unknown): RojoValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Type check
    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be a valid object');
      return { valid: false, errors, warnings };
    }

    const rojoConfig = config as Partial<RojoProjectConfig>;

    // Required fields
    if (!rojoConfig.name || typeof rojoConfig.name !== 'string') {
      errors.push('Project name is required and must be a string');
    }

    if (!rojoConfig.tree || typeof rojoConfig.tree !== 'object') {
      errors.push('Tree structure is required and must be an object');
    } else {
      // Validate tree structure
      const tree = rojoConfig.tree;

      if (tree.$className !== 'DataModel') {
        warnings.push('Root tree should have $className: "DataModel"');
      }

      // Check for standard service folders
      const hasReplicatedStorage = 'ReplicatedStorage' in tree;
      const hasServerScriptService = 'ServerScriptService' in tree;

      if (!hasReplicatedStorage) {
        warnings.push('Missing ReplicatedStorage - shared code location');
      }

      if (!hasServerScriptService) {
        warnings.push('Missing ServerScriptService - server code location');
      }
    }

    // Optional field validation
    if (rojoConfig.servePort !== undefined) {
      if (typeof rojoConfig.servePort !== 'number') {
        errors.push('servePort must be a number');
      } else if (rojoConfig.servePort < 1024 || rojoConfig.servePort > 65535) {
        warnings.push('servePort should be between 1024 and 65535');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate folder structure matches Rojo mappings
   * Checks that $path references point to valid locations
   */
  static validateFolderMappings(
    tree: RojoTree,
    basePath: string = ''
  ): RojoValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validateNode = (node: RojoTree, path: string): void => {
      if (node.$path && typeof node.$path === 'string') {
        // Structural validation only (file system check during scaffolding)
        if (node.$path.includes('..')) {
          errors.push(`Path "${node.$path}" contains parent directory reference`);
        }
        if (node.$path.startsWith('/')) {
          warnings.push(`Path "${node.$path}" is absolute, should be relative`);
        }
      }

      // Recursively validate child nodes
      for (const [key, value] of Object.entries(node)) {
        if (
          key.startsWith('$') ||
          typeof value !== 'object' ||
          value === null
        ) {
          continue;
        }
        validateNode(value as RojoTree, `${path}/${key}`);
      }
    };

    validateNode(tree, '');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Roblox development constants
 */
export const ROBLOX_CONSTANTS = {
  /** Default Rojo serve port */
  DEFAULT_ROJO_PORT: 34872,

  /** Standard folder names */
  FOLDERS: {
    CLIENT: 'client',
    SERVER: 'server',
    SHARED: 'shared',
  },

  /** Roblox service class names */
  SERVICES: {
    REPLICATED_STORAGE: 'ReplicatedStorage',
    SERVER_SCRIPT_SERVICE: 'ServerScriptService',
    STARTER_PLAYER: 'StarterPlayer',
    STARTER_PLAYER_SCRIPTS: 'StarterPlayerScripts',
  },

  /** File extensions */
  EXTENSIONS: {
    LUA: '.lua',
    LUAU: '.luau',
  },
} as const;
