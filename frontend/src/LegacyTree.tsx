// LegacyTree.tsx - ES5 compatible for legacy browsers used in Smart TVs etc
import { useEffect, useRef, useState, KeyboardEvent } from "react";

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  children: FolderNode[];
}

export interface LegacyTreeNodeProps {
  node: FolderNode;
  level?: number;
  onNodeClick: (path: string) => void;
}

function getVisibleTreeItems() {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.legacy-tree-node [role="treeitem"]',
    ),
  );
}

function focusTreeItem(current: HTMLElement, direction: "next" | "previous") {
  const items = getVisibleTreeItems();
  const index = items.indexOf(current);

  if (index === -1) {
    return;
  }

  const target = direction === "next" ? items[index + 1] : items[index - 1];

  if (target) {
    target.focus();
  }
}

function focusParentTreeItem(current: HTMLElement) {
  const currentWrapper = current.closest(".legacy-tree-node");
  const parentWrapper =
    currentWrapper?.parentElement?.closest(".legacy-tree-node");
  return parentWrapper?.querySelector<HTMLElement>('[role="treeitem"]') || null;
}

function LegacyTreeNode({ node, level = 0, onNodeClick }: LegacyTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (node.children && node.children.length > 0) {
      setExpanded(!expanded);
    } else {
      onNodeClick(node.path);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const rawKey = event.key || String.fromCharCode(event.keyCode || 0);
    const key = rawKey === " " || rawKey === "Spacebar" ? " " : rawKey;
    const current = event.currentTarget as HTMLElement;

    if (key === "Enter" || key === " ") {
      event.preventDefault();
      handleClick();
      return;
    }

    if (key === "ArrowDown" || event.keyCode === 40) {
      event.preventDefault();
      focusTreeItem(current, "next");
      return;
    }

    if (key === "ArrowUp" || event.keyCode === 38) {
      event.preventDefault();
      focusTreeItem(current, "previous");
      return;
    }

    if (
      (key === "ArrowRight" || event.keyCode === 39) &&
      node.children &&
      node.children.length > 0
    ) {
      event.preventDefault();
      if (!expanded) {
        setExpanded(true);
      } else {
        focusTreeItem(current, "next");
      }
      return;
    }

    if (key === "ArrowLeft" || event.keyCode === 37) {
      event.preventDefault();
      if (expanded) {
        setExpanded(false);
      } else {
        const parentItem = focusParentTreeItem(current);
        parentItem?.focus();
      }
    }
  };

  return (
    <div className="legacy-tree-node" style={{ marginLeft: level * 20 }}>
      <span
        role="treeitem"
        aria-expanded={
          node.children && node.children.length > 0 ? expanded : undefined
        }
        aria-level={level + 1}
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ cursor: "pointer", display: "inline-block" }}
      >
        {expanded ? "📂" : "📁"} {node.name}
      </span>

      {expanded && node.children && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
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
  );
}

export function LegacyTree({
  data,
  onNodeClick,
}: {
  data: FolderNode[];
  onNodeClick: (path: string) => void;
}) {
  const treeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const firstItem =
      treeRef.current?.querySelector<HTMLElement>('[role="treeitem"]');
    firstItem?.focus();
  }, []);

  return (
    <div
      className="legacy-tree-container"
      role="tree"
      aria-label="Folder tree"
      ref={treeRef}
    >
      {data.map((node) => (
        <LegacyTreeNode key={node.id} node={node} onNodeClick={onNodeClick} />
      ))}
    </div>
  );
}
