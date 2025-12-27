/**
 * Test Excel integration with AI Agents system
 * Verifies that data from Excel can be read and processed
 */

import { getAllEmployees } from './src/excel-handler.js';
import { getTeamDescription, getAllTeamNames } from './src/team-descriptions.js';
import { getAgentByTaskType } from './src/agents.js';

console.log('=======================================================');
console.log('  EXCEL INTEGRATION TEST');
console.log('=======================================================\n');

async function testExcelIntegration() {
  console.log('Test 1: Reading employees from Excel\n');

  try {
    const employees = getAllEmployees();
    console.log(`✅ Successfully read ${employees.length} employees from Excel`);

    if (employees.length > 0) {
      const sample = employees[0];
      console.log('\nSample employee:');
      console.log(`- Name: ${sample.name} ${sample.surname}`);
      console.log(`- Team: ${sample.team}`);
      console.log(`- Role: ${sample.role || 'N/A'}`);
      console.log(`- Gender: ${sample.gender || 'N/A'}`);
      console.log(`- Status: ${sample.status || 'N/A'}`);
      console.log(`- Dates: ${sample.startDate} - ${sample.endDate}`);
      console.log(`- Tasks: ${sample.mainTasks ? sample.mainTasks.substring(0, 80) + '...' : 'N/A'}`);
    }

  } catch (error) {
    console.log(`❌ Failed to read Excel: ${error.message}`);
    return false;
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Test 2: Team descriptions integration\n');

  try {
    const teamNames = getAllTeamNames();
    console.log(`✅ Found ${teamNames.length} team descriptions`);
    console.log('\nAvailable teams:');
    teamNames.slice(0, 5).forEach(team => {
      console.log(`  - ${team}`);
    });
    if (teamNames.length > 5) {
      console.log(`  ... and ${teamNames.length - 5} more`);
    }

    // Test getting a specific team description
    const testTeam = 'Marketing Masters';
    const teamDesc = getTeamDescription(testTeam);
    if (teamDesc) {
      console.log(`\n✅ Team description found for "${testTeam}"`);
      console.log(`   Description: ${teamDesc.description.substring(0, 100)}...`);
      console.log(`   Main activities: ${teamDesc.mainActivities.length} items`);
    } else {
      console.log(`⚠️  No description found for "${testTeam}"`);
    }

  } catch (error) {
    console.log(`❌ Failed to load team descriptions: ${error.message}`);
    return false;
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Test 3: Agent selection for different tasks\n');

  try {
    const tasks = ['references', 'cert', 'internship'];
    tasks.forEach(taskType => {
      const agent = getAgentByTaskType(taskType);
      console.log(`✅ ${taskType.padEnd(12)} -> ${agent.name}`);
    });
  } catch (error) {
    console.log(`❌ Failed to get agents: ${error.message}`);
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('  INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ Excel reading: PASSED');
  console.log('✅ Team descriptions: PASSED');
  console.log('✅ Agent selection: PASSED');
  console.log('\n🎉 All integration tests passed!\n');

  return true;
}

// Run test
testExcelIntegration().catch(error => {
  console.error('\n❌ Integration test failed:', error);
  process.exit(1);
});
