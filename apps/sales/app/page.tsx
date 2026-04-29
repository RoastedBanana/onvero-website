import { AgentArchitectureSection } from '@/components/AgentArchitectureSection';
import { ConnectionsSection } from '@/components/ConnectionsSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HeroSection } from '@/components/HeroSection';

export default function Page() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <AgentArchitectureSection />
      <ConnectionsSection />
    </main>
  );
}
