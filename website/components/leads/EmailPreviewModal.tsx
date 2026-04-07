'use client';

import { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, Mail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    company: string;
    name: string;
    email: string;
    emailDraft?: string;
    emailDraftSubject?: string;
  };
}

export default function EmailPreviewModal({ isOpen, onClose, lead }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const fullText = lead.emailDraft || '';
  const lines = fullText.split('\n');
  const subject = lead.emailDraftSubject || lines[0] || '';
  const body = lead.emailDraftSubject ? fullText : lines.slice(1).join('\n').trim();

  const handleCopy = () => {
    const textToCopy = `Betreff: ${subject}\n\n${body}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGmail = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 20px',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              E-Mail an {lead.company}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Email preview card */}
        <div style={{ padding: '16px 20px' }}>
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: 16,
            }}
          >
            {/* To */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>An:</span>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{lead.email}</span>
            </div>

            {/* Subject */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>Betreff:</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{subject}</span>
            </div>

            {/* Separator */}
            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.06)',
                marginBottom: 12,
              }}
            />

            {/* Body */}
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {body}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 20px 20px',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: copied ? '#22C55E' : 'rgba(255,255,255,0.7)',
              background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Copy size={14} />
            {copied ? 'Kopiert' : 'Kopieren'}
          </button>
          <button
            onClick={handleGmail}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 500,
              color: '#6B7AFF',
              background: 'rgba(107,122,255,0.1)',
              border: '1px solid rgba(107,122,255,0.2)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ExternalLink size={14} />
            In Gmail öffnen
          </button>
        </div>
      </div>
    </div>
  );
}
