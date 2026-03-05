#!/usr/bin/env bash
# Start frontend: ensure Node and deps, then run Expo.
# Usage: ./start.sh   or   bash start.sh

set -e

echo "→ Checking Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo "  Node.js is not installed or not in PATH. Please install Node.js and run this script again."
  exit 1
fi
echo "  Node.js $(node -v)"

echo "→ Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "  node_modules not found. Running npm install..."
  npm install
else
  echo "  Dependencies present."
fi

echo "→ Starting Expo dev server..."
exec npx expo start
