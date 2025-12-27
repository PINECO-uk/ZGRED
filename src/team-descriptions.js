/**
 * Team descriptions loader - loads team descriptions from JSON file
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from './config.js';

const TEAM_DESCRIPTIONS_FILE = join(config.dataDir, 'opisy-zespoly.json');

let teamDescriptions = null;

/**
 * Load team descriptions from JSON file
 * @returns {object} - Team descriptions
 */
function loadTeamDescriptions() {
  if (teamDescriptions) {
    return teamDescriptions;
  }

  if (!existsSync(TEAM_DESCRIPTIONS_FILE)) {
    console.log('[TEAM-DESC] WARNING: Team descriptions file not found:', TEAM_DESCRIPTIONS_FILE);
    return { teams: {} };
  }

  try {
    const data = readFileSync(TEAM_DESCRIPTIONS_FILE, 'utf-8');
    teamDescriptions = JSON.parse(data);
    console.log(`[TEAM-DESC] Loaded descriptions for ${Object.keys(teamDescriptions.teams).length} teams`);
    return teamDescriptions;
  } catch (error) {
    console.log('[TEAM-DESC] ERROR loading team descriptions:', error.message);
    return { teams: {} };
  }
}

/**
 * Get description for a specific team
 * @param {string} teamName - Team name
 * @returns {object|null} - Team description object or null if not found
 */
export function getTeamDescription(teamName) {
  const descriptions = loadTeamDescriptions();

  if (!teamName) {
    return null;
  }

  // Try exact match first
  if (descriptions.teams[teamName]) {
    return descriptions.teams[teamName];
  }

  // Try case-insensitive match
  const teamNameLower = teamName.toLowerCase();
  const matchingTeam = Object.keys(descriptions.teams).find(
    key => key.toLowerCase() === teamNameLower
  );

  if (matchingTeam) {
    return descriptions.teams[matchingTeam];
  }

  // Try partial match (contains)
  const partialMatch = Object.keys(descriptions.teams).find(
    key => key.toLowerCase().includes(teamNameLower) || teamNameLower.includes(key.toLowerCase())
  );

  if (partialMatch) {
    console.log(`[TEAM-DESC] Found partial match for "${teamName}": "${partialMatch}"`);
    return descriptions.teams[partialMatch];
  }

  console.log(`[TEAM-DESC] No description found for team: "${teamName}"`);
  return null;
}

/**
 * Get formatted team description text for LLM prompts
 * @param {string} teamName - Team name
 * @returns {string} - Formatted description text
 */
export function getTeamDescriptionText(teamName) {
  const teamDesc = getTeamDescription(teamName);

  if (!teamDesc) {
    return `Zespół: ${teamName} (brak szczegółowego opisu)`;
  }

  let text = `Zespół: ${teamName}\n`;
  text += `Opis: ${teamDesc.description}\n`;

  if (teamDesc.mainActivities && teamDesc.mainActivities.length > 0) {
    text += `Główne działania zespołu:\n`;
    teamDesc.mainActivities.forEach((activity, index) => {
      text += `${index + 1}. ${activity}\n`;
    });
  }

  return text;
}

/**
 * Get all available team names
 * @returns {string[]} - Array of team names
 */
export function getAllTeamNames() {
  const descriptions = loadTeamDescriptions();
  return Object.keys(descriptions.teams);
}

export default {
  getTeamDescription,
  getTeamDescriptionText,
  getAllTeamNames,
};
