import { useState, useMemo } from "react";
import { EmptyState } from "../components/EmptyState";
import type { FileNode } from "../types/codex";

type Props = {
  files: FileNode[];
  onLoadFile?: (fileId: string) => void;
};

export function FilesPage({ files, onLoadFile }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const firstFile = useMemo(() => findFirstFile(files), [files]);
  const activeId = selectedId ?? firstFile?.id ?? null;

  const selectedNode = useMemo(() => findNode(files, activeId), [files, activeId]);

  const handleSelect = (node: FileNode) => {
    setSelectedId(node.id);
    if (node.type === "file" && node.content === undefined && onLoadFile) {
      onLoadFile(node.id);
    }
  };

  return (
    <div className="files-layout">
      <section className="panel file-tree-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">REPOSITORY</span>
            <h2>Files</h2>
          </div>
        </div>

        <div className="file-search">
          <input
            type="search"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search files"
          />
        </div>

        {files.length === 0 ? (
          <EmptyState
            title="No files"
            message="The repository is empty or not yet loaded."
            icon="▱"
          />
        ) : (
          <div className="tree-root" role="tree" aria-label="File explorer">
            {files.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                search={search}
                activeId={activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </section>

      <section className="panel code-viewer">
        <div className="code-header">
          <div>
            <span className="eyebrow">{selectedNode?.language ?? "FILE"}</span>
            <b>{selectedNode?.name ?? "Select a file"}</b>
          </div>
          {selectedNode && selectedNode.type === "file" && (
            <span>
              {selectedNode.size && `${selectedNode.size} · `}
              {selectedNode.updatedAt}
            </span>
          )}
        </div>

        {!selectedNode || selectedNode.type === "folder" ? (
          <EmptyState title="Select a file" message="Choose a file to view its contents." icon="▱" />
        ) : selectedNode.loading ? (
          <div className="empty-state loading-state">
            <span className="spinner" aria-hidden="true" />
            <b>Loading file…</b>
          </div>
        ) : selectedNode.content ? (
          <pre className="line-numbers-pre">
            <code>
              {selectedNode.content.split("\n").map((line, i) => (
                <div key={i} className="code-line">
                  <span className="line-number" aria-hidden="true">{i + 1}</span>
                  <span className="line-content">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        ) : (
          <EmptyState title="Empty file" message="This file has no content." icon="▱" />
        )}
      </section>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

type TreeNodeProps = {
  node: FileNode;
  depth: number;
  search: string;
  activeId: string | null;
  onSelect: (node: FileNode) => void;
};

function TreeNode({ node, depth, search, activeId, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  // Simple search filter: if there's a search term, only show nodes that match
  // or folders that have matching children (simplified for this demo).
  const matchesSearch =
    !search || node.name.toLowerCase().includes(search.toLowerCase());

  if (node.type === "file") {
    if (!matchesSearch) return null;
    const isActive = activeId === node.id;
    return (
      <button
        role="treeitem"
        aria-selected={isActive}
        className={isActive ? "tree-file active" : "tree-file"}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        <span aria-hidden="true">▱</span> {node.name}
      </button>
    );
  }

  // Folder
  const hasMatchingChildren =
    !search ||
    (node.children &&
      node.children.some((child) =>
        child.name.toLowerCase().includes(search.toLowerCase())
      ));

  if (!matchesSearch && !hasMatchingChildren) return null;

  return (
    <div role="group">
      <button
        role="treeitem"
        aria-expanded={expanded}
        className="tree-folder"
        style={{ paddingLeft: `${depth * 16 + 5}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="folder-arrow" aria-hidden="true">
          {expanded ? "⌄" : "›"}
        </span>
        <span aria-hidden="true">▰</span> {node.name}
      </button>
      {expanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              search={search}
              activeId={activeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findFirstFile(nodes: FileNode[]): FileNode | null {
  for (const node of nodes) {
    if (node.type === "file") return node;
    if (node.children) {
      const found = findFirstFile(node.children);
      if (found) return found;
    }
  }
  return null;
}

function findNode(nodes: FileNode[], id: string | null): FileNode | null {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
