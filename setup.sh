#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -f modules.config.json ]; then
  cp modules.config.json.example modules.config.json
fi
