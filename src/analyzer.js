const { git, DAYS } = require('./utils');

function getCommits() {
  const SEP = '<<SEP>>';
  const raw = git(`log --all --format='${SEP}%H|%an|%ae|%ad|%s' --date=iso`);
  if (!raw) return [];

  const commits = [];
  const entries = raw.split(SEP).filter(Boolean);

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const firstLine = lines[0];
    const parts = firstLine.split('|');
    if (parts.length < 5) continue;

    const [hash, author, email, date, ...msgParts] = parts;
    commits.push({
      hash: hash.trim(),
      author: author.trim(),
      email: email.trim(),
      date: new Date(date.trim()),
      message: msgParts.join('|').trim(),
    });
  }

  return commits.sort((a, b) => a.date - b.date);
}

function getFileStats() {
  const raw = git('log --all --numstat --format=""');
  if (!raw) return {};

  const files = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!match) continue;
    const added = match[1] === '-' ? 0 : parseInt(match[1]);
    const removed = match[2] === '-' ? 0 : parseInt(match[2]);
    const file = match[3];
    if (!files[file]) files[file] = { changes: 0, added: 0, removed: 0 };
    files[file].changes++;
    files[file].added += added;
    files[file].removed += removed;
  }
  return files;
}

function getContributorStats(commits) {
  const stats = {};
  for (const c of commits) {
    if (!stats[c.author]) {
      stats[c.author] = { commits: 0, email: c.email, firstCommit: c.date, lastCommit: c.date };
    }
    stats[c.author].commits++;
    if (c.date < stats[c.author].firstCommit) stats[c.author].firstCommit = c.date;
    if (c.date > stats[c.author].lastCommit) stats[c.author].lastCommit = c.date;
  }

  // Get lines added/removed per author
  const raw = git('log --all --numstat --format="<<AUTHOR>>%an"');
  if (raw) {
    let currentAuthor = '';
    for (const line of raw.split('\n')) {
      if (line.startsWith('<<AUTHOR>>')) {
        currentAuthor = line.replace('<<AUTHOR>>', '').trim();
        continue;
      }
      const match = line.match(/^(\d+|-)\t(\d+|-)\t/);
      if (match && currentAuthor && stats[currentAuthor]) {
        if (!stats[currentAuthor].added) stats[currentAuthor].added = 0;
        if (!stats[currentAuthor].removed) stats[currentAuthor].removed = 0;
        stats[currentAuthor].added += match[1] === '-' ? 0 : parseInt(match[1]);
        stats[currentAuthor].removed += match[2] === '-' ? 0 : parseInt(match[2]);
      }
    }
  }

  return Object.entries(stats)
    .map(([name, s]) => ({ name, ...s }))
    .sort((a, b) => b.commits - a.commits);
}

function getActivityMatrix(commits) {
  // 7 days x 24 hours
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of commits) {
    const day = c.date.getDay();
    const hour = c.date.getHours();
    matrix[day][hour]++;
  }
  return matrix;
}

function getDailyActivity(commits) {
  const daily = {};
  for (const c of commits) {
    const key = c.date.toISOString().split('T')[0];
    daily[key] = (daily[key] || 0) + 1;
  }
  return daily;
}

function getWeeklyActivity(commits) {
  const weekly = {};
  for (const c of commits) {
    const d = new Date(c.date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    const key = weekStart.toISOString().split('T')[0];
    weekly[key] = (weekly[key] || 0) + 1;
  }
  return weekly;
}

function getSummary(commits) {
  if (commits.length === 0) return null;

  const authors = new Set(commits.map(c => c.author));
  const first = commits[0].date;
  const last = commits[commits.length - 1].date;
  const daySpan = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));

  const daily = getDailyActivity(commits);
  const dayEntries = Object.entries(daily).sort((a, b) => b[1] - a[1]);
  const busiestDay = dayEntries[0];

  // Day of week stats
  const dayOfWeek = Array(7).fill(0);
  for (const c of commits) dayOfWeek[c.date.getDay()]++;
  const busiestDow = dayOfWeek.indexOf(Math.max(...dayOfWeek));

  // Current streak
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedDays = Object.keys(daily).sort().reverse();
  if (sortedDays.length > 0) {
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const key = checkDate.toISOString().split('T')[0];
      if (daily[key]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // today has no commits, check from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
  }

  return {
    totalCommits: commits.length,
    contributors: authors.size,
    firstCommit: first,
    lastCommit: last,
    daySpan,
    commitsPerDay: (commits.length / daySpan).toFixed(1),
    busiestDay: busiestDay ? { date: busiestDay[0], commits: busiestDay[1] } : null,
    busiestDayOfWeek: DAYS[busiestDow],
    streak,
  };
}

module.exports = { getCommits, getFileStats, getContributorStats, getActivityMatrix, getDailyActivity, getWeeklyActivity, getSummary };
