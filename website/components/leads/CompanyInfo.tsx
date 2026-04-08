'use client';

import {
  Building2,
  Users,
  Calendar,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  TrendingUp,
  DollarSign,
  Briefcase,
  Phone,
  ExternalLink,
} from 'lucide-react';
import type { Organisation } from '@/lib/leads-client';

interface Props {
  organisation: Organisation;
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatRevenue(o: Organisation): string | null {
  if (o.annualRevenuePrinted) return o.annualRevenuePrinted;
  if (o.annualRevenue) return `$${formatNumber(o.annualRevenue)}`;
  return null;
}

function formatFunding(o: Organisation): string | null {
  if (o.totalFundingPrinted) return o.totalFundingPrinted;
  if (o.totalFunding) return `$${formatNumber(o.totalFunding)}`;
  return null;
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  accent?: string;
}) {
  if (value == null || value === '') return null;
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: accent ?? 'rgba(255,255,255,0.35)',
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-dm-mono)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SocialButton({
  href,
  icon,
  label,
}: {
  href?: string | null;
  icon: React.ReactNode;
  label: string;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        color: 'rgba(255,255,255,0.5)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
      }}
    >
      {icon}
    </a>
  );
}

export default function CompanyInfo({ organisation: o }: Props) {
  const revenue = formatRevenue(o);
  const funding = formatFunding(o);
  const location = [o.city, o.state, o.country].filter(Boolean).join(', ');
  const fullAddress = [o.street, o.postalCode && o.city ? `${o.postalCode} ${o.city}` : o.city, o.country]
    .filter(Boolean)
    .join(', ');
  const isPublic = !!o.publiclyTradedSymbol;

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        Unternehmen
      </div>

      {/* Header: logo + name + meta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {o.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={o.logoUrl}
              alt={o.name ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Building2 size={24} color="rgba(255,255,255,0.3)" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.95)',
              }}
            >
              {o.name ?? '—'}
            </div>
            {isPublic && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#22C55E',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  letterSpacing: '0.05em',
                }}
              >
                {o.publiclyTradedExchange}: {o.publiclyTradedSymbol}
              </span>
            )}
          </div>
          {o.industry && (
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                marginTop: 2,
                textTransform: 'capitalize',
              }}
            >
              {o.industry.replace(/_/g, ' ')}
            </div>
          )}
          {o.websiteUrl && (
            <a
              href={o.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: '#6B7AFF',
                textDecoration: 'none',
                marginTop: 6,
                fontFamily: 'var(--font-dm-mono)',
              }}
            >
              {o.primaryDomain ?? o.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {(o.shortDescription || o.seoDescription) && (
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.65,
            margin: '0 0 18px',
            paddingBottom: 18,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {o.shortDescription ?? o.seoDescription}
        </p>
      )}

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          marginBottom: 18,
        }}
      >
        <Stat
          icon={<Users size={12} />}
          label="Mitarbeiter"
          value={o.estimatedNumEmployees != null ? formatNumber(o.estimatedNumEmployees) : null}
          accent="#6B7AFF"
        />
        <Stat
          icon={<Calendar size={12} />}
          label="Gegründet"
          value={o.foundedYear ?? null}
          accent="#a78bfa"
        />
        <Stat icon={<DollarSign size={12} />} label="Umsatz" value={revenue} accent="#22C55E" />
        <Stat icon={<TrendingUp size={12} />} label="Funding" value={funding} accent="#f59e0b" />
        {o.latestFundingStage && (
          <Stat icon={<Briefcase size={12} />} label="Stage" value={o.latestFundingStage} accent="#f97316" />
        )}
        {o.alexaRanking != null && (
          <Stat
            icon={<Globe size={12} />}
            label="Alexa Rank"
            value={`#${formatNumber(o.alexaRanking)}`}
            accent="#6dbf8a"
          />
        )}
      </div>

      {/* Location & contact */}
      {(fullAddress || location || o.phone) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 18,
            paddingBottom: 18,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {(fullAddress || location) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
              <MapPin size={13} color="rgba(255,255,255,0.35)" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{fullAddress || location}</span>
            </div>
          )}
          {o.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <Phone size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
              <a
                href={`tel:${o.phone}`}
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-dm-mono)',
                }}
              >
                {o.phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Industries / Keywords */}
      {(o.industries?.length || o.keywords?.length) && (
        <div style={{ marginBottom: 18 }}>
          {o.industries && o.industries.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Branchen
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {o.industries.slice(0, 12).map((i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: 'rgba(107,122,255,0.08)',
                      border: '1px solid rgba(107,122,255,0.18)',
                      color: '#7c9cef',
                      padding: '2px 8px',
                      borderRadius: 6,
                      textTransform: 'capitalize',
                    }}
                  >
                    {i.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          {o.keywords && o.keywords.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Keywords
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {o.keywords.slice(0, 16).map((k) => (
                  <span
                    key={k}
                    style={{
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.55)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Technologies */}
      {o.technologies && o.technologies.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            Tech-Stack
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {o.technologies.slice(0, 20).map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11,
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.18)',
                  color: '#6dbf8a',
                  padding: '2px 8px',
                  borderRadius: 6,
                  textTransform: 'capitalize',
                }}
              >
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Socials */}
      {(o.linkedinUrl || o.twitterUrl || o.facebookUrl || o.blogUrl) && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
          <SocialButton href={o.linkedinUrl} icon={<Linkedin size={14} />} label="LinkedIn" />
          <SocialButton href={o.twitterUrl} icon={<Twitter size={14} />} label="Twitter / X" />
          <SocialButton href={o.facebookUrl} icon={<Facebook size={14} />} label="Facebook" />
          <SocialButton href={o.blogUrl} icon={<Globe size={14} />} label="Blog" />
        </div>
      )}
    </div>
  );
}
