'use client';

import { PageHeader } from '../_shared';
import { WebsiteTextsEditor } from '../_texts';

export default function TextsPage() {
  return (
    <>
      <PageHeader title="Website-Texte" subtitle="Headlines, Inhalte und Bilder pro Seite verwalten." />
      <WebsiteTextsEditor />
    </>
  );
}
