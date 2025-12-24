# AtmosFault - Atmospheric Balloon Tracking System

> **WindBorne Systems Junior Web Developer Challenge Submission**

A real-time atmospheric balloon tracking application that combines WindBorne Systems balloon telemetry data with OpenWeatherMap atmospheric conditions to provide comprehensive balloon flight monitoring.

## 🎯 Challenge Requirements Met

### 1. WindBorne Systems API Integration ✅
- Fetches live balloon position data from `https://a.windbornesystems.com/treasure/00.json` through `23.json`
- Robustly extracts flight history from the past 24 hours
- Handles undocumented API format with proper error handling
- Stores balloon telemetry in PostgreSQL database for persistence

### 2. Second Public Dataset: OpenWeatherMap API ✅
- **Why Weather Data?** Atmospheric balloons operate in challenging weather conditions. By combining balloon telemetry with real-time weather data, we can:
  - Monitor atmospheric conditions at balloon altitude
  - Track temperature, pressure, humidity, and wind patterns
  - Provide insights into flight conditions
  - Enhance safety monitoring for balloon operations

- **Data Points Integrated:**
  - Temperature and "feels like" temperature
  - Atmospheric pressure (hPa)
  - Humidity percentage
  - Wind speed and direction
  - Cloud coverage
  - Weather descriptions with visual icons

### 3. Dynamic Updates ✅
- Automated data sync from WindBorne API (all 24 hours)
- Real-time weather data fetched on each tracking request
- 5-minute caching for weather API to optimize performance
- Smooth map animations showing balloon trajectory

### 4. Interactive Webpage ✅
- **Landing Page:** Modern 3D design with floating balloon animations
- **Map Visualization:** Satellite view with balloon markers and trajectory paths
- **Tracking Panel:** Comprehensive data display with microinteractions
- **Weather Integration:** Real-time atmospheric conditions at balloon location

## 🚀 Features

### Core Functionality
- 🎈 **Balloon Tracking:** Track any balloon using format `ATM-{hour}{index}`
- 🗺️ **Interactive Map:** Satellite view with smooth fly-to animations
- 📊 **Timeline Visualization:** Complete flight history with altitude-based color coding
- 🌤️ **Weather Overlay:** Real-time atmospheric conditions at balloon location
- 📍 **Location Details:** Precise lat/long coordinates and altitude tracking

### Data Insights
- **Altitude Analysis:** Color-coded markers showing flight phase
  - Red (<1 km): Pending/Ground level
  - Yellow (5-10 km): In Transit
  - Blue (>20 km): Delivered/Cruising altitude
- **Weather Correlation:** See how atmospheric conditions affect balloon flight
- **Trajectory Mapping:** Visual flight path with historical data points

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Maps:** Mapbox GL JS via react-map-gl
- **UI Components:** Radix UI (Shadcn)

### Backend
- **Runtime:** Node.js
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **APIs:**
  - WindBorne Systems (Balloon Data)
  - OpenWeatherMap (Weather Data)

### Data Management
- **Sync Strategy:** Batch inserts (1000 records/batch)
- **Deduplication:** Unique constraints on (hour, index)
- **Retention:** Configurable cleanup (default 7 days)
- **Caching:** Weather data cached for 5 minutes

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)
- OpenWeatherMap API key (free tier)
- Mapbox access token

### Environment Variables
Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# OpenWeatherMap
OPENWEATHER_API_KEY=your_key_here
```

### Installation

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Sync balloon data (fetches all 24 hours)
npm run sync all

# Start development server
npm run dev
```

### Available Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run sync all     # Sync all 24 hours of balloon data
npm run sync 10      # Sync specific hour (0-23)
npm run sync cleanup # Cleanup old data (>7 days)
npm run db:studio    # Open Drizzle Studio
```

## 🎨 API Endpoints

### GET `/api/track/[trackingNumber]`
Get complete tracking information for a balloon.

**Example Request:**
```bash
curl http://localhost:3000/api/track/ATM-10000029
```

**Response:**
```json
{
  "trackingNumber": "ATM-10000029",
  "status": "in_transit",
  "currentLocation": {
    "latitude": 21.7882,
    "longitude": 29.3026,
    "altitude": 16.16,
    "timestamp": "2025-12-20T06:58:08.229Z"
  },
  "weather": {
    "temperature": 18.5,
    "pressure": 1013,
    "humidity": 65,
    "windSpeed": 3.2,
    "windDirection": 180,
    "description": "clear sky",
    "icon": "01d",
    "clouds": 0
  },
  "timeline": [...],
  "estimatedDelivery": "2025-12-20T08:58:08.229Z",
  "metadata": {...}
}
```

### POST `/api/sync`
Trigger data synchronization.

```bash
# Sync all hours
curl -X POST http://localhost:3000/api/sync

# Sync specific hour
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"hour": 10}'
```

## 🔍 How It Works

### Tracking Number Format
`ATM-{hour}{index}` where:
- `hour`: 00-23 (which JSON file from WindBorne API)
- `index`: 000000-999999 (position in the array)

Example: `ATM-10000029` = Hour 10, Array Index 29

### Data Flow

1. **Data Ingestion:**
   ```
   WindBorne API → Batch Processing → PostgreSQL
   ```

2. **Tracking Request:**
   ```
   User Input → Parse Tracking # → Database Query → Weather API → Response
   ```

3. **Visualization:**
   ```
   API Data → React State → Mapbox Rendering → User Interface
   ```

### Weather Integration Logic

When a balloon is tracked:
1. Extract current latitude/longitude from database
2. Call OpenWeatherMap API with coordinates
3. Fetch atmospheric conditions at that location
4. Display alongside balloon telemetry
5. Cache for 5 minutes to reduce API calls

## 🌟 Key Insights & Problem Solving

### Problem: Understanding Atmospheric Flight Conditions
**Solution:** By combining balloon telemetry with weather data, we can:
- Identify optimal flight conditions
- Monitor environmental challenges
- Predict flight behavior based on weather patterns
- Enhance operational safety

### Problem: Large Dataset Management
**Solution:**
- Batch inserts for efficiency (1000 records/batch)
- Unique constraints prevent duplicates
- Automatic cleanup of old data
- Indexed queries for fast lookups

### Problem: Real-time Data Display
**Solution:**
- Smooth map animations with controlled viewport
- Staggered fade-in animations for UI elements
- Responsive microinteractions on hover
- Optimized re-renders with React state management

## 📊 Database Schema

```sql
CREATE TABLE balloons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  altitude DECIMAL NOT NULL,
  snapshot_hour INTEGER NOT NULL,
  array_index INTEGER NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(snapshot_hour, array_index)
);

CREATE INDEX idx_fetched_at ON balloons(fetched_at);
CREATE INDEX idx_snapshot_hour ON balloons(snapshot_hour);
```

## 🎯 Future Enhancements

- Historical weather correlation analysis
- Flight path prediction using ML
- Multi-balloon tracking on single map
- Real-time WebSocket updates
- Export flight data to CSV/JSON
- Alert system for extreme weather conditions
- Integration with additional atmospheric data sources

---

**Next Steps to Complete Challenge:**
1. Get OpenWeatherMap API key from https://openweathermap.org/api
2. Add API key to `.env` file
3. Deploy to Vercel/Netlify for public URL
4. Submit application with project URL
