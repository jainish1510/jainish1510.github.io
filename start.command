#!/usr/bin/env bash
# Double-click to preview the site on your computer (macOS), or run ./start.command on Linux.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org and run this again."
  read -r -p "Press Enter to close"; exit 1
fi
[ -d node_modules ] || { echo "Installing for the first time - this takes a few minutes..."; npm install || { read -r -p "Press Enter to close"; exit 1; }; }
( sleep 10; (open http://localhost:3000 || xdg-open http://localhost:3000) >/dev/null 2>&1 ) &
npm run dev
