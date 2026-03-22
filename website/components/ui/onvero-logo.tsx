/**
 * OnveroLogo — full horizontal logo (icon mark + wordmark)
 * OnveroIcon — just the icon mark
 * Both render in white for the dark theme.
 */

interface LogoProps {
  className?: string;
  /** Override all colors (default: white) */
  color?: string;
}

export function OnveroLogo({ className = "", color = "white" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 542.48 138.5"
      className={className}
      aria-label="Onvero"
      fill={color}
    >
      {/* Icon mark */}
      <circle cx="45.26" cy="112.99" r="9.05" />
      <circle cx="9.2" cy="76.63" r="9.2" />
      <line
        x1="38.88" y1="106.37" x2="15.56" y2="83.27"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      <line
        x1="56.82" y1="28.62" x2="15.43" y2="69.87"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      {/* Sparkle */}
      <path d="M84.75,12.19c-5.44-1.79-9.74-6.09-11.54-11.53-.13-.39-.5-.66-.91-.66h0c-.41,0-.78.26-.91.66-1.79,5.43-6.07,9.72-11.49,11.52-.27.09-.5.27-.61.53-.23.54.05,1.14.56,1.31,5.44,1.79,9.74,6.09,11.54,11.53.13.39.5.66.91.66h0c.41,0,.78-.26.91-.66,1.79-5.43,6.07-9.72,11.49-11.52.27-.09.5-.27.61-.53.23-.54-.05-1.14-.56-1.31Z" />
      {/* Dot on the right */}
      <circle cx="532.31" cy="91.53" r="10.17" />
      {/* Wordmark */}
      <text
        style={{
          fontFamily: "TimesNewRomanPSMT, 'Times New Roman', Times, serif",
          fontSize: "120px",
          letterSpacing: "0.04em",
          isolation: "isolate",
        }}
        transform="translate(121.88 101.7)"
      >
        Onvero
      </text>
    </svg>
  );
}

export function OnveroIcon({ className = "", color = "white" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 148.57 212.32"
      className={className}
      aria-hidden="true"
      fill={color}
    >
      <circle cx="78.75" cy="196.57" r="15.75" />
      <circle cx="16" cy="133.32" r="16" />
      <line
        x1="67.64" y1="185.06" x2="27.08" y2="144.87"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      <line
        x1="98.86" y1="49.8" x2="26.84" y2="121.55"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeMiterlimit="10"
        strokeWidth="8"
      />
      {/* Sparkle */}
      <path d="M147.45,21.2c-9.47-3.12-16.95-10.59-20.07-20.06C127.15.46,126.51,0,125.79,0h0c-.72,0-1.36.46-1.59,1.14-3.11,9.44-10.56,16.9-19.99,20.04-.46.15-.87.47-1.06.92-.4.95.09,1.98.98,2.27,9.47,3.12,16.95,10.59,20.07,20.06.23.68.87,1.14,1.59,1.14h0c.72,0,1.36-.46,1.59-1.14,3.11-9.44,10.56-16.9,19.99-20.04.46-.15.87-.47,1.06-.92.4-.95-.09-1.98-.98-2.27Z" />
    </svg>
  );
}
