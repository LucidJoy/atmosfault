# AtmosFault - Complete System Architecture

**Project Goal:** A hilarious but educational delivery tracking website that blames package delays on WindBorne weather balloons.

---

## 1. SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ATMOSFAULT SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│  DHL API          │  WindBorne API     │  Mapbox API       │  OpenWeather API │
│  (Tracking)       │  (Balloons 00-23)  │  (Geocoding)      │  (Weather Data)  │
└────────┬──────────────────────┬────────────────────┬──────────────────────────┘
         │                      │                    │
         ▼                      ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Node.js/Next.js)                 │
├─────────────────────────────────────────────────────────────────────┤
│ • DHL Service (Cache-First)                                         │
│ • WindBorne Sync Service                                            │
│ • Blame Engine (Atmospheric Attribution)                            │
│ • Geocoding Service (Dynamic + Fallback)                            │
│ • Weather Service                                                   │
└────────┬───────────────────────────────────┬────────────────────────┘
         │ Reads/Writes                      │ Reads
         ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DATABASE (Neon PostgreSQL + Drizzle ORM)              │
├─────────────────────────────────────────────────────────────────────┤
│ • dhl_shipments (tracking cache, 5 min TTL)                        │
│ • balloon_snapshots (24-hour atmospheric data)                     │
└─────────────────────────────────────────────────────────────────────┘
         ▲
         │ Serves
┌────────┴──────────────────────────────────────────────────────────┐
│                       API ROUTES (Next.js)                        │
├────────────────────────────────────────────────────────────────────┤
│ • GET  /api/track/[trackingNumber]  → Tracking Data              │
│ • POST /api/sync                     → Sync Balloons              │
└────────┬──────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js + React)                     │
├────────────────────────────────────────────────────────────────────┤
│ • Page: Landing (/page.tsx)                                        │
│ • Page: Map (/map/page.tsx) ← Interactive tracking + blame UI     │
│ • Page: About (/about/page.tsx)                                    │
│ • State: AtmosContext (global tracking state)                      │
│ • Components: FloatingNav, FloatingDock, TrackDialog               │
└────────────────────────────────────────────────────────────────────┘
         ▲
         │
┌────────┴──────────────────────────────────────────────────────────┐
│                      USER BROWSER (Mapbox GL JS)                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW DIAGRAMS

### 2.1 Tracking Flow (Main User Journey)

```
User inputs tracking number (landing page)
         │
         ▼
Router: /map?tracking=XXX
         │
         ▼
AtmosContext.fetchTrackingData()
         │
         ▼
GET /api/track/[trackingNumber]
         │
         ├─────────────────────────────────────────────────┐
         │                                                 │
         ▼                                                 ▼
    1. DHL Service                              2. Geocoding Service
       ├─ Check cache (dhl_shipments)              ├─ Check in-memory cache
       ├─ If invalid: Call DHL API                ├─ If miss: Call Mapbox API
       └─ Transform + Save to cache               └─ Fallback to static mapping
         │
         ├─────────────────────────────────────────────────┤
         │                                                 │
         ▼                                                 ▼
    3. Build Timeline                          4. Blame Engine
       ├─ Map status codes                       ├─ Find nearby balloons
       ├─ Extract locations                        (spatial query, 1000km radius)
       ├─ Geocode cities                        ├─ Calculate distances
       └─ Create events                         ├─ Score severity (0-100)
                                                ├─ Map to threat levels
                                                ├─ Generate blame reasons
                                                ├─ Calculate doom level
                                                └─ Create alternate timeline
         │
         └────────────────────┬──────────────────┘
                              │
                              ▼
                    TrackingResponse {
                      trackingNumber,
                      status,
                      currentLocation (with lat/lon),
                      timeline [events],
                      blame: BlameChain {
                        culpritBalloons,
                        doomLevel,
                        overallThreat,
                        alternateTimeline
                      }
                    }
         │
         ▼
Return to Frontend
         │
         ▼
Mapbox renders:
  • Package at current location
  • Timeline markers along route
  • Culprit balloon markers (🎈)
  • Info panel with blame details
```

### 2.2 Sync Balloons Flow

```
User clicks "Sync Balloons" button
         │
         ▼
POST /api/sync { hour?: number }
         │
         ├─ If hour specified: Fetch single {HH}.json
         └─ If no hour: Fetch all 00.json - 23.json
         │
         ▼
WindBorne Service
         │
    For each hour:
         │
         ├─ Fetch from https://a.windbornesystems.com/treasure/{HH}.json
         │  Response: [[lat, lon, alt], [lat, lon, alt], ...]
         │
         ├─ Transform to BalloonSnapshot objects
         │
         ├─ Batch insert (1000 at a time)
         │  INSERT INTO balloon_snapshots (latitude, longitude, altitude, ...)
         │  ON CONFLICT (snapshotHour, arrayIndex)
         │  DO UPDATE SET ... (prevent duplicates)
         │
         └─ Store fetchedAt timestamp for cleanup
         │
         ▼
Response: {
  totalRecords: number,
  hoursProcessed: number,
  timestamp: ISO string
}
         │
         ▼
Frontend Toast: "Synced X balloon positions!"
```

### 2.3 Blame Engine Logic

```
Current Package Location: (lat, lon) from DHL
         │
         ▼
Query balloons within 1000km radius
    Using: SELECT * FROM balloon_snapshots
           WHERE latitude BETWEEN lat-latDelta AND lat+latDelta
           AND longitude BETWEEN lon-lonDelta AND lon+lonDelta
         │
         ▼
For each balloon:
         │
         ├─ Calculate distance using Haversine formula
         ├─ Get threat level based on altitude:
         │  ├─ PEACEFUL: < 5km
         │  ├─ TURBULENT: 5-10km
         │  ├─ CHAOTIC: 10-15km
         │  ├─ APOCALYPTIC: 15-20km
         │  └─ DOOMED: ≥ 20km
         │
         ├─ Get blame category:
         │  ├─ PRESSURE_WARFARE: < 3km
         │  ├─ TURBULENCE_NIGHTMARE: 3-8km
         │  ├─ JET_STREAM_CHAOS: 8-15km
         │  ├─ ALTITUDE_MADNESS: 15-20km
         │  └─ ATMOSPHERIC_HOSTAGE: ≥ 20km
         │
         ├─ Calculate severity (0-100):
         │  = (altitude/25 × 50) + (max(0, 1 - distance/1000) × 50)
         │
         ├─ Generate dramaticReason (comedic)
         │  e.g., "Jet stream winds are treating your package
         │         like a pinball at 12.5km"
         │
         └─ Generate scientificReason (real atmospheric science)
            e.g., "Jet stream activity at 12.5km altitude creates
                   wind shear conditions exceeding 100 knots..."
         │
         ▼
Calculate overall doomLevel (0-100):
    = avg severity of top 5 culprits
         │
         ▼
Map doomLevel to overallThreat:
    ├─ < 20: PEACEFUL
    ├─ < 40: TURBULENT
    ├─ < 60: CHAOTIC
    ├─ < 80: APOCALYPTIC
    └─ ≥ 80: DOOMED
         │
         ▼
Generate alternateTimeline (hypothetical scenario):
    Based on doomLevel, explain what would've happened
    without balloon data awareness
         │
         ▼
BlameChain {
  packageLocation,
  culpritBalloons: top 10 by severity,
  overallThreat,
  doomLevel,
  alternateTimeline
}
```

---

## 3. DATABASE SCHEMA

### Table: `balloon_snapshots`

```sql
CREATE TABLE balloon_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  altitude DECIMAL(10, 2) NOT NULL,  -- in km
  snapshotHour INTEGER NOT NULL CHECK (snapshotHour >= 0 AND snapshotHour <= 23),
  arrayIndex INTEGER NOT NULL,  -- position in API response array
  fetchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (snapshotHour, arrayIndex)
);

-- Indexes for queries
CREATE INDEX snapshot_hour_idx ON balloon_snapshots(snapshotHour);
CREATE INDEX fetched_at_idx ON balloon_snapshots(fetchedAt);
CREATE INDEX location_idx ON balloon_snapshots(latitude, longitude);
```

### Table: `dhl_shipments`

```sql
CREATE TABLE dhl_shipments (
  trackingNumber VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL,  -- complete DHL API response
  updatedAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for cache expiration queries
CREATE INDEX dhl_updated_at_idx ON dhl_shipments(updatedAt);
```

---

## 4. API ROUTES

### GET `/api/track/[trackingNumber]`

**Request:**
```
GET /api/track/1923014192
```

**Response (200 OK):**
```json
{
  "trackingNumber": "1923014192",
  "status": "in_transit",
  "currentLocation": {
    "city": "SOLANA BEACH - C - USA",
    "country": "US",
    "countryCode": "US",
    "timestamp": "2025-11-03T10:47:00-08:00",
    "latitude": 32.991875,
    "longitude": -117.271606
  },
  "origin": {
    "city": "Los Angeles",
    "country": "US"
  },
  "destination": {
    "city": "New York",
    "country": "US"
  },
  "timeline": [
    {
      "status": "in_transit",
      "timestamp": "2025-11-03T10:47:00-08:00",
      "location": { ... },
      "description": "Package in transit"
    }
  ],
  "estimatedDelivery": "2025-11-06T23:59:59Z",
  "metadata": {
    "service": "DHL Express",
    "productName": "International Express",
    "totalPieces": 1
  },
  "blame": {
    "packageLocation": {
      "city": "SOLANA BEACH - C - USA",
      "latitude": 32.991875,
      "longitude": -117.271606
    },
    "culpritBalloons": [
      {
        "balloonId": "ATM-101234567",
        "latitude": 33.5,
        "longitude": -117.8,
        "altitude": 12.5,
        "detectedAt": "2025-11-03T08:00:00Z",
        "threatLevel": "CHAOTIC",
        "category": "JET_STREAM_CHAOS",
        "dramaticReason": "Jet stream winds are treating your package like a pinball at 12.5km",
        "scientificReason": "Jet stream activity at 12.5km altitude creates wind shear...",
        "distanceFromRoute": 45.2,
        "severity": 72
      }
    ],
    "overallThreat": "CHAOTIC",
    "doomLevel": 66,
    "alternateTimeline": "Your package would've taken a scenic detour through 3 extra states..."
  }
}
```

**Error Responses:**
- `404 Not Found`: Tracking number not in DHL system
- `500 Internal Server Error`: Database or API failure

---

### POST `/api/sync`

**Request (Sync All Hours):**
```
POST /api/sync
Content-Type: application/json
```

**Request (Sync Specific Hour):**
```
POST /api/sync
Content-Type: application/json

{
  "hour": 12
}
```

**Response (200 OK):**
```json
{
  "totalRecords": 15432,
  "hoursProcessed": 24,
  "timestamp": "2025-11-04T15:30:00Z",
  "message": "Successfully synced balloon data"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid hour (not 0-23)
- `500 Internal Server Error`: Sync failure

---

## 5. TECHNOLOGY STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 | SSR, API routes, components |
| **Styling** | Tailwind CSS | Responsive design |
| **Map** | Mapbox GL JS + react-map-gl | Interactive map rendering |
| **UI Components** | shadcn/ui (60+ components) | Accessible UI elements |
| **State Management** | React Context API | Global tracking state |
| **Backend** | Node.js (Next.js Runtime) | API logic, services |
| **Database** | PostgreSQL (Neon) | Persistent storage |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **HTTP Client** | fetch API (native) | External API calls |
| **Notifications** | Sonner | Toast messages |
| **Animations** | Framer Motion | Smooth transitions |
| **Maps API** | Mapbox | Geocoding + Rendering |
| **External APIs** | DHL, WindBorne, OpenWeather | Data sources |

---

## 6. SERVICE LAYER ARCHITECTURE

### 6.1 DHL Service (`lib/services/dhl.ts`)

**Cache-First Strategy:**
```
1. Check if cached (updatedAt < 5 minutes ago)
   ├─ Yes → Return cached data
   └─ No → Continue
2. Call DHL API (timeout 10s)
   ├─ Success → Save to cache, return
   └─ Failure → Return null
```

**Key Functions:**
- `getShipmentTracking(trackingNumber)` - Main orchestrator
- `getCachedShipment(trackingNumber)` - Database lookup
- `fetchFromDHL(trackingNumber)` - HTTP call
- `saveToCache(trackingNumber, data)` - Upsert to database
- `cleanupOldCache(olderThanDays)` - Maintenance

---

### 6.2 WindBorne Service (`lib/services/windborne.ts`)

**Sync Strategy:**
```
For each hour (0-23):
  1. Fetch {HH}.json from WindBorne API
  2. Transform: [[lat, lon, alt], ...] → BalloonSnapshot[]
  3. Batch insert (1000 at a time) with conflict handling
  4. Track fetchedAt timestamp
```

**Key Functions:**
- `fetchAndStoreAllHours()` - Sync all 24 files
- `fetchAndStoreHour(hour)` - Sync single hour
- `batchInsert(balloons)` - Insert with onConflictDoUpdate
- `cleanupOldData(daysToKeep)` - Maintenance

---

### 6.3 Blame Engine (`lib/services/blame-engine.ts`)

**Atmospheric Attribution:**
```
Input: TrackingResponse (with coordinates)
Process:
  1. Find nearby balloons (1000km radius)
  2. Calculate distance (Haversine formula)
  3. Map altitude → threat level + category
  4. Score severity (0-100)
  5. Generate blame reasons (dramatic + scientific)
  6. Calculate overall doom level
  7. Create alternate timeline
Output: BlameChain
```

**Key Functions:**
- `blameTheBalloons(trackingData)` - Main function
- `findNearbyBalloons(lat, lon, radius)` - Spatial query
- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine
- `getThreatLevel(altitude)` - Altitude → Threat
- `getBlameCategory(altitude)` - Altitude → Category
- `calculateSeverity(altitude, distance)` - 0-100 score
- `getDramaticReason(category, altitude)` - Humorous text
- `getScientificReason(category, altitude)` - Real science
- `generateAlternateTimeline(doomLevel)` - Hypothetical

---

### 6.4 Geocoding Service (`lib/services/geocoding.ts`)

**Multi-Tier Fallback:**
```
Input: address (e.g., "EAST MIDLANDS - UK"), countryCode (optional)
Process:
  1. Check in-memory cache (30 min TTL)
     ├─ Hit → Return cached coordinates
     └─ Miss → Continue
  2. Try Mapbox API
     ├─ Success → Cache + return
     └─ Failure → Continue
  3. Try static fallback mapping
     ├─ Found → Cache + return
     └─ Not found → Continue
  4. Fuzzy match in fallback
     ├─ Match → Cache + return
     └─ No match → Return null
Output: CityCoordinates { latitude, longitude } | null
```

**Key Functions:**
- `getCityCoordinates(addressLocality, countryCode)` - Main function
- `fetchFromMapbox(cityName, countryCode)` - Mapbox API with country bias
- `extractCityAndCountry(address)` - Parse DHL format
- Static fallback for 50+ major cities

---

## 7. FRONTEND ARCHITECTURE

### 7.1 Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Landing page with hero, tracking form, sync button |
| `/map` | `app/map/page.tsx` | Interactive map with tracking visualization |
| `/about` | `app/about/page.tsx` | Project info and features |

### 7.2 State Management (AtmosContext)

```typescript
interface AtmosContextType {
  // Dialog state
  trackDialogOpen: boolean
  setTrackDialogOpen: (state: boolean) => void

  // Tracking state
  trackingNumber: string
  setTrackingNumber: (num: string) => void
  trackingData: TrackingResponse | null
  setTrackingData: (data: TrackingResponse | null) => void
  error: string | null
  setError: (err: string | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void

  // Map state
  mapRef: RefObject<MapRef | null>
  viewState: ViewState
  setViewState: (state: ViewState) => void

  // Actions
  fetchTrackingData: (tracking: string) => Promise<void>
  handleTrack: () => void
}
```

**Features:**
- Auto-fetch from URL searchParams (?tracking=XXX)
- Auto-fly map to package location
- Error handling with toast notifications

### 7.3 Key Components

```
app/
├── page.tsx
│   ├── Hero section (video text fills)
│   ├── DottedMap component
│   ├── FloatingDock
│   │   └── TrackDialog (modal)
│   └── Sync button
│
├── map/page.tsx
│   ├── Mapbox GL map
│   ├── Timeline markers
│   ├── Culprit balloon markers (🎈)
│   ├── Info panel
│   │   ├── Tracking info
│   │   ├── ATMOSPHERIC BLAME section
│   │   ├── Doom meter
│   │   ├── Culprit details
│   │   ├── Alternate timeline
│   │   └── Full timeline
│   └── Status legend
│
└── about/page.tsx
    ├── TextRevealCard
    ├── Feature cards
    └── FloatingDock
```

---

## 8. EXTERNAL API INTEGRATIONS

### DHL API
- **Endpoint:** `https://api-eu.dhl.com/track/shipments`
- **Auth:** DHL-API-Key header
- **Cache:** 5 minutes in database
- **Timeout:** 10 seconds

### WindBorne Systems
- **Endpoint:** `https://a.windbornesystems.com/treasure/{HH}.json` (00-23)
- **Format:** Array of [latitude, longitude, altitude]
- **Use:** Atmospheric balloon positions
- **Storage:** PostgreSQL balloon_snapshots

### Mapbox
- **APIs:** Tiles (map rendering), Geocoding v5
- **Rate Limit:** 600 requests/month (free tier)
- **Cache:** 30 minutes in-memory
- **Tokens:** Public for frontend, API key for server

### OpenWeatherMap
- **Endpoint:** `https://api.openweathermap.org/data/2.5/weather`
- **Rate Limit:** 60 calls/minute
- **Cache:** 5 minutes (Next.js ISR)
- **Data:** Temperature, humidity, wind, clouds

---

## 9. THREAT LEVELS & BLAME CATEGORIES

### Threat Levels (by Altitude)
```
PEACEFUL       ▁▂▃  < 5 km        Green   (#22c55e)
TURBULENT     ▃▄▅  5-10 km       Yellow  (#eab308)
CHAOTIC       ▅▆▇  10-15 km      Orange  (#f97316)
APOCALYPTIC   ▇█▓  15-20 km      Red     (#ef4444)
DOOMED        █▓░  > 20 km       DarkRed (#7c2d12)
```

### Blame Categories (by Altitude)
```
PRESSURE_WARFARE        < 3 km   – Pressure systems at war
TURBULENCE_NIGHTMARE    3-8 km   – Clear air turbulence
JET_STREAM_CHAOS        8-15 km  – Jet stream warfare
ALTITUDE_MADNESS        15-20 km – Chaotic altitude zone
ATMOSPHERIC_HOSTAGE     > 20 km  – Extreme conditions
```

---

## 10. PERFORMANCE CONSIDERATIONS

### Caching
- **DHL Cache:** 5-minute TTL in database (reduces external API calls)
- **Geocoding Cache:** 30-minute in-memory (fast repeated lookups)
- **Weather Cache:** 5-minute ISR (Next.js revalidate)
- **Balloon Sync:** Long-term storage (7-day cleanup optional)

### Database Optimization
- Indexes on frequently queried columns (snapshotHour, latitude, longitude, updatedAt)
- Batch inserts (1000 at a time) for WindBorne data
- Conflict handling (onConflictDoUpdate) for duplicate prevention

### Frontend Optimization
- Suspense boundary around map page
- Memoized components (DottedMap)
- React-map-gl with lazy loading
- Toast notifications for async operations

---

## 11. ERROR HANDLING & GRACEFUL DEGRADATION

```
DHL API down?
  → Use cached data if available
  → Show last known location
  → Continue without blame data

Mapbox API down?
  → Use static city coordinate mapping
  → Fallback for 50+ major cities
  → Return null for unknown cities

WindBorne API down?
  → Show error in UI
  → Continue tracking without blame
  → User can retry sync later

Blame Engine failure?
  → Non-critical error (caught in try-catch)
  → Return tracking without blame data
  → Continue user experience
```

---

## 12. COMPLETE REQUEST/RESPONSE CYCLE

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION (Browser)                                      │
├────────────────────────────────────────────────────────────────────┤
│ • Types tracking number in form                                     │
│ • Clicks "Track" button                                             │
│ • Router: window.location.href = "/map?tracking=1923014192"        │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 2. ROUTE LOAD (map/page.tsx)                                       │
├────────────────────────────────────────────────────────────────────┤
│ • AtmosProvider reads searchParams                                  │
│ • useEffect triggers fetchTrackingData("1923014192")              │
│ • Loading state set to true                                        │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 3. API REQUEST (Client → Server)                                   │
├────────────────────────────────────────────────────────────────────┤
│ fetch("/api/track/1923014192")                                     │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 4. ROUTE HANDLER (app/api/track/[trackingNumber]/route.ts)        │
├────────────────────────────────────────────────────────────────────┤
│ • Calls getDHLTrackingInfo(trackingNumber)                         │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 5. DHL SERVICE                                                      │
├────────────────────────────────────────────────────────────────────┤
│ • Check cache: SELECT * FROM dhl_shipments WHERE trackingNumber    │
│ • If valid (< 5 min old): RETURN cached data                       │
│ • Else: Call DHL API → Transform → SAVE to cache                   │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 6. GEOCODING SERVICE (Parallel)                                    │
├────────────────────────────────────────────────────────────────────┤
│ • For each location in timeline:                                   │
│   1. Check in-memory cache                                         │
│   2. Try Mapbox API (with country code)                            │
│   3. Fall back to static mapping                                   │
│ • Enrich locations with latitude/longitude                         │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 7. BLAME ENGINE                                                     │
├────────────────────────────────────────────────────────────────────┤
│ • Query: SELECT * FROM balloon_snapshots WHERE location NEAR       │
│ • For each balloon:                                                │
│   - Calculate distance (Haversine)                                 │
│   - Map altitude → threat/category                                 │
│   - Score severity (0-100)                                         │
│   - Generate blame reasons                                         │
│ • Calculate doom level & alternate timeline                        │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 8. RESPONSE SENT (Server → Client)                                │
├────────────────────────────────────────────────────────────────────┤
│ TrackingResponse with:                                             │
│  • trackingNumber, status, currentLocation, timeline               │
│  • blame: { culpritBalloons[], doomLevel, overallThreat, ... }    │
└────────────────────┬───────────────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────────────┐
│ 9. FRONTEND RENDER (Browser)                                       │
├────────────────────────────────────────────────────────────────────┤
│ • AtmosContext updates trackingData & loading = false              │
│ • map/page.tsx re-renders with:                                    │
│   - Package marker at currentLocation                              │
│   - Timeline markers along route                                   │
│   - Culprit balloon markers with hue rotation                      │
│   - Info panel with blame details                                  │
│   - Doom meter animation                                           │
│   - Alternate timeline expandable section                          │
│ • Mapbox GL renders tiles & layers                                 │
└────────────────────┬───────────────────────────────────────────────┘
                     │
└────────────────────▼───────────────────────────────────────────────┐
                 USER SEES TRACKING MAP                              │
               WITH ATMOSPHERIC BLAME DATA                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## 13. DEPLOYMENT & ENVIRONMENT

### Environment Variables
```
# Database
DATABASE_URL=postgresql://...

# APIs
DHL_API_KEY=...
MAPBOX_API_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=...
OPENWEATHER_API_KEY=...

# App Settings
NODE_ENV=production
```

### Hosting
- **Frontend/Backend:** Vercel (Next.js optimized)
- **Database:** Neon (PostgreSQL serverless)
- **Maps:** Mapbox (CDN + API)

---

## 14. KEY METRICS & LIMITS

| Component | Limit | Impact |
|-----------|-------|--------|
| DHL API calls | 10s timeout | Returns null if slow |
| Cache TTL (DHL) | 5 minutes | Reduces API calls |
| Mapbox API | 600 req/month | Falls back to static mapping |
| Geocoding cache | 30 minutes | Fast repeated lookups |
| Balloon query radius | 1000km | Reasonable culprit range |
| Timeline markers | Unlimited | Performance depends on zoom |
| Culprit balloons shown | Top 10 | UI readability |

---

## 15. FUTURE ENHANCEMENT OPPORTUNITIES

- [ ] Real-time WebSocket updates for package location
- [ ] Machine learning to predict optimal routing
- [ ] Custom blame categories based on weather patterns
- [ ] Historical weather data correlation
- [ ] User accounts with saved tracking history
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations
- [ ] Advanced analytics dashboard
- [ ] Multi-carrier support (UPS, FedEx, etc.)
- [ ] Animated blame explanations (video content)

---

**Architecture Last Updated:** November 2025
**Version:** 1.0 - Complete DHL + WindBorne Integration
