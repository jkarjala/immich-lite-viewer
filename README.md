# Immich Lite Viewer

A lightweight web viewer for browsing Immich photo library assets in a folder structure. Designed to work on low-resource browsers, including Chromium 38 (e.g., LG OLED B7 SmartTV).

## ⚠️ Disclaimer

**This is NOT an official Immich project.** This is a community-built tool that acts as a lightweight frontend client for interacting with Immich servers. It is not maintained or endorsed by the Immich team.

## Features

- **Asset Search** — Search Immich assets by path, filename, date, favorites, and other metadata filters
- **Folder Tree** — Browse assets through an interactive hierarchical folder structure
- **API Proxy** — Secure proxy to your Immich server with automatic API key injection
- **Legacy Browser Support** — Built with `@vitejs/plugin-legacy` for compatibility with older Chromium-based browsers
- **Virtualized Rendering** — Uses `@tanstack/react-virtual` for efficient rendering of large asset lists
- **Asset Preloading** — Preloads next/previous assets for smooth navigation
- **Keyboard Navigation** — Full keyboard support for browsing assets

## Project Structure

```
immich-lite-viewer/
├── backend/                    # Express.js proxy server
│   ├── src/
│   │   └── server.ts          # Main backend server with API proxy & search endpoints
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite web app
│   ├── src/
│   │   ├── App.tsx            # Main app component with asset gallery
│   │   ├── LegacyTree.tsx     # Virtualized folder tree component
│   │   ├── main.tsx           # React entry point
│   │   ├── preloader.ts       # Asset image preloader hook
│   │   ├── keyboard.ts        # Keyboard navigation utilities
│   │   ├── App.css            # Styles
│   │   └── index.css
│   ├── vite.config.ts         # Vite config with proxy setup
│   ├── package.json
│   └── tsconfig.json
├── Dockerfile                  # Multi-stage Docker build
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- An Immich server running (local or remote)
- Immich API key ([generate one from your Immich server](https://docs.immich.app/docs/install/manage-api-keys))

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

Or create a `.env` file in the `backend/` directory:

```env
IMMICH_URL=http://localhost:2283
IMMICH_API_KEY=your-api-key-here
PORT=4000
```

### Running in Development Mode

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

The backend runs on `http://localhost:4000` and the frontend on `http://localhost:5173`. The Vite dev server proxies `/search`, `/api/*`, and `/folders` routes to the backend.

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build

# Start backend (serves built frontend from ./public)
cd backend
npm start
```

### Docker Build

```bash
docker build -t immich-lite-viewer .
docker run -d \
  -p 4000:4000 \
  -e IMMICH_URL=http://your-immich-server:2283 \
  -e IMMICH_API_KEY=your-api-key-here \
  immich-lite-viewer
```

## API Endpoints

### `POST /search`

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
  "albums": {},
  "assets": {
    "items": [...],
    "total": 50,
    "count": 50,
    "facets": [],
    "nextPage": "2"
  }
}
```

### `GET /folders`

Retrieve folder structure for asset browsing.

**Query Parameters:**

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| `path`    | string | Filter folder structure by path |
| `depth`   | number | Maximum depth to traverse       |

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
        }
      ]
    }
  ],
  "total": 1,
  "count": 1
}
```

### `GET /folders?path=/2024&depth=2`

Filter by starting path and maximum traversal depth.

### `GET|POST|PUT|DELETE /api/*`

Pass-through proxy to Immich API. All requests are forwarded to your Immich server with automatic `X-Api-Key` authentication.

## Keyboard Shortcuts

| Key       | Action              |
| --------- | ------------------- |
| `←` / `H` | Previous asset      |
| `→` / `L` | Next asset          |
| `Home`    | First asset         |
| `End`     | Last asset          |
| `Escape`  | Close image preview |

## Architecture

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Browser     │────▶│  Backend      │────▶│  Immich API  │
│   (Frontend)  │◀────│  (Express)    │◀────│  (Immich)    │
└──────────────┘     └───────────────┘     └──────────────┘
                         │
                         ├── API Key injection
                         ├── CORS handling
                         └── Folder tree aggregation
```

- **Backend** — Express.js server that proxies requests to Immich API, injects API keys, handles CORS, and aggregates folder structures from asset paths
- **Frontend** — React app using Vite for fast development, with legacy browser support via `@vitejs/plugin-legacy`
- **Virtualization** — Large asset lists are rendered efficiently using `@tanstack/react-virtual`
- **Proxy** — Vite dev server proxies `/search`, `/api/*`, and `/folders` routes to the backend

## Tech Stack

| Layer    | Technologies                                       |
| -------- | -------------------------------------------------- |
| Backend  | Node.js, Express, TypeScript, `@immich/sdk`        |
| Frontend | React, Vite, TypeScript, `@tanstack/react-virtual` |
| Docker   | Multi-stage builds with Node 24 Alpine             |

## Related Links

- [Immich GitHub](https://github.com/immich-app/immich)
- [Immich Documentation](https://docs.immich.app/)
- [Immich API Docs](https://api.immich.app/)
- [Vite Documentation](https://vitejs.dev/)
- [TanStack Virtual](https://tanstack.com/virtual)

## License

This project is provided as-is for personal use and learning purposes.
