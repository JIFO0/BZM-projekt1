# Project Overview: Accessible Kraków Routing

## 1. Tech Stack & Architecture

We are building a decoupled stack using 100% open-source software, allowing us to maintain full control over the algorithms and avoid commercial API limits.

### Frontend: Mapy.cz / MapLibre

* **Role:** The visual map layer and user interface.
* **Why:** Mapy.cz offers a clean, familiar mapping aesthetic. We will use their SMap JS API (or alternatively, MapLibre GL JS) to render map tiles and draw the custom GeoJSON route lines returned by our backend.
* **UI Features:** Users can select their specific mobility profile (e.g., "Manual Wheelchair" vs "Double Trailer").

### Backend: GraphHopper (Self-Hosted)

* **Role:** The routing engine and algorithmic core.
* **Why:** GraphHopper is an enterprise-grade Java routing engine. Crucially, it features **Custom Models**, which allow us to inject raw JSON logic on the fly to multiply the "cost" of specific street obstacles without needing to restart the server.

### Data Source: OpenStreetMap (OSM)

* **Role:** The raw geographical database.
* **Why:** OSM is the richest source of micro-mapped accessibility data in the world. We extract localized `.pbf` files (just Małopolskie for the hackathon to ensure fast build times) via Geofabrik.

## 3. How the Architecture Flows

1. **Map Build (Backend Setup):** Our GraphHopper `config.yml` is explicitly instructed to "encode" specific OSM tags (`surface`, `smoothness`, `width`, `kerb`) into its graph.
2. **User Request (Frontend):** The user selects start/end points and a mobility profile (e.g., "Double Trailer").
3. **Dynamic Query (API):** The frontend sends a POST request to our GraphHopper server. The payload contains the custom JSON model (e.g., `if width < 1.0, multiply_by: 0.0`). We bypass the pre-calculated Contraction Hierarchies (CH) by using `ch.disable=true` so the weights can be calculated on the fly.
4. **Display:** GraphHopper returns the route geometry. The frontend draws the line and uses GraphHopper's Path Details output to place visual warning markers where the surface changes (e.g., highlighting cobblestone segments).

## 4. Licensing & Commercial Viability

This stack is completely safe for both open-source and commercial/for-profit development.

* **GraphHopper Engine (Apache 2.0):** Highly permissive. We can host it, modify it, and commercialize our app without paying licensing fees.
* **OpenStreetMap Data (ODbL):** Free to use at any scale. The only legal requirement is placing `© OpenStreetMap contributors` on our map. Providing a routing service is a "Produced Work," meaning we do not have to open-source our proprietary app code just because we use OSM data.

## 5. Implementation Strategy & Hackathon Traps

To ensure this works perfectly within a 24-hour hackathon, we are enforcing the following rules:

* **Small Map Area:** We will only download the Małopolskie `.pbf` map (~100 MB). This allows GraphHopper to build the graph in under a minute, saving hours of RAM processing time.
* **Forgiving Algorithms:** OSM data is sometimes incomplete. If our algorithm strictly blocks unmapped curbs, the engine will fail to find routes. We will only explicitly penalize mapped obstructions (e.g., "Penalize `highway=steps`"), treating `null` data as passable to guarantee the demo always finds a route.
* **Dynamic Flexibility:** We must ensure Contraction Hierarchies (CH) are disabled (`ch.disable=true`) on the API request; otherwise, GraphHopper will crash when we try to dynamically alter route weights with our JSON profiles.
* **CORS Prep:** We will set up a basic local proxy to prevent browser CORS errors when the frontend `localhost` tries to hit the GraphHopper `localhost` API.

## 6. Future-Proofing & Scalability

* **Enterprise Infrastructure:** We are using the same self-hosted GraphHopper engine used by global logistics fleets. Scaling just means adding standard load-balanced servers.
* **The Data Loop:** To address missing map data, the production app will feature a "Report Obstruction" button. User reports will be pushed back to OpenStreetMap, permanently fixing the route for the entire community and creating a continuous data improvement loop.
