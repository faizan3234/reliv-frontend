#!/bin/bash
# Downloads MP3 audio files from Vercel to the Pi
# Run once: bash download-audio.sh

AUDIO_DIR="/home/reliv-17/audio"
BASE_URL="https://reliv-frontend-henna.vercel.app/audio"

mkdir -p "$AUDIO_DIR"

PAGES=(
  splash choose-language customer-details two-options
  body-composition health-checkup oxygen-pulse body-temperature
  eyesight report-1 report-2 report-3 report-4 report-5
  wellness-recommendations checkout payment order-success
  feedback idle-loop leaderboard
)

echo "Downloading MP3 files to $AUDIO_DIR ..."
for page in "${PAGES[@]}"; do
  echo "  Downloading ${page}.mp3 ..."
  curl -sL "${BASE_URL}/${page}.mp3" -o "${AUDIO_DIR}/${page}.mp3"
done

echo "Done! $(ls "$AUDIO_DIR"/*.mp3 2>/dev/null | wc -l) files downloaded."
