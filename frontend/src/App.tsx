import { useEffect, useRef, useState } from "react";
import { LegacyTree, FolderNode } from "./LegacyTree";
import { isKey } from "./keyboard";
import { useAssetPreloader, Asset } from "./preloader.ts";
import "./App.css";

interface SearchResponse {
  assets?: {
    items: Asset[];
    total: number;
    count: number;
  };
}

function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const slideshowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [folderLoading, setFolderLoading] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);
  const modalImageRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedTreeItemRef = useRef<HTMLElement | null>(null);
  const renderedImageSrc = useAssetPreloader(
    selectedAsset,
    selectedIndex,
    assets,
  );

  // Navigation functions
  const goToNextAsset = () => {
    const nextIndex =
      selectedIndex < assets.length - 1 ? selectedIndex + 1 : selectedIndex;
    setSelectedIndex(nextIndex);
    setSelectedAsset(assets[nextIndex]);
  };

  const goToPrevAsset = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setSelectedAsset(assets[selectedIndex - 1]);
    }
  };

  const goToFirstAsset = () => {
    setSelectedIndex(0);
    setSelectedAsset(assets[0]);
  };

  const startSlideshow = () => {
    if (assets.length === 0) return;
    setIsSlideshow(true);
  };

  const stopSlideshow = () => {
    setIsSlideshow(false);
    if (slideshowTimerRef.current) {
      clearTimeout(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (!isSlideshow || assets.length === 0) return;

    slideshowTimerRef.current = setTimeout(() => {
      if (selectedIndex < assets.length - 1) {
        goToNextAsset();
      } else {
        // Loop back to start
        setSelectedIndex(0);
        setSelectedAsset(assets[0]);
      }
    }, 5000);

    return () => {
      if (slideshowTimerRef.current) {
        clearTimeout(slideshowTimerRef.current);
      }
    };
  }, [isSlideshow, selectedIndex, assets]);

  const fetchAssets = async (path: string, page: number = 1) => {
    try {
      setError(null);
      setInfo(`Loading ${path}...`);
      const ASSETS_TO_FETCH = 1000;
      const allAssets: Asset[] = [];
      let pageToFetch = page;

      while (true) {
        const response = await fetch("/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalPath: path,
            page: pageToFetch,
            size: ASSETS_TO_FETCH,
          }),
        });
        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const data = (await response.json()) as SearchResponse;
        const assetsToSet = data.assets?.items || [];

        if (assetsToSet.length === 0) {
          break;
        }

        allAssets.push(...assetsToSet);

        if (assetsToSet.length < ASSETS_TO_FETCH) {
          break;
        }

        pageToFetch += 1;
      }

      setAssets(allAssets);
      if (allAssets.length > 0) {
        setSelectedIndex(0);
        setSelectedAsset(allAssets[0]);
      } else {
        setSelectedIndex(-1);
        setSelectedAsset(null);
      }
      setInfo(`Loaded ${allAssets.length} assets from ${path}`);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch assets");
    }
  };

  useEffect(() => {
    // Fetch folder tree on component mount
    const fetchFolderTree = async () => {
      try {
        setFolderLoading(true);
        setFolderError(null);

        const response = await fetch("/folders");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch folders: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as FolderNode[];
        console.log("Folder tree data received:", data);
        setFolderTree(data);
        setInfo("Folder tree loaded successfully");
      } catch (err) {
        console.error("Folder fetch error:", err);
        setFolderError(
          err instanceof Error ? err.message : "Failed to fetch folders",
        );
      } finally {
        setFolderLoading(false);
      }
    };

    fetchFolderTree();
  }, []);

  useEffect(() => {
    try {
      if (selectedAsset && modalImageRef.current) {
        const activeElement = document.activeElement as HTMLElement | null;
        lastFocusedTreeItemRef.current = activeElement;
        modalImageRef.current.focus();
      } else if (!selectedAsset && lastFocusedTreeItemRef.current) {
        lastFocusedTreeItemRef.current.focus();
        lastFocusedTreeItemRef.current = null;
      }
    } catch (err) {
      setError(
        "focus error: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  }, [selectedAsset]);

  return (
    <>
      <h1>Immich folder viewer</h1>
      {/* Folder Tree - Legacy Compatible */}
      <div className="folder-tree-container">
        {folderLoading && <p>Loading folders...</p>}
        {folderError && (
          <p className="error-message">
            Error loading folders: {folderError}. Check browser console for
            details.
          </p>
        )}
        {!folderError && folderTree.length > 0 && (
          <LegacyTree
            data={folderTree}
            onNodeClick={(path) => {
              setSelectedAsset(null);
              fetchAssets(path, 1);
            }}
          />
        )}
        {!folderLoading && !folderError && folderTree.length === 0 && (
          <p className="no-assets-text">No folders found</p>
        )}
      </div>

      <div className="status-messages">
        {info && <p className="info-message">{info}</p>}
        {error && <p className="error-message">Error: {error}</p>}
      </div>

      {/* Fullscreen Modal - Original Asset (Video or Image) */}
      {selectedAsset && (
        <div className="modal-backdrop" onClick={() => setSelectedAsset(null)}>
          {/* Filename overlay */}
          <div className="modal-filename">
            {selectedIndex + 1}/{assets.length} -{" "}
            {selectedAsset.originalFileName}
          </div>

          {/* Slideshow controls */}
          <div className="modal-controls">
            {!isSlideshow ? (
              <button
                className="modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  startSlideshow();
                }}
                title="Start slideshow"
              >
                ▶ Slideshow
              </button>
            ) : (
              <button
                className="modal-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  stopSlideshow();
                }}
                title="Stop slideshow"
              >
                ■ Stop
              </button>
            )}
          </div>

          <div
            className="modal-image-container"
            ref={modalImageRef}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.focus();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();

              if (selectedAsset) {
                if (isKey(e, "Escape") || isKey(e, "ArrowUp")) {
                  e.preventDefault();
                  setSelectedAsset(null);
                } else if (isKey(e, "ArrowRight")) {
                  e.preventDefault();
                  stopSlideshow();
                  goToNextAsset();
                } else if (isKey(e, "ArrowLeft")) {
                  e.preventDefault();
                  stopSlideshow();
                  goToPrevAsset();
                } else if (isKey(e, "Home")) {
                  e.preventDefault();
                  stopSlideshow();
                  goToFirstAsset();
                }
              }
            }}
          >
            {/* Video assets show the original video file */}
            {selectedAsset.type === "VIDEO" && (
              <video
                src={`/api/assets/${selectedAsset.id}/original`}
                controls
                autoPlay
                className="modal-image"
              />
            )}
            {/* Image assets show the preview */}
            {selectedAsset.type !== "VIDEO" && renderedImageSrc && (
              <img
                src={renderedImageSrc}
                alt={selectedAsset.originalFileName}
                className="modal-image"
              />
            )}
            {/* Left half click handler */}
            <div
              className="modal-click-zone modal-left-zone"
              onClick={(e) => {
                e.stopPropagation();
                stopSlideshow();
                goToPrevAsset();
              }}
            />
            {/* Right half click handler */}
            <div
              className="modal-click-zone modal-right-zone"
              onClick={(e) => {
                e.stopPropagation();
                stopSlideshow();
                goToNextAsset();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default App;
