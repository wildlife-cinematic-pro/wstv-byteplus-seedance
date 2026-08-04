#!/bin/bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
exec bun --bun next dev -p 3000 -H 127.0.0.1
