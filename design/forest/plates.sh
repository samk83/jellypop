#!/bin/bash
# Game background plates: 5 world play plates (360x620 @2x) + title plate without characters (390x844 @2x).
cd "$(dirname "$0")"
r(){ timeout 1800 node render.mjs "$@" 2>&1 | grep -i "done\|error"; }
mkdir -p plates
for w in 0 1 2 3 4; do
  WORLD=$w r 1 720 1240 plates/w$((w+1)).png 0
  WORLD=$w r 1 360 620 plates/w$((w+1))-depth.png 1
done
NOCHAR=1 r 0 780 1688 plates/title-bg.png 0
NOCHAR=1 r 0 390 844 plates/title-bg-depth.png 1
