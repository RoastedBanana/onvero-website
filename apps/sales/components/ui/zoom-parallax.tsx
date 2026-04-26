'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import { Model3D } from '@/components/ui/model-3d';

interface Image {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  images: Image[];
}

const LAYOUT = [
  // 0 — center 3D model: starts small, grows to fill screen on full zoom
  { top: '0vh',   left: '0vw',   width: '18vw', height: '20vh', scale: 'scale4' },
  { top: '-20vh', left: '-24vw', width: '20vw', height: '22vh', scale: 'scale6' },
  { top: '-19vh', left: '23vw',  width: '20vw', height: '22vh', scale: 'scale6' },
  { top: '1vh',   left: '-27vw', width: '17vw', height: '18vh', scale: 'scale8' },
  { top: '1vh',   left: '26vw',  width: '17vw', height: '18vh', scale: 'scale8' },
  { top: '22vh',  left: '-22vw', width: '18vw', height: '18vh', scale: 'scale9' },
  { top: '22vh',  left: '21vw',  width: '18vw', height: '18vh', scale: 'scale9' },
] as const;

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);
  const scaleMap = { scale4, scale6, scale8, scale9 };

  return (
    <div ref={container} className="relative h-[200vh]" style={{ overflowX: 'clip' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {[...Array(7)].map((_, index) => {
          const layout = LAYOUT[index];
          const scale  = scaleMap[layout.scale];
          const img    = images[index];

          return (
            <motion.div
              key={index}
              style={{ scale, pointerEvents: 'none' }}
              className="absolute top-0 flex h-full w-full items-center justify-center"
            >
              <div
                style={{
                  position: 'relative',
                  width: layout.width,
                  height: layout.height,
                  top: layout.top,
                  left: layout.left,
                  flexShrink: 0,
                  borderRadius: index === 0 ? 0 : '0.75rem',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                }}
              >
                {index === 0 ? (
                  <Model3D />
                ) : img ? (
                  <Image
                    src={img.src}
                    alt={img.alt || `Parallax image ${index + 1}`}
                    fill
                    sizes="20vw"
                    style={{
                      objectFit: 'cover',
                      borderRadius: '0.75rem',
                    }}
                  />
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
