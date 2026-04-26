'use client';

import { BusinessAIChat } from '@onvero/ui/chat/business-ai-chat';

export default function BusinessAIPage() {
  // Cancel the dashboard <main> padding so the chat can use full bleed.
  // Topbar is 56px, so available viewport height is 100vh - 56px.
  return (
    <div
      style={{
        margin: '-28px -32px -40px',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}
    >
      <BusinessAIChat />
    </div>
  );
}
