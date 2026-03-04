#!/usr/bin/env node

const { c, isGitRepo } = require('./utils');
const { getCommits, getFileStats, getContributorStats, getActivityMatrix, getDailyActivity, getWeeklyActivity, getSummary } = require('./analyzer');
const { printSummary, printContributors, printActivity, printVelocity, printFiles } = require('./formatter');

const BANNER = `
${c('magenta', '  ╔══════════════════════════════════════════╗')}
${c('magenta', '  ║')}  ${c('bold', 'Git Commit Analyzer')}  ${c('gray', 'v1.0.0')}             ${c('magenta', '║')}
${c('magenta', '  ║')}  ${c('gray', 'Analyze your git history like a pro')}     ${c('magenta', '║')}
${c('magenta', '  ╚══════════════════════════════════════════╝')}
`;

function showHelp() {
  console.log(BANNER);
  console.log(`  ${c('bold', 'Usage:')} git-commit-analyzer ${c('cyan', '<command>')} ${c('gray', '[options]')}`);
  console.log();
  console.log(`  ${c('bold', 'Commands:')}`);
  console.log(`    ${c('cyan', 'summary')}        Repository overview (default)`);
  console.log(`    ${c('cyan', 'contributors')}   Contributor rankings & stats`);
  console.log(`    ${c('cyan', 'activity')}       Commit heatmap by day & hour`);
  console.log(`    ${c('cyan', 'velocity')}       Code velocity over time`);
  console.log(`    ${c('cyan', 'files')}          Most frequently changed files`);
  console.log(`    ${c('cyan', 'all')}            Run all analyses`);
  console.log(`    ${c('cyan', 'help')}           Show this help`);
  console.log();
  console.log(`  ${c('bold', 'Examples:')}`);
  console.log(`    ${c('gray', '$')} node src/index.js`);
  console.log(`    ${c('gray', '$')} node src/index.js contributors`);
  console.log(`    ${c('gray', '$')} node src/index.js all`);
  console.log();
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'summary';

  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  if (!isGitRepo()) {
    console.error(c('red', '\n  Error: Not a git repository. Run this from inside a git repo.\n'));
    process.exit(1);
  }

  console.log(BANNER);

  const commits = getCommits();
  if (commits.length === 0) {
    console.log(c('yellow', '  No commits found in this repository.\n'));
    return;
  }

  switch (command) {
    case 'summary': {
      const summary = getSummary(commits);
      printSummary(summary);
      break;
    }
    case 'contributors': {
      const contributors = getContributorStats(commits);
      printContributors(contributors);
      break;
    }
    case 'activity': {
      const matrix = getActivityMatrix(commits);
      printActivity(matrix);
      break;
    }
    case 'velocity': {
      const daily = getDailyActivity(commits);
      const weekly = getWeeklyActivity(commits);
      printVelocity(daily, weekly);
      break;
    }
    case 'files': {
      const fileStats = getFileStats();
      printFiles(fileStats);
      break;
    }
    case 'all': {
      const summary = getSummary(commits);
      printSummary(summary);
      const contributors = getContributorStats(commits);
      printContributors(contributors);
      const matrix = getActivityMatrix(commits);
      printActivity(matrix);
      const daily = getDailyActivity(commits);
      const weekly = getWeeklyActivity(commits);
      printVelocity(daily, weekly);
      const fileStats = getFileStats();
      printFiles(fileStats);
      break;
    }
    default:
      console.log(c('red', `  Unknown command: ${command}`));
      console.log(c('gray', '  Run with "help" to see available commands.\n'));
  }
}

main();
