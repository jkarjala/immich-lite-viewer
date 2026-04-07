import { useEffect, useState } from 'react'

import './App.css'

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
  const [searchPath, setSearchPath] = useState('rantatalo')
  const [lastSearchPath, setLastSearchPath] = useState('rantatalo')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [searchFieldEdited, setSearchFieldEdited] = useState(false)

  const fetchAssets = async (path: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPath: path,
          page: 1,
          size: 1000
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`)
      }

      const data = (await response.json()) as SearchResponse      
      const assetsToSet = data.assets?.items || []
      console.log('Setting assets to:', assetsToSet)
      setAssets(assetsToSet)
      // Update the last search path after successful search
      setLastSearchPath(path)
      // Reset the edit flag after successful search
      setSearchFieldEdited(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial load with default search path
    fetchAssets(searchPath)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPath(e.target.value)
    setSearchFieldEdited(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only trigger search when user clicks search button
    fetchAssets(searchPath)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is open, handle navigation within it
      if (selectedAsset) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setSelectedAsset(null)
          setSelectedIndex(-1)
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIndex = selectedIndex < assets.length - 1 ? selectedIndex + 1 : 0
          setSelectedIndex(nextIndex)
          setSelectedAsset(assets[nextIndex])
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : assets.length - 1
          setSelectedIndex(prevIndex)
          setSelectedAsset(assets[prevIndex])
        } else if (e.key === 'Home') {
          e.preventDefault()
          setSelectedIndex(0)
          setSelectedAsset(assets[0])
        } else if (e.key === 'End') {
          e.preventDefault()
          setSelectedIndex(assets.length - 1)
          setSelectedAsset(assets[assets.length - 1])
        }
      } 
      // If no modal and assets exist, handle grid navigation
      else if (!selectedAsset && assets.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          const nextIndex = selectedIndex < assets.length - 1 ? selectedIndex + 1 : 0
          setSelectedIndex(nextIndex)
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : assets.length - 1
          setSelectedIndex(prevIndex)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          // If search field was edited, focus on it; otherwise open first asset
          if (searchFieldEdited) {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
            searchInput?.focus()
          } else {
            setSelectedAsset(assets[0])
            setSelectedIndex(0)
            setSearchFieldEdited(false)
          }
        } else if (e.key === 'Home') {
          e.preventDefault()
          setSelectedIndex(0)
        } else if (e.key === 'End') {
          e.preventDefault()
          setSelectedIndex(assets.length - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAsset, selectedIndex, assets, searchFieldEdited])

  return (
    <>
      <h1>Immich Lite Viewer</h1>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          value={searchPath}
          onChange={handleSearchChange}
          placeholder="Enter search path (e.g., rantatalo)"
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
      <div className="card">
        {loading ? (
          <p>Loading assets...</p>
        ) : error ? (
          <p className="error-message">Error: {error}</p>
        ) : assets.length > 0 ? (
          <div className="assets-section">
            <h2>Assets with "{lastSearchPath}" in path ({assets.length})</h2>
            <div className="assets-grid">
              {assets.map((asset, index) => (
                <div 
                  key={asset.id} 
                  className={`asset-item ${selectedIndex === index ? 'selected' : ''}`}
                  title={asset.originalFileName}
                  onClick={() => { setSelectedAsset(asset); setSelectedIndex(index); }}
                >
                  <img 
                    src={`/api/assets/${asset.id}/thumbnail`} 
                    alt={asset.originalFileName}
                    className="asset-thumbnail"
                  />
                  <div className="asset-filename">
                    {asset.originalFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="no-assets-text">No assets found with "{lastSearchPath}" in path</p>
        )}
      </div>

      {/* Fullscreen Modal - Original Image Only */}
      {selectedAsset && (
        <div 
          className="modal-backdrop"
          onClick={() => setSelectedAsset(null)}
        >
          <img 
            src={`/api/assets/${selectedAsset.id}/thumbnail?size=preview`} 
            alt={selectedAsset.originalFileName}
            className="modal-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default App
