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
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Only trigger search when user clicks search button
    fetchAssets(searchPath)
  }

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
              {assets.map((asset) => (
                <div key={asset.id} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#f0f0f0' }} title={asset.originalFileName}>
                  <img 
                    src={`/api/assets/${asset.id}/thumbnail`} 
                    alt={asset.originalFileName}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                    onClick={() => setSelectedAsset(asset)}
                  />
                  <div style={{ fontSize: '12px', padding: '4px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
