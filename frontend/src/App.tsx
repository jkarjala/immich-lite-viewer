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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalPath: 'rantatalo',
            page: 1,
            size: 50,
          }),
        })

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`)
        }

        const data = (await response.json()) as SearchResponse
        console.log('Full search response:', data)
        console.log('Assets items:', data.assets?.items)
        
        const assetsToSet = data.assets?.items || []
        console.log('Setting assets to:', assetsToSet)
        setAssets(assetsToSet)
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch assets')
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [])

  return (
    <>
      <div>
        <h1>Immich Lite Viewer</h1>
      </div>
      <div className="card">
        {loading ? (
          <p>Loading assets...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : assets.length > 0 ? (
          <div>
            <h2>Assets with "rantatalo" in path ({assets.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {assets.map((asset) => (
                <div key={asset.id} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px', backgroundColor: '#f0f0f0' }} title={asset.originalFileName}>
                  <img 
                    src={`/api/assets/${asset.id}/thumbnail`} 
                    alt={asset.originalFileName}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ fontSize: '12px', padding: '4px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.originalFileName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No assets found with "rantatalo" in path</p>
        )}
      </div>
    </>
  )
}

export default App
