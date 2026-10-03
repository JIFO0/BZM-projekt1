#!/bin/sh
set -e

if [ -f /data/malopolskie-latest.osm.pbf ]; then
  OSM_FILE="/data/malopolskie-latest.osm.pbf"
  echo "Using full Małopolskie PBF: $OSM_FILE"
elif [ -f /data/krakow-sample.osm ]; then
  OSM_FILE="/data/krakow-sample.osm"
  echo "Using local Kraków sample OSM: $OSM_FILE"
else
  echo "No map data found in /data. Downloading sample OSM for Kraków Old Town..."
  curl -s "https://api.openstreetmap.org/api/0.6/map?bbox=19.925,50.052,19.948,50.070" -o /data/krakow-sample.osm
  OSM_FILE="/data/krakow-sample.osm"
fi

exec /graphhopper/graphhopper.sh -c /config.yml -i "$OSM_FILE" -o /data/graph-cache
