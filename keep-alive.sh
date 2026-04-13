#!/bin/bash
# Keep-alive script for Next.js dev server
while true; do
  if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "[$(date)] Server not running, starting..." >> /home/z/my-project/dev.log
    cd /home/z/my-project && bun run dev >> /home/z/my-project/dev.log 2>&1
    echo "[$(date)] Server exited, restarting in 2s..." >> /home/z/my-project/dev.log
  fi
  sleep 3
done
