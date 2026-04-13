#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..." >> /home/z/my-project/server.log
  npx next dev -p 3000 >> /home/z/my-project/server.log 2>&1
  echo "[$(date)] Server exited, restarting in 3s..." >> /home/z/my-project/server.log
  sleep 3
done
