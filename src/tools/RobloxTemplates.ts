/**
 * RobloxTemplates - Template Generation for Roblox Projects
 *
 * PHASE 2 - TEMPLATE HELPERS
 *
 * Purpose: Provides code templates and documentation for Roblox development
 * Separated from RobloxToolchainAdapter to maintain <300 line limit
 */

/**
 * Generate a starter ModuleScript template
 * Returns Luau code for a basic OOP module
 */
export function generateModuleScriptTemplate(moduleName: string): string {
  return `--[[
	${moduleName}

	A Luau ModuleScript following OOP patterns
]]

local ${moduleName} = {}
${moduleName}.__index = ${moduleName}

-- Constructor
function ${moduleName}.new()
	local self = setmetatable({}, ${moduleName})
	return self
end

-- Methods
function ${moduleName}:initialize()
	-- Initialization logic here
end

return ${moduleName}
`;
}

/**
 * Generate README instructions for Rojo setup
 */
export function generateRojoSetupInstructions(projectName: string): string {
  return `# ${projectName} - Roblox Project

## Setup Instructions

### Prerequisites
- Install Rojo: https://rojo.space/docs/v7/getting-started/installation/
- Install Roblox Studio

### Development Workflow

1. **Start Rojo Server**
   \`\`\`bash
   rojo serve
   \`\`\`

2. **Connect Roblox Studio**
   - Open Roblox Studio
   - Install the Rojo plugin if not already installed
   - Click "Connect" in the Rojo plugin panel
   - Default port: 34872

3. **Edit Code in VS Code**
   - All code in \`/src/client\`, \`/src/server\`, \`/src/shared\`
   - Changes sync automatically to Studio when Rojo is connected

4. **Test in Studio**
   - Use Studio as preview only
   - DO NOT edit scripts in Studio (changes will be overwritten)
   - Test gameplay and functionality

### Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── client/    # Client-side code (StarterPlayerScripts)
│   ├── server/    # Server-side code (ServerScriptService)
│   └── shared/    # Shared modules (ReplicatedStorage)
├── default.project.json  # Rojo configuration
└── README.md
\`\`\`

### Important Notes

- **Never edit code in Roblox Studio** - always use VS Code
- Rojo syncs changes in real-time when connected
- Studio is for preview, testing, and building only
- Keep files under 300 lines for maintainability
`;
}

/**
 * Generate a starter LocalScript for client
 */
export function generateClientScriptTemplate(scriptName: string): string {
  return `--[[
	${scriptName}

	Client-side initialization script
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer

-- Initialize client modules
local function initialize()
	print("Client initialized for", player.Name)
end

initialize()
`;
}

/**
 * Generate a starter Script for server
 */
export function generateServerScriptTemplate(scriptName: string): string {
  return `--[[
	${scriptName}

	Server-side initialization script
]]

local ServerScriptService = game:GetService("ServerScriptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Initialize server modules
local function initialize()
	print("Server initialized")
end

initialize()
`;
}

/**
 * Generate a shared utility module
 */
export function generateSharedModuleTemplate(moduleName: string): string {
  return `--[[
	${moduleName}

	Shared utility module (available to both client and server)
]]

local ${moduleName} = {}

-- Shared functions
function ${moduleName}.example()
	return "This runs on both client and server"
end

return ${moduleName}
`;
}

/**
 * Generate .gitignore for Roblox project
 */
export function generateRobloxGitignore(): string {
  return `# Roblox Studio files
*.rbxl
*.rbxlx
*.rbxm
*.rbxmx

# Rojo build artifacts
build/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/

# Logs
*.log
`;
}

/**
 * Roblox template constants
 */
export const ROBLOX_TEMPLATES = {
  /** Starter game types */
  GAME_TYPES: {
    OBBY: 'obby',
    SIMULATOR: 'simulator',
    TYCOON: 'tycoon',
    SHOWCASE: 'showcase',
  },

  /** Common Roblox services */
  SERVICES: [
    'Players',
    'ReplicatedStorage',
    'ServerScriptService',
    'StarterPlayer',
    'Workspace',
    'Lighting',
    'SoundService',
    'TweenService',
  ],
} as const;
