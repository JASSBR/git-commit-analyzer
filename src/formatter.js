const { c, formatNumber, padRight, padLeft, truncate, DAYS } = require('./utils');

function header(title) {
  const line = '─'.repeat(50);
  return `\n${c('cyan', `  ┌${line}┐`)}\n${c('cyan', '  │')} ${c('bold', padRight(title, 49))}${c('cyan', '│')}\n${c('cyan', `  └${line}┘`)}\n`;
}

function bar(value, max, width = 30) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  const empty = width - filled;
  return c('green', '█'.repeat(filled)) + c('gray', '░'.repeat(empty));
}

function heatBlock(value, max) {
  if (value === 0) return c('gray', '·');
  const ratio = value / max;
  if (ratio > 0.75) return c('green', '█');
  if (ratio > 0.5) return c('green', '▓');
  if (ratio > 0.25) return c('yellow', '▒');
  return c('gray', '░');
}

function printSummary(summary) {
  console.log(header('Repository Summary'));

  const rows = [
    ['Total Commits', c('bold', formatNumber(summary.totalCommits))],
    ['Contributors', c('bold', String(summary.contributors))],
    ['First Commit', c('yellow', summary.firstCommit.toISOString().split('T')[0])],
    ['Last Commit', c('yellow', summary.lastCommit.toISOString().split('T')[0])],
    ['Time Span', c('bold', `${summary.daySpan} days`)],
    ['Commits/Day', c('cyan', summary.commitsPerDay)],
    ['Busiest Day', summary.busiestDay ? c('green', `${summary.busiestDay.date} (${summary.busiestDay.commits} commits)`) : '-'],
    ['Most Active', c('magenta', summary.busiestDayOfWeek)],
    ['Current Streak', c('green', `${summary.streak} day(s)`)],
  ];

  for (const [label, value] of rows) {
    console.log(`  ${c('gray', padRight(label, 18))} ${value}`);
  }
  console.log();
}

function printContributors(contributors) {
  console.log(header('Contributors'));

  if (contributors.length === 0) {
    console.log('  No contributors found.\n');
    return;
  }

  const max = contributors[0].commits;

  console.log(`  ${c('gray', padRight('#', 4))}${c('gray', padRight('Author', 25))}${c('gray', padRight('Commits', 10))}${c('gray', padRight('Added', 12))}${c('gray', padRight('Removed', 12))}${c('gray', 'Graph')}`);
  console.log(`  ${c('gray', '─'.repeat(90))}`);

  contributors.forEach((contrib, i) => {
    const rank = padRight(String(i + 1), 4);
    const name = padRight(truncate(contrib.name, 24), 25);
    const commits = padRight(formatNumber(contrib.commits), 10);
    const added = padRight(c('green', `+${formatNumber(contrib.added || 0)}`), 21);
    const removed = padRight(c('red', `-${formatNumber(contrib.removed || 0)}`), 21);
    const graph = bar(contrib.commits, max, 20);
    console.log(`  ${rank}${name}${commits}${added}${removed}${graph}`);
  });
  console.log();
}

function printActivity(matrix) {
  console.log(header('Activity Heatmap (Day × Hour)'));

  let max = 0;
  for (const row of matrix) for (const v of row) if (v > max) max = v;

  // Hour labels
  const hourLabels = [];
  for (let h = 0; h < 24; h += 3) hourLabels.push(padLeft(String(h), 2));
  console.log(`  ${padRight('', 6)} ${hourLabels.join('  ')}`);

  for (let d = 0; d < 7; d++) {
    let row = `  ${c('cyan', padRight(DAYS[d], 6))} `;
    for (let h = 0; h < 24; h++) {
      row += heatBlock(matrix[d][h], max) + ' ';
    }
    // day total
    const total = matrix[d].reduce((a, b) => a + b, 0);
    row += c('gray', ` ${total}`);
    console.log(row);
  }

  console.log();
  console.log(`  ${c('gray', '·')} none  ${c('gray', '░')} low  ${c('yellow', '▒')} med  ${c('green', '▓')} high  ${c('green', '█')} peak`);
  console.log();
}

function printVelocity(daily, weekly) {
  console.log(header('Code Velocity'));

  const dailyEntries = Object.entries(daily).sort((a, b) => a[0].localeCompare(b[0]));
  const weeklyEntries = Object.entries(weekly).sort((a, b) => a[0].localeCompare(b[0]));

  if (weeklyEntries.length === 0) {
    console.log('  No data available.\n');
    return;
  }

  // Show last 12 weeks
  const recent = weeklyEntries.slice(-12);
  const maxWeekly = Math.max(...recent.map(e => e[1]));

  console.log(`  ${c('bold', 'Weekly commits (last 12 weeks):')}\n`);
  for (const [week, count] of recent) {
    const label = padRight(week, 12);
    const countStr = padLeft(String(count), 4);
    console.log(`  ${c('gray', label)} ${countStr} ${bar(count, maxWeekly, 35)}`);
  }

  // Stats
  const allDaily = dailyEntries.map(e => e[1]);
  const avg = (allDaily.reduce((a, b) => a + b, 0) / Math.max(1, allDaily.length)).toFixed(1);
  const maxDay = Math.max(...allDaily);
  const totalDays = dailyEntries.length;
  const totalWeeks = weeklyEntries.length;

  console.log();
  console.log(`  ${c('gray', 'Active days:    ')} ${c('bold', String(totalDays))}`);
  console.log(`  ${c('gray', 'Active weeks:   ')} ${c('bold', String(totalWeeks))}`);
  console.log(`  ${c('gray', 'Avg/active day: ')} ${c('cyan', avg)}`);
  console.log(`  ${c('gray', 'Peak day:       ')} ${c('green', String(maxDay))} commits`);
  console.log();
}

function printFiles(fileStats, limit = 15) {
  console.log(header(`Most Changed Files (Top ${limit})`));

  const sorted = Object.entries(fileStats)
    .map(([file, stats]) => ({ file, ...stats }))
    .sort((a, b) => b.changes - a.changes)
    .slice(0, limit);

  if (sorted.length === 0) {
    console.log('  No file stats available.\n');
    return;
  }

  const max = sorted[0].changes;

  console.log(`  ${c('gray', padRight('#', 4))}${c('gray', padRight('File', 45))}${c('gray', padRight('Changes', 10))}${c('gray', padRight('+/-', 18))}${c('gray', 'Graph')}`);
  console.log(`  ${c('gray', '─'.repeat(95))}`);

  sorted.forEach((f, i) => {
    const rank = padRight(String(i + 1), 4);
    const name = padRight(truncate(f.file, 44), 45);
    const changes = padRight(String(f.changes), 10);
    const diff = padRight(`${c('green', `+${f.added}`)} ${c('red', `-${f.removed}`)}`, 27);
    const graph = bar(f.changes, max, 15);
    console.log(`  ${rank}${name}${changes}${diff}${graph}`);
  });
  console.log();
}

module.exports = { printSummary, printContributors, printActivity, printVelocity, printFiles, header };
