'use client';

import { ChevronRightIcon } from '@radix-ui/react-icons';
import * as Color from 'color-bits';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { OnveroLogo } from '../marketing/onvero-logo';
import { useTranslation, useLanguage, type Lang } from '@/lib/language-context';

export const getRGBA = (cssColor: React.CSSProperties['color'], fallback: string = 'rgba(180, 180, 180)'): string => {
  if (typeof window === 'undefined') return fallback;
  if (!cssColor) return fallback;
  try {
    if (typeof cssColor === 'string' && cssColor.startsWith('var(')) {
      const element = document.createElement('div');
      element.style.color = cssColor;
      document.body.appendChild(element);
      const computedColor = window.getComputedStyle(element).color;
      document.body.removeChild(element);
      return Color.formatRGBA(Color.parse(computedColor));
    }
    return Color.formatRGBA(Color.parse(cssColor));
  } catch {
    return fallback;
  }
};

export const colorWithOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith('rgb')) return color;
  return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = '#B4B4B4',
  width,
  height,
  className,
  maxOpacity = 0.15,
  text = '',
  fontSize = 140,
  fontWeight = 600,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const memoizedColor = useMemo(() => getRGBA(color), [color]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number
    ) => {
      ctx.clearRect(0, 0, w, h);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w;
      maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!maskCtx) return;
      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = 'white';
        maskCtx.font = `${fontWeight} ${fontSize}px system-ui, sans-serif`;
        maskCtx.textAlign = 'center';
        maskCtx.textBaseline = 'middle';
        maskCtx.fillText(text, w / (2 * dpr), h / (2 * dpr));
        maskCtx.restore();
      }
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const sw = squareSize * dpr;
          const sh = squareSize * dpr;
          const maskData = maskCtx.getImageData(x, y, sw, sh).data;
          const hasText = maskData.some((v, idx) => idx % 4 === 0 && v > 0);
          const opacity = squares[i * rows + j];
          const finalOpacity = hasText ? Math.min(1, opacity * 3 + 0.4) : opacity;
          ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
          ctx.fillRect(x, y, sw, sh);
        }
      }
    },
    [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight]
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }
      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity]
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(gridParams.squares, deltaTime);
      drawGrid(ctx, canvas.width, canvas.height, gridParams.cols, gridParams.rows, gridParams.squares, gridParams.dpr);
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0,
    });
    intersectionObserver.observe(canvas);

    if (isInView) animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div ref={containerRef} className={cn('h-full w-full', className)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
};

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);
  useEffect(() => {
    function check() {
      setValue(window.matchMedia(query).matches);
    }
    check();
    const mql = window.matchMedia(query);
    mql.addEventListener('change', check);
    return () => mql.removeEventListener('change', check);
  }, [query]);
  return value;
}

function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="inline-flex items-center rounded-md overflow-hidden text-xs font-semibold"
      style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      role="group"
      aria-label="Sprache wählen"
    >
      {(['de', 'en'] as Lang[]).map((code, i) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className="px-3 py-1.5 transition-colors"
          style={{
            color: lang === code ? '#fff' : 'rgba(255,255,255,0.35)',
            background: lang === code ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderRight: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            cursor: lang === code ? 'default' : 'pointer',
          }}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function FooterComponent() {
  const tablet = useMediaQuery('(max-width: 1024px)');
  const { t } = useTranslation();

  const footerLinks = [
    {
      title: t('Unternehmen', 'Company'),
      links: [
        { id: 1, title: t('Über uns', 'About us'), url: '/ueber-uns' },
        { id: 2, title: t('Erstgespräch buchen', 'Book a call'), url: '/erstgespraech-buchen' },
      ],
    },
    {
      title: t('Rechtliches', 'Legal'),
      links: [
        { id: 8, title: t('AGB', 'Terms of Service'), url: '/agb' },
        { id: 9, title: t('Datenschutz', 'Privacy Policy'), url: '/datenschutz' },
        { id: 10, title: t('Impressum', 'Imprint'), url: '/impressum' },
      ],
    },
  ];

  return (
    <footer id="footer" className="w-full pb-0" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Top divider */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 gap-10">
        {/* Brand */}
        <div className="flex flex-col items-start justify-start gap-y-4 max-w-xs mx-0">
          <Link href="/" aria-label="Onvero">
            <OnveroLogo className="h-6 w-auto" />
          </Link>
          <p className="tracking-tight text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t(
              'KI-Infrastruktur für dein Unternehmen — von der Website bis zum internen Tool. Einfach wirksam.',
              'AI infrastructure for your business — from the website to internal tools. Simply effective.'
            )}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-2 py-1 rounded-md"
              style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              DSGVO
            </span>
            <span
              className="text-xs px-2 py-1 rounded-md"
              style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Made in DE
            </span>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-1 mt-1">
            <a
              href="mailto:info@onvero.de"
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              info@onvero.de
            </a>
            <a
              href="tel:+491638981544"
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              +49 163 8981544
            </a>
          </div>

          {/* Language toggle */}
          <LangToggle />
        </div>

        {/* Links */}
        <div className="pt-2 md:w-1/2">
          <div className="flex flex-col items-start justify-start md:flex-row md:items-start md:justify-between gap-y-8 lg:pl-10">
            {footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-sm font-semibold text-white">{column.title}</li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Link
                      href={link.url}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                      style={{ color: 'inherit' }}
                    >
                      {link.title}
                    </Link>
                    <div
                      className="flex size-4 items-center justify-center rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100"
                      style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <ChevronRightIcon className="h-3 w-3 text-white" />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>

      {/* Flickering grid bottom */}
      <div className="w-full h-48 md:h-64 relative mt-8 z-0">
        <div
          className="absolute inset-0 z-10 from-40%"
          style={{ background: 'linear-gradient(to top, transparent, #0f0f0f)' }}
        />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text="ONVERO"
            fontSize={tablet ? 72 : 96}
            fontWeight={700}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#ffffff"
            maxOpacity={0.12}
            flickerChance={0.08}
          />
        </div>
      </div>

      {/* Copyright */}
      <div
        className="px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Onvero. {t('Alle Rechte vorbehalten.', 'All rights reserved.')}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
          {t('Gebaut mit KI. Für Unternehmen.', 'Built with AI. For businesses.')}
        </p>
      </div>
    </footer>
  );
}
