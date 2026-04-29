import type { CSSProperties } from 'react';

type OnveroGradientProps = {
  /** Legacy WebGL colors prop — ignored now that the gradient is a static asset. */
  colors?: [string, string, string, string];
  className?: string;
  style?: CSSProperties;
};

export function OnveroGradient({ className, style }: OnveroGradientProps) {
  return (
    <img
      src="/gradient-onvero.png"
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      className={className}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  );
}
