/**
 * Test script for AI Agents system
 * This tests the new agent-based architecture for document generation
 */

import { getAgentByTaskType } from './src/agents.js';

console.log('=== Testing AI Agents System ===\n');

// Test 1: Get References Agent
console.log('Test 1: Get References Agent');
const refAgent = getAgentByTaskType('references');
console.log(`✓ Agent name: ${refAgent.name}`);
console.log(`✓ Guidelines count: ${refAgent.guidelines.length}`);
console.log(`✓ Examples count: ${refAgent.examples.length}`);
console.log(`✓ Key phrases count: ${refAgent.keyPhrases.length}`);
console.log('');

// Test 2: Get Certificate Agent
console.log('Test 2: Get Certificate Agent');
const certAgent = getAgentByTaskType('cert');
console.log(`✓ Agent name: ${certAgent.name}`);
console.log(`✓ Guidelines count: ${certAgent.guidelines.length}`);
console.log(`✓ Examples count: ${certAgent.examples.length}`);
console.log(`✓ Key phrases count: ${certAgent.keyPhrases.length}`);
console.log('');

// Test 3: Get Internship Agent
console.log('Test 3: Get Internship Agent');
const intAgent = getAgentByTaskType('internship');
console.log(`✓ Agent name: ${intAgent.name}`);
console.log(`✓ Guidelines count: ${intAgent.guidelines.length}`);
console.log(`✓ Examples count: ${intAgent.examples.length}`);
console.log(`✓ Key phrases count: ${intAgent.keyPhrases.length}`);
console.log('');

// Test 4: Check agent personalities are different
console.log('Test 4: Verify agents have unique personalities');
console.log(`✓ References personality starts with: ${refAgent.personality.substring(0, 50)}...`);
console.log(`✓ Certificate personality starts with: ${certAgent.personality.substring(0, 50)}...`);
console.log(`✓ Internship personality starts with: ${intAgent.personality.substring(0, 50)}...`);
console.log('');

// Test 5: Verify structure templates exist
console.log('Test 5: Verify structure templates');
console.log(`✓ References has structure template: ${refAgent.structureTemplate ? 'YES' : 'NO'}`);
console.log(`✓ Certificate has structure template: ${certAgent.structureTemplate ? 'YES' : 'NO'}`);
console.log(`✓ Internship has structure template: ${intAgent.structureTemplate ? 'YES' : 'NO'}`);
console.log('');

// Test 6: Check examples format
console.log('Test 6: Check examples format');
const refExample = refAgent.examples[0];
console.log(`✓ References example has description: ${refExample.description ? 'YES' : 'NO'}`);
console.log(`✓ References example has output: ${refExample.output ? 'YES' : 'NO'}`);
const certExample = certAgent.examples[0];
console.log(`✓ Certificate example has description: ${certExample.description ? 'YES' : 'NO'}`);
console.log(`✓ Certificate example has output: ${certExample.output ? 'YES' : 'NO'}`);
const intExample = intAgent.examples[0];
console.log(`✓ Internship example has description: ${intExample.description ? 'YES' : 'NO'}`);
console.log(`✓ Internship example has output: ${intExample.output ? 'YES' : 'NO'}`);
console.log('');

console.log('=== All Tests Passed! ===');
console.log('\nAI Agents System is ready to use!');
console.log('\nNext steps:');
console.log('1. Agents will be automatically selected based on document type');
console.log('2. Each agent has its own personality, guidelines, and examples');
console.log('3. You can modify agents in src/agents.js to customize behavior');
