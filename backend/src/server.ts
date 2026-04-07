import express from "express";
import path from "path";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import { AssetOrder, init, searchAssets } from "@immich/sdk";

const app = express();

// Config
const PORT = process.env.PORT || 4000;
const IMMICH_URL = process.env.IMMICH_URL || "http://localhost:2283";
const IMMICH_API_KEY = process.env.IMMICH_API_KEY || "";

// Initialize Immich SDK
init({
  baseUrl: `${IMMICH_URL}/api`,
  apiKey: IMMICH_API_KEY,
});

// Multer in-memory storage for proxying uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to make Immich API requests
async function immichRequest(
  path: string,
  method: string,
  body?: any,
  headers: Record<string, any> = {}
) {
  const targetUrl = IMMICH_URL + path;
  const defaultHeaders: Record<string, any> = {
    "X-Api-Key": IMMICH_API_KEY,
    ...headers,
  };

  console.log("Request to Immich:", method, targetUrl, body, defaultHeaders);
  const response = await fetch(targetUrl, {
    method,
    headers: defaultHeaders,
    body,
  });
  
  const contentType = response.headers.get("content-type") || "text/plain";
  
  // For binary responses (images, etc), return as buffer
  if (contentType.includes("image") || contentType.includes("video") || contentType.includes("audio")) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Response from Immich:", response.status, `${buffer.length} bytes (${contentType})`);
    return {
      status: response.status,
      contentType,
      buffer,
    };
  }
  
  // For text responses, return as text
  const resp_body = await response.text();
  console.log("Response from Immich:", response.status, resp_body.length);
  return {
    status: response.status,
    contentType,
    text: resp_body,
  };
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built frontend from ./public
const publicDir = path.join(__dirname, "../../frontend/dist");
app.use(express.static(publicDir));

// Search route for Immich asset metadata - using Immich SDK
app.post("/search", async (req, res) => {
  try {
    // Validate request body
    const { originalPath, page = 1, size = 1000 } = req.body;
    
    if (!originalPath) {
      return res.status(400).json({ error: "Missing required parameter: originalPath" });
    }
    
    console.log("Executing search with params:", { originalPath, page, size });
    
    // Convert pagination format: page/size → offset/limit for SDK
    const offset = (page - 1) * size;
    const limit = size;
    
    // Use Immich SDK to search assets by path (using MetadataSearchDto structure)
    const results = await searchAssets({
      metadataSearchDto: {
        originalPath,
        page,
        size,
        order: AssetOrder.Asc,
      },
    });
    
    // Return results in compatible format
    res.status(200).json(results);
  } catch (err: any) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// Proxy all /api/* requests to Immich
app.all("/api/*", upload.any(), async (req, res) => {
  try {
    let headers: Record<string, any> = {};
    let body: any = undefined;

    const files = req.files as Express.Multer.File[] | undefined;

    if (files && files.length > 0) {
      // Multipart/form-data request
      const form = new FormData();

      files.forEach((file) => {
        form.append(file.fieldname, file.buffer, file.originalname);
      });

      Object.entries(req.body).forEach(([key, value]) => {
        form.append(key, value as string);
      });

      body = form;
      headers = form.getHeaders(headers);
    } else if (req.method !== "GET" && req.method !== "HEAD") {
      // JSON body
      body = JSON.stringify(req.body);
      headers["Content-Type"] = "application/json";
    }

    console.log("req:", IMMICH_URL + req.path, body, headers);
    
    // Preserve query parameters from the incoming request
    const queryString = req.url.split('?')[1];
    const targetPath = queryString ? `${req.path}?${queryString}` : req.path;
    
    const result = await immichRequest(targetPath, req.method, body, headers);
    res.status(result.status).set("Content-Type", result.contentType);
    
    if (result.buffer) {
      res.send(result.buffer);
    } else {
      res.send(result.text);
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
});

// SPA fallback (for React Router etc.)
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`Proxying Immich at: ${IMMICH_URL}`);
});