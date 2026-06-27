#!/bin/bash
while true; do
  cd /home/z/my-project && bun --bun next dev -p 3000 -H 0.0.0.0
  sleep 2
done
