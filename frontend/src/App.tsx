import { useEffect, useState } from 'react'
import { LegacyTree, FolderNode } from './LegacyTree'
import './App.css'

// Helper function to check key with legacy browser support
const isKey = (e: KeyboardEvent | React.KeyboardEvent, keyName: string, keyCode: number): boolean => {
  // Modern browsers use e.key
  if (e.key === keyName) return true
  // Legacy browsers use e.keyCode
  if ((e as any).keyCode === keyCode) return true
  return false
}

// Key code mappings for legacy browsers
const KEYCODES = {
  ENTER: 13,
  ESCAPE: 27,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,
  HOME: 36,
  END: 35,
}

interface Asset {
  id: string
  originalFileName: string
  originalPath: string
  fileSize?: number
  type?: string
}

interface SearchResponse {
  assets?: {
    items: Asset[]
    total: number
    count: number
  }
}


function App() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [searchPath, setSearchPath] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [folderLoading, setFolderLoading] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  
  // Navigation functions
  const goToNextAsset = () => {
    if (selectedIndex === assets.length - 1 && hasMore) {
      fetchAssets(searchPath, currentPage + 1)
    } else {
      const nextIndex = selectedIndex < assets.length - 1 ? selectedIndex + 1 : selectedIndex
      setSelectedIndex(nextIndex)
      setSelectedAsset(assets[nextIndex])
    }
  }

  const goToPrevAsset = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
      setSelectedAsset(assets[selectedIndex - 1])
    }
  }

  const goToFirstAsset = () => {
    setSelectedIndex(0)
    setSelectedAsset(assets[0])
  }

  const fetchAssets = async (path: string, page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const ASSETS_TO_FETCH = 10;
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPath: path,
          page: page,
          size: ASSETS_TO_FETCH,
        }),
      })
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`)
      }
      const data = (await response.json()) as SearchResponse      
      const assetsToSet = data.assets?.items || []
      
      setHasMore(assetsToSet.length === ASSETS_TO_FETCH)
      setAssets(prev => {
        const newAssets = page === 1 ? assetsToSet : [...prev, ...assetsToSet]
        if (page > 1 && prev.length > 0 && assetsToSet.length > 0) {
          setSelectedIndex(prev.length)
          setSelectedAsset(assetsToSet[0])
        } else {
          setSelectedIndex(0)
          setSelectedAsset(newAssets[0]) // Use newAssets instead of old assets array
        }
        setInfo(`${newAssets.length} assets after page ${page} fetch`)
        return newAssets
      })
      setCurrentPage(page)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch folder tree on component mount
    const fetchFolderTree = async () => {
      try {
        setFolderLoading(true)
        setFolderError(null)

        const response = await fetch('/folders')
        if (!response.ok) {
          throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json() as FolderNode[]
        console.log('Folder tree data received:', data)
        setFolderTree(data)
        setInfo("Folder tree loaded successfully")
      } catch (err) {
        console.error('Folder fetch error:', err)
        setFolderError(err instanceof Error ? err.message : 'Failed to fetch folders')
      } finally {
        setFolderLoading(false)
      }
    }
    
    fetchFolderTree()
  }, [])

 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when focus is inside the search form
      if (!selectedAsset && e.target instanceof HTMLElement) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return
        }
      }

      // If modal is open, handle navigation within it
      if (selectedAsset) {
        if (isKey(e, 'Escape', KEYCODES.ESCAPE) || isKey(e, 'ArrowUp', KEYCODES.ARROW_UP)) {
          e.preventDefault()
          setSelectedAsset(null)
        } else if (isKey(e, 'ArrowRight', KEYCODES.ARROW_RIGHT)) {
          e.preventDefault()
          goToNextAsset()
        } else if (isKey(e, 'ArrowLeft', KEYCODES.ARROW_LEFT)) {
          e.preventDefault()
          goToPrevAsset()
        } else if (isKey(e, 'Home', KEYCODES.HOME)) {
          e.preventDefault()
          goToFirstAsset()
        }
      } 
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAsset, selectedIndex, assets])

  return (
    <>
      <h1>Immich folder viewer</h1>
      {/* Folder Tree - Legacy Compatible */}
      <div className="folder-tree-container">
        {folderLoading && <p>Loading folders...</p>}
        {folderError && <p className="error-message">Error loading folders: {folderError}. Check browser console for details.</p>}
        {!folderError && folderTree.length > 0 && (
          <LegacyTree 
            data={folderTree}
            onNodeClick={(path) => {
              setSelectedAsset(null);
              setSearchPath(path);
              fetchAssets(path, 1);
            }}
          />
        )}
        {!folderLoading && !folderError && folderTree.length === 0 && (
          <p className="no-assets-text">No folders found</p>
        )}
      </div>

      <div className="status-messages">
        {loading && <p>Loading assets...</p>}
        {info && <p className="info-message">Info: {info}</p>}
        {error && <p className="error-message">Error: {error}</p>}
      </div>

      {/* Fullscreen Modal - Original Image Only */}
      {selectedAsset && (
        <div 
          className="modal-backdrop"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="modal-image-container"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={`/api/assets/${selectedAsset.id}/thumbnail?size=preview`} 
              alt={selectedAsset.originalFileName}
              className="modal-image"
            />
            {/* Left half click handler */}
            <div 
              className="modal-click-zone modal-left-zone"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevAsset()
              }}
            />
            {/* Right half click handler */}
            <div 
              className="modal-click-zone modal-right-zone"
              onClick={(e) => {
                e.stopPropagation()
                goToNextAsset()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default App
