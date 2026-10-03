#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/data"
TARGET_FILE="${DATA_DIR}/malopolskie-latest.osm.pbf"
URL="https://download.geofabrik.de/europe/poland/malopolskie-latest.osm.pbf"

echo "=== Pobieranie wycinka OSM dla Małopolski (Geofabrik) ==="
mkdir -p "${DATA_DIR}"

if [ -f "${TARGET_FILE}" ]; then
  echo "Plik ${TARGET_FILE} już istnieje."
  read -r -p "Czy pobrać ponownie? [t/N]: " CONFIRM || CONFIRM="n"
  if [[ ! "${CONFIRM}" =~ ^[tTyY]$ ]]; then
    echo "Pobieranie anulowane."
    exit 0
  fi
fi

echo "Pobieranie ${URL} -> ${TARGET_FILE}..."
if command -v curl >/dev/null 2>&1; then
  curl -L -C - --progress-bar -o "${TARGET_FILE}.tmp" "${URL}"
  mv "${TARGET_FILE}.tmp" "${TARGET_FILE}"
elif command -v wget >/dev/null 2>&1; then
  wget -c -O "${TARGET_FILE}.tmp" "${URL}"
  mv "${TARGET_FILE}.tmp" "${TARGET_FILE}"
else
  echo "Błąd: Brak narzędzia curl lub wget!" >&2
  exit 1
fi

echo "Pomyślnie pobrano: ${TARGET_FILE} ($(du -h "${TARGET_FILE}" | cut -f1))"

if [ -d "${DATA_DIR}/graph-cache" ]; then
  echo "Wyczyszczenie starego graph-cache, aby GraphHopper przetworzył nowe dane..."
  rm -rf "${DATA_DIR}/graph-cache"
fi

echo "Gotowe! Uruchom: docker compose -f ${SCRIPT_DIR}/docker-compose.yml up -d"
