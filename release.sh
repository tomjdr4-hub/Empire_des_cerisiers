#!/usr/bin/env bash
# Publie une nouvelle version du système sur GitHub (releases.latest sert de manifeste Foundry).
# Usage : ./release.sh 0.2.0 "Description des changements"
set -euo pipefail

VERSION="${1:?Usage: ./release.sh <version> <message>}"
MESSAGE="${2:?Usage: ./release.sh <version> <message>}"
REPO="tomjdr4-hub/Empire_des_cerisiers"
SYS_DIR="foundry-system"

node -e "
const fs = require('fs');
const p = '${SYS_DIR}/system.json';
const j = JSON.parse(fs.readFileSync(p, 'utf-8'));
j.version = '${VERSION}';
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
"

(cd "$SYS_DIR" && npm run build:packs)

git add "$SYS_DIR"
git commit -m "Version ${VERSION} : ${MESSAGE}"
git tag -a "v${VERSION}" -m "${MESSAGE}"
git push origin HEAD
git push origin "v${VERSION}"

ZIP_PATH="$(powershell.exe -NoProfile -File package-release.ps1 | tr -d '\r')"

gh release create "v${VERSION}" \
  "${ZIP_PATH}#system.zip" \
  "${SYS_DIR}/system.json#system.json" \
  --repo "$REPO" \
  --title "v${VERSION}" \
  --notes "${MESSAGE}"

rm -f "$ZIP_PATH"
echo "Release v${VERSION} publiée : https://github.com/${REPO}/releases/tag/v${VERSION}"
