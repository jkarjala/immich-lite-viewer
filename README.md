# Immich Lite Viewer

A lightweight web viewer for browsing Immich photo library assets in a folder structure. Very light-weight to work on browsers like the Chromium 38 in LG OLED B7 SmartTV.

## ⚠️ Disclaimer

**This is NOT an official Immich project.** This is a community-built tool that acts as a lightweight frontend client for interacting with Immich servers. It is not maintained or endorsed by the Immich team.

## Project Structure

```
immich-lite-viewer/
├── backend/                    # Express.js proxy server
│   ├── src/
│   │   └── server.ts          # Main backend server with API proxy & search endpoints
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── frontend/                   # React + Vite web app
│   ├── src/
│   │   ├── App.tsx            # Main app component with asset gallery
│   │   ├── main.tsx           # React entry point
│   │   ├── App.css            # Styles
│   │   └── index.css
│   ├── vite.config.ts         # Vite config with proxy setup
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── Dockerfile                  # Docker build configuration
└── README.md
```

## Features

- **Asset Search** - Search Immich assets by path, filename, date, and other metadata filters
- **Folder Tree** - Browse assets through an interactive hierarchical folder structure
- **API Proxy** - Secure proxy to your Immich server with automatic API key injection
- **Dev Mode** - Run frontend and backend with live reload

## Getting Started

### Prerequisites

- Node.js 16+
- An Immich server running (local or remote)
- Immich API key

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Set environment variables for the backend:

```bash
export IMMICH_URL=http://localhost:2283        # Your Immich server URL
export IMMICH_API_KEY=your-api-key-here        # Your Immich API key
export PORT=4000                                # Backend port (optional, defaults to 4000)
```

### Running in Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The backend runs on `http://localhost:4000` and frontend on `http://localhost:5173`.

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Start backend (serves built frontend)
cd backend
npm start
```

## API Endpoints

### `/search` (POST)
Search for assets by metadata.

**Request:**
```json
{
  "originalPath": "rantatalo",
  "isFavorite": true,
  "page": 1,
  "size": 50
}
```

**Response:**
```json
{
  "albums": {...},
  "assets": {
    "items": [...],
    "total": 50,
    "count": 50,
    "facets": [],
    "nextPage": "2"
  }
}
```

### `/api/*` (ALL METHODS)
Pass-through proxy to Immich API. All requests are forwarded to your Immich server with automatic API key authentication.

### `/folders` (GET)
Retrieve folder structure for asset browsing.

**Request:**
```bash
GET /folders
```

**Response:**
```json
{
  "items": [
    {
      "name": "2024",
      "path": "/2024",
      "children": [
        {
          "name": "January",
          "path": "/2024/January",
          "children": []
        },
        {
          "name": "February",
          "path": "/2024/February",
          "children": []
        }
      ]
    },
    {
      "name": "2023",
      "path": "/2023",
      "children": [...]
    }
  ],
  "total": 2,
  "count": 2
}
```

**Query Parameters:**
- `path` (optional): Filter folder structure by starting path
- `depth` (optional): Maximum depth to traverse (default: unlimited)

**Example with query parameters:**
```bash
GET /folders?path=/2024&depth=2
```

## Architecture

- **Backend**: Express.js server that proxies requests to Immich API and adds CORS headers
- **Frontend**: React app using Vite for fast development and builds
- **Proxy**: Vite dev server proxies `/search`, `/api/*`, and `/folders` routes to backend

## Related Links

- [Immich GitHub](https://github.com/immich-app/immich)
- [Immich Documentation](https://docs.immich.app/)
- [Immich API Docs](https://api.immich.app/)

## License

This project is provided as-is for personal use and learning purposes.
