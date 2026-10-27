#!/bin/bash
# Renders all plates and sprites for the forest mockups (headless Chromium + SwiftShader).
cd "$(dirname "$0")"
r(){ timeout 1200 node render.mjs "$@" 2>&1 | grep -i "done\|error"; }
B="${1:-all}"
if [ "$B" = all ] || [ "$B" = sprites ]; then
  for c in "pink 1,0.37,0.54" "blue 0.31,0.71,1" "yellow 1,0.82,0.25" "green 0.37,0.83,0.42" "purple 0.65,0.42,1" "peach 1,0.62,0.48"; do set -- $c; r 3 160 160 sprites/bubble-$1.png 0 $2 0 0; done
  r 3 160 160 sprites/bubble-clear.png 0 0.85,0.92,1 3 0
  r 2 240 240 sprites/mal-joy.png 0 1,0.5,0.68 1 1
  r 2 240 240 sprites/mal-happy.png 0 1,0.5,0.68 0 1
  r 2 160 160 sprites/peach-worried.png 0 1,0.62,0.48 0 0
  for c in "yellow 1,0.82,0.25" "green 0.37,0.83,0.42" "pink 1,0.37,0.54"; do set -- $c; r 2 120 120 sprites/q-$1.png 0 $2 1 0; done
  r 4 220 220 sprites/barrel.png 0 1,0.55,0.72
  r 5 240 240 sprites/base.png 0 1,0.55,0.72
fi
if [ "$B" = all ] || [ "$B" = plates ]; then
  r 0 780 1688 plates/title.png 0
  r 0 390 844 plates/title-depth.png 1
  r 1 780 1688 plates/play.png 0
  r 1 390 844 plates/play-depth.png 1
fi
