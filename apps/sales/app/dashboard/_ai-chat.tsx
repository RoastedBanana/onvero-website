'use client';

import { useState, useRef, useEffect } from 'react';
import { C, SvgIcon, ICONS } from './_shared';

type Message = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  time: string;
};

const DEMO_RESPONSES: Record<string, string> = {
  default: 'Ich kann dir bei Leads, Meetings und Analytics helfen. Was möchtest du wissen?',
  leads:
    'Du hast aktuell 2.847 Leads. Davon sind 6 "Hot" (Score ≥85), 4 "Warm" und 2 "Cold". Die Top-Leads sind Marcus Weber (94), Tom Schreiber (92) und Clara Wolff (91).',
  hamburg:
    '3 Leads aus Hamburg: Marcus Weber (Stackbase, Score 94), Clara Wolff (Silo Labs, Score 91) und Lena Fischer (Greenvolt, Score 58).',
  umsatz:
    'Dein aktueller Umsatz liegt bei €128.400 (+12% MoM). Größter Deal: Tom Schreiber / Axflow AG mit €18.000. Win Rate liegt bei 24.6%.',
  meeting:
    'Dein nächstes Meeting: Discovery Call mit Stackbase GmbH heute um 14:00 (Video). Morgen: Demo mit Axflow AG um 10:30.',
  score:
    'Der durchschnittliche Score liegt bei 84.2 — das ist +2.1 Punkte über dem Vormonat. 23 Leads wurden heute neu bewertet.',
  outreach:
    'Es gibt 6 neue Outreach-Ideen. Die beste: E-Mail an Marcus Weber (Stackbase) — Relevanz-Score 96. Soll ich die Nachricht zeigen?',
};

function getAIResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('lead')) return DEMO_RESPONSES.leads;
  if (q.includes('hamburg') || q.includes('stadt')) return DEMO_RESPONSES.hamburg;
  if (q.includes('revenue') || q.includes('umsatz')) return DEMO_RESPONSES.umsatz;
  if (q.includes('meeting') || q.includes('termin')) return DEMO_RESPONSES.meeting;
  if (q.includes('score') || q.includes('ki')) return DEMO_RESPONSES.score;
  if (q.includes('outreach') || q.includes('email') || q.includes('nachricht')) return DEMO_RESPONSES.outreach;
  return DEMO_RESPONSES.default;
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'ai',
      text: 'Hey! Ich bin dein Sales-Assistent. Frag mich zu Leads, Meetings oder Analytics.',
      time: 'jetzt',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  let msgId = useRef(1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  function send() {
    if (!input.trim()) return;
    const userMsg: Message = { id: msgId.current++, role: 'user', text: input.trim(), time: 'jetzt' };
    setMessages((prev) => [...prev, userMsg]);
    const q = input;
    setInput('');
    setTyping(true);

    setTimeout(
      () => {
        const response = getAIResponse(q);
        setTyping(false);
        setMessages((prev) => [...prev, { id: msgId.current++, role: 'ai', text: response, time: 'jetzt' }]);
      },
      800 + Math.random() * 600
    );
  }

  // Minimized bubble
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 40,
          right: 24,
          zIndex: 1050,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #6366F1, #818CF8)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
          animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(99,102,241,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.4)';
        }}
      >
        <SvgIcon d={ICONS.spark} size={20} color="#fff" />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 40,
        right: 24,
        zIndex: 1050,
        width: 380,
        height: 520,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 16px 64px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04), 0 0 30px rgba(99,102,241,0.08)',
        animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: C.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #818CF8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            <SvgIcon d={ICONS.spark} size={13} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text1 }}>Onvero AI</div>
            <div style={{ fontSize: 10, color: C.success, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: C.success,
                  boxShadow: `0 0 4px ${C.success}`,
                }}
              />
              Online
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            width: 28,
            height: 28,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SvgIcon d={ICONS.x} size={12} color={C.text3} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeInUp 0.25s ease both',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 12,
                background: m.role === 'user' ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'rgba(255,255,255,0.04)',
                border: m.role === 'ai' ? `1px solid ${C.border}` : 'none',
                color: m.role === 'user' ? '#fff' : C.text2,
                fontSize: 12.5,
                lineHeight: 1.6,
                boxShadow: m.role === 'user' ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              animation: 'fadeIn 0.2s ease both',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                display: 'flex',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: C.text3,
                    animation: 'pulse-live 1s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      <div
        style={{
          padding: '8px 16px 4px',
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {['Zeig mir meine Leads', 'Score Analyse', 'Nächstes Meeting'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setInput(s);
              setTimeout(send, 50);
            }}
            className="s-chip"
            style={{
              fontSize: 10,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.border}`,
              color: C.text3,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: C.bg,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Frag mich etwas..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '8px 12px',
            color: C.text1,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: input.trim() ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'rgba(255,255,255,0.04)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke={input.trim() ? '#fff' : C.text3}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
