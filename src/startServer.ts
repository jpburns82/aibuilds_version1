/**
 * Start UI Server
 *
 * Entry point to start the UI backend server.
 */

import { createUIServer } from './clients/uiServer';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

console.log('Starting AI-Builds UI Server...');
createUIServer(PORT);
