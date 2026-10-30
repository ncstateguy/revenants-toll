#!/bin/bash
# Rebuild index.html from the game source (the claude.ai artifact file) and add the Firebase layer.
# usage: ./build.sh path/to/ashen-halls.html
SRC=${1:?game source html}
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  sed -n '1,/<\/style>/p' "$SRC"; printf '</head>\n<body>\n'
  sed -n '/<\/style>/,$p' "$SRC" | tail -n +2
  printf '\n<script type="module" src="cloud.js"></script>\n</body>\n</html>\n'; } > index.html
