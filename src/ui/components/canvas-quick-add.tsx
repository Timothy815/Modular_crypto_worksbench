import { useState } from 'react';
import type { ModuleDefinition } from '../../engine/types';
import type { ModuleRegistry } from '../../engine/types';

interface CanvasQuickAddProps {
  clientX: number;
  clientY: number;
  canvasX: number;
  canvasY: number;
  registry: ModuleRegistry;
  onAdd: (def: ModuleDefinition, position: { x: number; y: number }) => void;
  onDismiss: () => void;
}

export function CanvasQuickAdd({ clientX, clientY, canvasX, canvasY, registry, onAdd, onDismiss }: CanvasQuickAddProps) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = q
    ? Object.values(registry)
        .filter((d) => d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  function place(def: ModuleDefinition) {
    onAdd(def, { x: canvasX, y: canvasY });
    onDismiss();
  }

  return (
    <div
      className="canvas-quick-add"
      style={{ left: clientX, top: clientY }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        className="canvas-quick-add-input"
        autoFocus
        placeholder="Add module…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(onDismiss, 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { onDismiss(); return; }
          if (e.key === 'Enter' && results[0]) { place(results[0]); }
        }}
      />
      {results.length > 0 ? (
        <ul className="canvas-quick-add-list">
          {results.map((def) => (
            <li
              key={def.id}
              className="canvas-quick-add-item"
              onMouseDown={() => place(def)}
            >
              <span className="canvas-quick-add-name">{def.name}</span>
              <span className="canvas-quick-add-id">{def.id}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
