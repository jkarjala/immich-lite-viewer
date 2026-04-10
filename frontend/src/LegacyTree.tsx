// LegacyTree.tsx - ES5 compatible for legacy browsers used in Smart TVs etc
import { useState } from 'react'

export interface FolderNode {
  id: string
  name: string
  path: string
  isFolder: boolean
  children: FolderNode[]
}

export interface LegacyTreeNodeProps {
  node: FolderNode
  level?: number
  onNodeClick: (path: string) => void
}

function LegacyTreeNode({ node, level = 0, onNodeClick }: LegacyTreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  
  const handleClick = () => {
    if (node.children && node.children.length > 0) {
      setExpanded(!expanded)
    } else {
      onNodeClick(node.path)
    }
  }

  return (
    <div style={{ marginLeft: level * 20 }}>
      <span 
        onClick={handleClick}
        style={{ cursor: 'pointer', display: 'inline-block' }}
      >
        {expanded ? '📂' : '📁'} {node.name}
      </span>
      
      {expanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <LegacyTreeNode 
              key={child.id} 
              node={child} 
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LegacyTree({ data, onNodeClick }: { 
  data: FolderNode[]
  onNodeClick: (path: string) => void 
}) {
  return (
    <div className="legacy-tree-container">
      {data.map(node => (
        <LegacyTreeNode 
          key={node.id} 
          node={node} 
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  )
}