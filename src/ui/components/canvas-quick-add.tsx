import { useMemo, useState } from 'react';
import type { ModuleDefinition } from '../../engine/types';
import type { ModuleRegistry } from '../../engine/types';

export interface CanvasQuickAddOption {
  id: string;
  label: string;
  detailId?: string;
  subtitle?: string;
  badge?: string;
  onSelect: () => void;
}

interface CanvasQuickAddProps {
  clientX: number;
  clientY: number;
  canvasX: number;
  canvasY: number;
  registry: ModuleRegistry;
  onAdd?: (def: ModuleDefinition, position: { x: number; y: number }) => void;
  options?: CanvasQuickAddOption[];
  placeholder?: string;
  emptyMessage?: string;
  onDismiss: () => void;
}

export function CanvasQuickAdd({
  clientX,
  clientY,
  canvasX,
  canvasY,
  registry,
  onAdd,
  options,
  placeholder = 'Add module…',
  emptyMessage = 'No matching modules.',
  onDismiss,
}: CanvasQuickAddProps) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const optionList: CanvasQuickAddOption[] =
      options ??
      Object.values(registry).map((def) => ({
        id: def.id,
        label: def.name,
        detailId: def.id,
        onSelect: () => {
          onAdd?.(def, { x: canvasX, y: canvasY });
        },
      }));

    const filtered = q
      ? optionList.filter(
          ({ id, label, detailId, subtitle, badge }) =>
            id.toLowerCase().includes(q) ||
            label.toLowerCase().includes(q) ||
            detailId?.toLowerCase().includes(q) ||
            subtitle?.toLowerCase().includes(q) ||
            badge?.toLowerCase().includes(q),
        )
      : optionList;

    return filtered.slice(0, 8);
  }, [canvasX, canvasY, onAdd, options, q, registry]);

  function place(option: CanvasQuickAddOption) {
    option.onSelect();
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
        placeholder={placeholder}
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
          {results.map((option) => (
            <li
              key={`${option.id}:${option.detailId ?? ''}:${option.subtitle ?? ''}`}
              className="canvas-quick-add-item"
              onMouseDown={() => place(option)}
            >
              <span className="canvas-quick-add-copy">
                <span className="canvas-quick-add-name-row">
                  <span className="canvas-quick-add-name">{option.label}</span>
                  {option.badge ? <span className="canvas-quick-add-badge">{option.badge}</span> : null}
                </span>
                {option.subtitle ? (
                  <span className="canvas-quick-add-subtitle">{option.subtitle}</span>
                ) : null}
                <span className="canvas-quick-add-id">{option.detailId ?? option.id}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : q || options ? (
        <p className="canvas-quick-add-empty">{emptyMessage}</p>
      ) : null}
    </div>
  );
}
