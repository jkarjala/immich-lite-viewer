# @immich/sdk Package Analysis - Version 2.6.3

## Overview

The `@immich/sdk` is a TypeScript SDK for interfacing with the Immich API, which is a self-hosted photo and video management solution. This analysis focuses on understanding its structure, available methods for search functionality, client initialization, and error handling best practices.

## Installation

```bash
npm install @immich/sdk@2.6.3
```

## Client Initialization

The SDK must be initialized before making API calls:

```typescript
import { init } from "@immich/sdk";

init({
  baseUrl: "https://your-immich-server.com/api",
  apiKey: "your-api-key"
});
```

## Available Search Methods

Based on the Immich API documentation and structure, the following search-related methods are available:

### Asset Search Methods

1. **searchAssets**
   - Searches for assets (photos/videos) based on various criteria
   - Supports text search, date ranges, and metadata filtering
   - Returns paginated results

2. **searchPeople** 
   - Searches for people/faces in the media library
   - Useful for facial recognition-based searches

3. **searchAlbums**
   - Searches for albums by name or other criteria
   - Returns matching album information

4. **searchTags**
   - Searches for tags associated with assets
   - Supports tag-based filtering and search

### Search Parameters

The search methods typically accept parameters such as:
- `query`: Text search query
- `limit`: Maximum number of results to return
- `offset`: Pagination offset
- `searchOptions`: Additional search filters (date range, file type, etc.)
- `personIds`: Filter by specific person IDs
- `albumIds`: Filter by specific album IDs

## Usage Examples

### Basic Search Implementation

```typescript
import { init, searchAssets } from "@immich/sdk";

// Initialize the client
init({
  baseUrl: "https://your-immich-server.com/api",
  apiKey: process.env.IMMICH_API_KEY
});

// Perform a search
try {
  const results = await searchAssets({
    query: "vacation",
    limit: 50,
    offset: 0
  });
  
  console.log("Search results:", results);
} catch (error) {
  console.error("Search failed:", error);
}
```

### Advanced Search with Filters

```typescript
import { init, searchAssets } from "@immich/sdk";

init({
  baseUrl: "https://your-immich-server.com/api",
  apiKey: process.env.IMMICH_API_KEY
});

try {
  const results = await searchAssets({
    query: "beach",
    searchOptions: {
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      fileType: "image"
    },
    limit: 100
  });
  
  console.log("Filtered search results:", results);
} catch (error) {
  console.error("Advanced search failed:", error);
}
```

## Error Handling Best Practices

1. **API Errors**: The SDK throws specific errors for different API failure cases
2. **Network Errors**: Handle connection timeouts and network failures gracefully
3. **Authentication Errors**: Check for invalid API keys or permissions
4. **Rate Limiting**: Implement retry logic with exponential backoff for rate-limited requests

## Key Features of Search Functionality

1. **Metadata Search**: Search by EXIF data, file names, and other metadata
2. **Facial Recognition**: Search by detected faces/persons
3. **Tag-based Search**: Find assets by associated tags
4. **Album-based Search**: Search within specific albums
5. **Date Range Filtering**: Filter by capture dates or upload dates
6. **File Type Filtering**: Filter by image/video file types

## Implementation Recommendations

1. **Caching**: Implement caching for frequent search queries to reduce API load
2. **Pagination**: Always implement pagination for large result sets
3. **Debouncing**: For UI search inputs, implement debouncing to avoid excessive API calls
4. **Error Recovery**: Build retry mechanisms for transient failures
5. **User Feedback**: Provide loading states and error messages during searches

## Common Use Cases

1. **Photo Gallery Search**: Implement full-text search across all media
2. **Facial Recognition UI**: Allow users to find photos of specific people
3. **Album Navigation**: Enable searching within album contexts
4. **Tag-based Filtering**: Filter assets by tags or categories
5. **Date-based Queries**: Find media from specific time periods

## API Endpoints Reference

The SDK maps to the following Immich API endpoints:
- `GET /search/assets` - Search for assets
- `GET /search/people` - Search for people/faces  
- `GET /search/albums` - Search for albums
- `GET /search/tags` - Search for tags

## Version Compatibility

This analysis is based on version 2.6.3 of the @immich/sdk package, which corresponds to the Immich v2.6.3 release. The API structure should remain consistent across minor versions.

## Additional Notes

The SDK provides TypeScript types and interfaces for all API endpoints, making it easy to work with in TypeScript projects. It also supports custom headers and authentication methods for advanced use cases.