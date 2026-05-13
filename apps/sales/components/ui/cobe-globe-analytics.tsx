'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import createGlobe from 'cobe';
import { Maximize2, X } from 'lucide-react';

interface AnalyticsMarker {
  id: string;
  label?: string;
  location: [number, number];
  visitors: number;
  trend: number;
}

interface GlobeAnalyticsProps {
  markers?: AnalyticsMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: AnalyticsMarker[] = [
  { id: 'vis-1', label: 'New York', location: [40.71, -74.01], visitors: 847, trend: 12 },
  { id: 'vis-2', label: 'London', location: [51.51, -0.13], visitors: 623, trend: -3 },
  { id: 'vis-3', label: 'Tokyo', location: [35.68, 139.65], visitors: 412, trend: 8 },
  { id: 'vis-4', label: 'Paris', location: [48.86, 2.35], visitors: 385, trend: 5 },
  { id: 'vis-5', label: 'Sydney', location: [-33.87, 151.21], visitors: 201, trend: 15 },
  { id: 'vis-6', label: 'Berlin', location: [52.52, 13.41], visitors: 178, trend: -1 },
];

// Reverse-projects a canvas position to (lat, lng) on the globe surface.
// More reliable than forward-projecting markers, since we don't need to
// replicate cobe's exact internal math — we just need a consistent inverse.
function canvasToLatLng(
  mx: number,
  my: number,
  cx: number,
  cy: number,
  radius: number,
  phi: number,
  theta: number
): { lat: number; lng: number } | null {
  // Normalize to unit-sphere screen space
  const nx = (mx - cx) / radius;
  const ny = -(my - cy) / radius;
  if (nx * nx + ny * ny > 1) return null;
  const nz = -Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

  // Reverse X rotation (theta)
  const ry = ny * Math.cos(theta) + nz * Math.sin(theta);
  const rz = -ny * Math.sin(theta) + nz * Math.cos(theta);

  // Reverse Y rotation (phi)
  const wpx = nx * Math.cos(phi) + rz * Math.sin(phi);
  const wpy = ry;
  const wpz = -nx * Math.sin(phi) + rz * Math.cos(phi);

  return {
    lat: Math.asin(Math.max(-1, Math.min(1, wpy))) * (180 / Math.PI),
    lng: Math.atan2(wpx, wpz) * (180 / Math.PI),
  };
}

interface GlobeCanvasProps {
  markers: AnalyticsMarker[];
  speed: number;
  zoomRef: React.MutableRefObject<number>;
  dark?: boolean;
  onHover?: (marker: AnalyticsMarker | null, clientX: number, clientY: number) => void;
}

function GlobeCanvas({ markers, speed, zoomRef, dark = false, onHover }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const autoPhiRef = useRef(0);
  const currentPhiRef = useRef(0);
  const currentThetaRef = useRef(0.18);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointerInteracting.current) return;
      dragOffset.current = {
        phi: (e.clientX - pointerInteracting.current.x) / 220,
        theta: (e.clientY - pointerInteracting.current.y) / 800,
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerUp]);

  // Scroll-to-zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(0.65, Math.min(3.0, zoomRef.current - e.deltaY * 0.0015));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [zoomRef]);

  // Hover detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onHover) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const r = rect.width / 2;
      const point = canvasToLatLng(
        e.clientX - rect.left,
        e.clientY - rect.top,
        r,
        r,
        r * zoomRef.current,
        currentPhiRef.current,
        currentThetaRef.current
      );

      if (!point) {
        onHover(null, 0, 0);
        return;
      }

      let closest: AnalyticsMarker | null = null;
      let minDist = 10; // degrees

      for (const m of markers) {
        const dlat = m.location[0] - point.lat;
        const dlng = m.location[1] - point.lng;
        const dist = Math.sqrt(dlat * dlat + dlng * dlng);
        if (dist < minDist) {
          minDist = dist;
          closest = m;
        }
      }
      onHover(closest, e.clientX, e.clientY);
    };

    const onMouseLeave = () => onHover(null, 0, 0);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [markers, onHover, zoomRef]);

  // Globe init + animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animId: number;

    function init() {
      const width = canvas!.offsetWidth;
      if (width === 0 || globe) return;
      globe = createGlobe(canvas!, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0.8,
        theta: 0.18,
        dark: dark ? 1 : 0,
        diffuse: dark ? 1.2 : 1.5,
        mapSamples: 20000,
        mapBrightness: dark ? 6 : 10,
        baseColor: dark ? [0.06, 0.08, 0.14] : [1, 1, 1],
        markerColor: [0.28, 0.82, 0.42],
        glowColor: dark ? [0.1, 0.14, 0.35] : [0.94, 0.93, 0.91],
        markerElevation: 0,
        markers: markers.map((m) => ({ location: m.location, size: 0.025, id: m.id })),
        arcs: [],
        arcColor: [0.25, 0.9, 0.5],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: dark ? 0.85 : 0.7,
      });

      function animate() {
        if (!isPausedRef.current) autoPhiRef.current += speed;
        const currentPhi = autoPhiRef.current + phiOffsetRef.current + dragOffset.current.phi;
        const currentTheta = 0.18 + thetaOffsetRef.current + dragOffset.current.theta;
        currentPhiRef.current = currentPhi;
        currentThetaRef.current = currentTheta;
        globe!.update({ phi: currentPhi, theta: currentTheta, scale: zoomRef.current });
        animId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = '1'));
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        if (animId) cancelAnimationFrame(animId);
        if (globe) globe.destroy();
      };
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (globe) globe.destroy();
    };
  }, [markers, speed, dark, zoomRef]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        opacity: 0,
        transition: 'opacity 1.2s ease',
        borderRadius: '50%',
        touchAction: 'none',
        display: 'block',
      }}
    />
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  marker: AnalyticsMarker;
  x: number;
  y: number;
}

function MarkerTooltip({ state }: { state: TooltipState }) {
  const label = state.marker.label ?? state.marker.id;
  const { visitors, trend } = state.marker;
  return (
    <div
      style={{
        position: 'fixed',
        left: state.x + 14,
        top: state.y - 36,
        background: '#fff',
        border: '1px solid #E8ECF0',
        borderRadius: 9,
        padding: '6px 11px',
        boxShadow: '0 4px 20px rgba(10,37,64,0.10)',
        pointerEvents: 'none',
        zIndex: 10001,
        fontFamily: 'var(--font-nunito),sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: '#0A2540', lineHeight: 1.2 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
        {visitors} Leads&nbsp;·&nbsp;
        <span style={{ color: trend >= 0 ? '#059669' : '#E11D48', fontWeight: 700 }}>
          {trend >= 0 ? '+' : ''}
          {trend}%
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GlobeAnalytics({
  markers: initialMarkers = defaultMarkers,
  className = '',
  speed = 0.003,
}: GlobeAnalyticsProps) {
  const [data, setData] = useState(initialMarkers);
  const [fullscreen, setFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [fsTooltip, setFsTooltip] = useState<TooltipState | null>(null);
  const zoomRef = useRef(1);
  const fsZoomRef = useRef(1);

  // Live data ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) =>
        prev.map((m) => ({
          ...m,
          visitors: Math.max(1, m.visitors + Math.floor(Math.random() * 11) - 3),
          trend: Math.max(-20, Math.min(20, m.trend + Math.floor(Math.random() * 5) - 2)),
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ESC closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const handleHover = useCallback((marker: AnalyticsMarker | null, x: number, y: number) => {
    setTooltip(marker ? { marker, x, y } : null);
  }, []);

  const handleFsHover = useCallback((marker: AnalyticsMarker | null, x: number, y: number) => {
    setFsTooltip(marker ? { marker, x, y } : null);
  }, []);

  return (
    <>
      {/* ── Widget view ── */}
      <div className={`relative aspect-square select-none ${className}`}>
        <GlobeCanvas markers={data} speed={speed} zoomRef={zoomRef} dark={false} onHover={handleHover} />

        <button
          onClick={() => setFullscreen(true)}
          title="Vollbild"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            zIndex: 2,
            background: 'rgba(79,70,229,0.07)',
            border: 'none',
            borderRadius: 6,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Maximize2 size={10} color="#4F46E5" strokeWidth={2.5} />
        </button>

        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 8,
            fontWeight: 600,
            color: 'rgba(79,70,229,0.35)',
            letterSpacing: '0.06em',
            userSelect: 'none',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-nunito),sans-serif',
          }}
        >
          Scrollen zum Zoomen · Ziehen zum Drehen
        </div>
      </div>

      {tooltip && <MarkerTooltip state={tooltip} />}

      {/* ── Fullscreen portal ── */}
      {fullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setFullscreen(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid #E8ECF0',
                borderRadius: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#697386',
              }}
            >
              <X size={16} />
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(0,0,0,0.25)',
                letterSpacing: '0.07em',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-nunito),sans-serif',
              }}
            >
              Scrollen zum Zoomen · Ziehen zum Drehen · ESC zum Schließen
            </div>

            <div style={{ width: 'min(80vh, 80vw)', height: 'min(80vh, 80vw)' }}>
              <GlobeCanvas
                markers={data}
                speed={speed * 0.6}
                zoomRef={fsZoomRef}
                dark={false}
                onHover={handleFsHover}
              />
            </div>

            {fsTooltip && <MarkerTooltip state={fsTooltip} />}
          </div>,
          document.body
        )}
    </>
  );
}
