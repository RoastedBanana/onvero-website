import type { ApolloPerson } from '../_types';

export interface Role {
  id: string;
  label: string;
  regex: RegExp;
}

export const ROLES: Role[] = [
  {
    id: 'ceo',
    label: 'CEO / Gründer',
    regex: /CEO|Geschäftsführer|Gründer|Founder|Inhaber|Owner|Chief Exec|Managing Director|Vorstand/i,
  },
  { id: 'cfo', label: 'CFO / Finance', regex: /CFO|Finance|Finanz|Controller|Accounting|Treasury/i },
  {
    id: 'ops',
    label: 'Head of Ops',
    regex: /Head of Op|Operations|COO|Logistik|Lager|Supply|Fulfillment|Warehouse/i,
  },
  { id: 'marketing', label: 'Marketing', regex: /Marketing|CMO|Growth|Brand|Communication|Content/i },
  { id: 'sales', label: 'Sales', regex: /Sales|Vertrieb|Business Dev|BD|Account Exec|Revenue/i },
  { id: 'tech', label: 'CTO / Engineering', regex: /CTO|Tech|Engineering|Develop|IT|Software|Architect/i },
  { id: 'product', label: 'Product / Design', regex: /Product|Design|UX|UI|Creative/i },
  { id: 'purchase', label: 'Purchasing', regex: /Einkauf|Purchas|Procure|Buyer/i },
];

export function matchRole(title: string | null, role: Role | null): boolean {
  if (!role || !title) return true;
  return role.regex.test(title);
}

export function filterByRoleAndFreetext(persons: ApolloPerson[], role: Role | null, freetext: string): ApolloPerson[] {
  const ft = freetext.trim().toLowerCase();
  return persons.filter((p) => {
    const title = p.title || p.raw_apollo_person?.title || '';
    if (role && !matchRole(title as string, role)) return false;
    if (ft && !(title as string).toLowerCase().includes(ft)) return false;
    return true;
  });
}
