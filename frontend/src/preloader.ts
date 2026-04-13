import { useEffect, useRef } from "react";

export interface Asset {
  id: string;
  originalFileName: string;
  originalPath: string;
  fileSize?: number;
  type?: string;
}

const getPreviewUrl = (assetId: string) =>
  `/api/assets/${assetId}/thumbnail?size=preview`;

export function useAssetPreloader(
  selectedAsset: Asset | null,
  selectedIndex: number,
  assets: Asset[],
) {
  const preloadedImageRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let isActive = true;

    const cleanupStalePreloads = () => {
      const currentId = selectedAsset?.id;
      const nextId =
        selectedIndex >= 0 && selectedIndex + 1 < assets.length
          ? assets[selectedIndex + 1].id
          : undefined;

      preloadedImageRef.current.forEach((url, id) => {
        if (id !== currentId && id !== nextId) {
          URL.revokeObjectURL(url);
          preloadedImageRef.current.delete(id);
        }
      });
    };

    const preloadNextImage = async () => {
      cleanupStalePreloads();

      if (selectedIndex < 0 || selectedIndex + 1 >= assets.length) {
        return;
      }

      const nextAsset = assets[selectedIndex + 1];
      if (nextAsset.type === "VIDEO") {
        return;
      }

      if (preloadedImageRef.current.has(nextAsset.id)) {
        return;
      }

      const preloadUrl = getPreviewUrl(nextAsset.id);

      try {
        const response = await fetch(preloadUrl);
        if (!isActive || !response.ok) {
          return;
        }

        const blob = await response.blob();
        if (!isActive) {
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        preloadedImageRef.current.set(nextAsset.id, objectUrl);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("Preload error:", err);
      }
    };

    preloadNextImage();

    return () => {
      isActive = false;
    };
  }, [selectedAsset, selectedIndex, assets]);

  useEffect(() => {
    return () => {
      preloadedImageRef.current.forEach((url) => URL.revokeObjectURL(url));
      preloadedImageRef.current.clear();
    };
  }, []);

  if (!selectedAsset || selectedAsset.type === "VIDEO") {
    return undefined;
  }

  return (
    preloadedImageRef.current.get(selectedAsset.id) ||
    getPreviewUrl(selectedAsset.id)
  );
}
