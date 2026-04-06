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
      <div>
        <h1>Immich Lite Viewer</h1>
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchPath}
            onChange={handleSearchChange}
            placeholder="Enter search path (e.g., rantatalo)"
            style={{ padding: '8px', marginRight: '8px', width: '300px' }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>Search</button>
        </form>
      </div>
      <div className="card">
        {loading ? (
          <p>Loading assets...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : assets.length > 0 ? (
          <div>
            <h2>Assets with "{lastSearchPath}" in path ({assets.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {assets.map((asset, index) => (
                <div 
                  key={asset.id} 
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    borderRadius: '8px', 
                    backgroundColor: selectedIndex === index ? '#4a90d9' : '#f0f0f0',
                    border: selectedIndex === index ? '3px solid #2196F3' : 'none',
                    outline: selectedIndex === index ? '3px solid #2196F3' : 'none',
                    outlineOffset: '4px'
                  }} 
                  title={asset.originalFileName}
                  onClick={() => { setSelectedAsset(asset); setSelectedIndex(index); }}
                >
                  <img 
                    src={`/api/assets/${asset.id}/thumbnail`} 
                    alt={asset.originalFileName}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ fontSize: '12px', padding: '4px', backgroundColor: selectedIndex === index ? '#2196F3' : 'rgba(0,0,0,0.7)', color: 'white', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.originalFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No assets found with "{lastSearchPath}" in path</p>
        )}
      </div>

      {/* Fullscreen Modal - Original Image Only */}
      {selectedAsset && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedAsset(null)}
        >
          <img 
            src={`/api/assets/${selectedAsset.id}/original`} 
            alt={selectedAsset.originalFileName}
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default App
