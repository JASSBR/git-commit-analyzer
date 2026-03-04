#!/usr/bin/env node
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch {
    return '';
  }
}

function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function padRight(str, len) {
  const s = String(str);
  return s.length >= len ? s.slice(0, len) : s + ' '.repeat(len - s.length);
}

function padLeft(str, len) {
  const s = String(str);
  return s.length >= len ? s : ' '.repeat(len - s.length) + s;
}

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

function daysAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function formatDate(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

module.exports = { COLORS, c, git, isGitRepo, formatNumber, padRight, padLeft, truncate, daysAgo, formatDate, DAYS };
