#!/usr/bin/env node

/**
 * MCP Server for the NGO Document Generator.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { processTask } from './task-processor.js';
import { TaskType } from './models.js';
import { ensureDirectories } from './config.js';

// Create server instance
const server = new Server(
  {
    name: 'ngo-document-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools = [
  {
    name: 'generate_references',
    description: 'Generate a professional reference document for an employee/volunteer',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'First name of the person' },
        surname: { type: 'string', description: 'Last name of the person' },
        role: { type: 'string', description: 'Role name' },
        additionalInfo: { type: 'string', description: 'Additional information for the reference' },
      },
      required: ['name', 'surname'],
    },
  },
  {
    name: 'generate_cert',
    description: 'Generate a certificate of participation/work for an employee/volunteer',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'First name of the person' },
        surname: { type: 'string', description: 'Last name of the person' },
        role: { type: 'string', description: 'Role name' },
        additionalInfo: { type: 'string', description: 'Additional information for the certificate' },
      },
      required: ['name', 'surname'],
    },
  },
  {
    name: 'generate_internship',
    description: 'Generate an internship evaluation document',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'First name of the intern' },
        surname: { type: 'string', description: 'Last name of the intern' },
        role: { type: 'string', description: 'Role/position name' },
        additionalInfo: { type: 'string', description: 'Additional info including university requirements' },
      },
      required: ['name', 'surname'],
    },
  },
];

// Map tool names to task types
const toolTaskMap = {
  generate_references: TaskType.REFERENCES,
  generate_cert: TaskType.CERT,
  generate_internship: TaskType.INTERNSHIP,
};

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`Tool called: ${name} with arguments:`, args);

  const taskType = toolTaskMap[name];
  if (!taskType) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${name}` }),
        },
      ],
    };
  }

  const taskInput = {
    task: taskType,
    name: args.name || '',
    surname: args.surname || '',
    role: args.role || '',
    additionalInfo: args.additionalInfo || '',
  };

  const result = await processTask(taskInput);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
});

// Main function
async function main() {
  ensureDirectories();
  console.error('Starting NGO Document Generator MCP Server');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
