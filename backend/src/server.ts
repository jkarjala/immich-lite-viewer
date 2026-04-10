import express from "express";
import path from "path";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import { AssetOrder, getAssetsByOriginalPath, getUniqueOriginalPaths, init, searchAssets } from "@immich/sdk";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Config
const PORT = process.env.PORT || 4000;
const IMMICH_URL = process.env.IMMICH_URL || "http://localhost:2283";
const IMMICH_API_KEY = process.env.IMMICH_API_KEY || "";
const isDev = process.env.NODE_ENV == "development";

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

// Serve built frontend
const publicDir = isDev 
  ? path.join(__dirname, "../../frontend/dist")
  : path.join(__dirname, "../../public");
app.use(express.static(publicDir));
console.log("Serving frontend from:", publicDir);

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

// Helper function to find common prefix among folder paths
function findCommonPrefix(folderPaths: string[]): string {
  if (folderPaths.length === 0) return "";
  
  // Sort paths to get shortest first
  const sorted = [...folderPaths].sort((a, b) => a.length - b.length);
  let prefix = sorted[0];
  
  for (const path of sorted) {
    while (path.indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (prefix === "") return "";
    }
  }
  
  return prefix;
}

// Helper function to build React Arborist tree from folder paths
function buildFolderTree(folderPaths: string[]): any[] {
  const root: Map<string, any> = new Map();
  
  // Find and remove common prefix
  const commonPrefix = findCommonPrefix(folderPaths);
  console.log("Common prefix found:", commonPrefix);
  
  // Initialize root node
  root.set("/", {
    id: "root",
    name: "Root",
    path: "/",
    isFolder: true,
    children: [],
  });
  
  // Process each folder path
  for (const folderPath of folderPaths) {
    if (!folderPath || folderPath === "/") continue;
    
    // Strip common prefix
    let strippedPath = folderPath;
    if (commonPrefix && folderPath.startsWith(commonPrefix)) {
      strippedPath = folderPath.substring(commonPrefix.length);
    }
    
    const parts = strippedPath.split("/").filter((p) => p.length > 0);
    let currentPath = "";
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath + "/" + part;
      
      // Check if node already exists
      if (!root.has(currentPath)) {
        const parentNodePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
        const parentNode = root.get(parentNodePath) || root.get("/");
        
        const node = {
          id: currentPath,
          name: part,
          path: currentPath,
          isFolder: true,
          children: [],
        };
        
        root.set(currentPath, node);
        parentNode.children.push(node);
      }
    }
  }
  
  return root.get("/")?.children || [];
}

// Folders endpoint - retrieves folder paths and converts to React Arborist tree
app.get("/folders", async (req, res) => {
  try {
    console.log("Fetching unique folder paths from Immich using SDK");
    
    // Use Immich SDK to get unique folder paths
    const folderPaths = await getUniqueOriginalPaths();
    
    console.log(`Received ${folderPaths.length} unique folder paths`);
    
    // Build React Arborist compatible tree structure
    const treeData = buildFolderTree(folderPaths);
    
    res.status(200).json(treeData);
  } catch (err: any) {
    console.error("Folders endpoint error:", err);
    res.status(500).json({ error: "Folders endpoint failed", details: err.message });
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