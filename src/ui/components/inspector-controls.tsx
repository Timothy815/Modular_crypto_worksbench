import { useRef, useState } from 'react';

import type { WorkbenchPortSide } from '../workbench-document';

export const PORT_SIDE_ORDER: WorkbenchPortSide[] = ['left', 'right', 'top', 'bottom'];

export type InspectorIconName =
  | 'rotate'
  | 'rotate-left'
  | 'rotate-right'
  | 'duplicate'
  | 'delete'
  | 'copy'
  | 'rename'
  | 'bypass'
  | 'move-up'
  | 'move-down'
  | 'identity'
  | 'reverse'
  | 'inverse'
  | 'configure'
  | 'analyze'
  | 'compare'
  | 'ports-default'
  | 'ports-horizontal'
  | 'ports-vertical';

export function InspectorIcon({ name }: { name: InspectorIconName }) {
  switch (name) {
    case 'rotate':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M13.8 4.4a5.9 5.9 0 1 0 1.7 7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.8 2.9h3.8v3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rotate-left':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M14.2 10.2a4.4 4.4 0 1 1-4.4-4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 5.8H5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 4.1 5 5.8l2.2 1.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rotate-right':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.8 10.2a4.4 4.4 0 1 0 4.4-4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.8 5.8h3.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m12.8 4.1 2.2 1.7-2.2 1.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'duplicate':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="6.5"
            y="4.5"
            width="8"
            height="8"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="3.5"
            y="7.5"
            width="8"
            height="8"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'delete':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5.5 6.2h9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 6.2V4.7h4v1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 6.2l.5 8h4.6l.5-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 8.5v3.8M11 8.5v3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'copy':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="6.5"
            y="4"
            width="8"
            height="10"
            rx="1.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5 7.2H4.4A1.4 1.4 0 0 0 3 8.6v6A1.4 1.4 0 0 0 4.4 16h6A1.4 1.4 0 0 0 11.8 14.6V14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'rename':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4.5 14.3l.6-2.8 6.8-6.8 2.2 2.2-6.8 6.8-2.8.6z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.9 5.8l2.2 2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'bypass':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4 6h5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10.5 6h5.5v8H10.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.5 14H4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.8 6l2.7 4-2.7 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'move-up':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 15V5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.8 8.2 10 5l3.2 3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'move-down':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 5v10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.8 11.8 10 15l3.2-3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'identity':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4.2" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <path
            d="M5.8 5.3h8.4M5.8 10h8.4M5.8 14.7h8.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'reverse':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="4.2" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.2" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="5.3" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="10" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15.8" cy="14.7" r="1.1" fill="currentColor" stroke="none" />
          <path
            d="M5.8 5.3h2.7c2.8 0 5 2.2 5.7 4.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.8 10h8.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M5.8 14.7h2.7c2.8 0 5-2.2 5.7-4.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'inverse':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6 4.8v10.4M14 4.8v10.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7.4 7.2h5.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10.2 5l2.2 2.2-2.2 2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.6 12.8H7.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.8 15l-2.2-2.2 2.2-2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'configure':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M5 5.2h10M5 10h10M5 14.8h10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="7.2" cy="5.2" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12.8" cy="10" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="9.2" cy="14.8" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'analyze':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle
            cx="8.5"
            cy="8.5"
            r="4.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M11.7 11.7L15.5 15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.6 8.7l1.4 1.5 2.5-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'compare':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <rect
            x="3.5"
            y="4.5"
            width="5.5"
            height="11"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <rect
            x="11"
            y="4.5"
            width="5.5"
            height="11"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-default':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M4.5 6.5h4M11.5 6.5h4M4.5 13.5h4M11.5 13.5h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="8.2"
            y="5"
            width="3.6"
            height="10"
            rx="1.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-horizontal':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M3.5 6.5h3M13.5 6.5h3M3.5 13.5h3M13.5 13.5h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="6.5"
            y="4.7"
            width="7"
            height="10.6"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case 'ports-vertical':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M6.5 3.5v3M13.5 3.5v3M6.5 13.5v3M13.5 13.5v3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="4.7"
            y="6.5"
            width="10.6"
            height="7"
            rx="1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

interface InspectorIconButtonProps {
  icon: InspectorIconName;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export function InspectorIconButton({
  icon,
  label,
  onClick,
  tone = 'default',
  disabled = false,
}: InspectorIconButtonProps) {
  return (
    <button
      type="button"
      className={`inspector-icon-button inspector-icon-button-${tone}`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <InspectorIcon name={icon} />
    </button>
  );
}

interface InspectorTabButtonProps {
  icon: Extract<InspectorIconName, 'configure' | 'analyze' | 'compare'>;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function InspectorTabButton({ icon, label, active, onClick }: InspectorTabButtonProps) {
  return (
    <button
      type="button"
      className={`inspector-tab-button${active ? ' active' : ''}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <InspectorIcon name={icon} />
      <span>{label}</span>
    </button>
  );
}

export function ScrubNumberInput({
  renderedValue,
  onRawChange,
}: {
  renderedValue: string;
  onRawChange: (raw: string) => void;
}) {
  const scrubRef = useRef<{
    pointerId: number;
    startX: number;
    startValue: number;
    input: HTMLInputElement;
    active: boolean;
  } | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  return (
    <input
      type="number"
      className={isScrubbing ? 'param-input-number param-input-scrubbing' : 'param-input-number'}
      value={renderedValue}
      onChange={(e) => onRawChange(e.target.value)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if (e.pointerType !== 'mouse') return;
        if (document.activeElement === e.currentTarget) return;
        const startValue = parseFloat(renderedValue);
        scrubRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startValue: isNaN(startValue) ? 0 : startValue,
          input: e.currentTarget,
          active: false,
        };
      }}
      onPointerMove={(e) => {
        if (!scrubRef.current) return;
        if (scrubRef.current.pointerId !== e.pointerId) return;
        const dx = e.clientX - scrubRef.current.startX;
        if (!scrubRef.current.active) {
          if (Math.abs(dx) < 6) {
            return;
          }
          e.preventDefault();
          scrubRef.current.input.setPointerCapture(e.pointerId);
          scrubRef.current.active = true;
          setIsScrubbing(true);
        }
        const steps = Math.round(dx / 4);
        onRawChange(String(scrubRef.current.startValue + steps));
      }}
      onPointerUp={(e) => {
        if (scrubRef.current?.active && scrubRef.current.input.hasPointerCapture(e.pointerId)) {
          scrubRef.current.input.releasePointerCapture(e.pointerId);
        }
        scrubRef.current = null;
        setIsScrubbing(false);
      }}
      onPointerCancel={(e) => {
        if (scrubRef.current?.active && scrubRef.current.input.hasPointerCapture(e.pointerId)) {
          scrubRef.current.input.releasePointerCapture(e.pointerId);
        }
        scrubRef.current = null;
        setIsScrubbing(false);
      }}
    />
  );
}
