You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
cybernetic-bento-grid.tsx
import React, { useEffect, useRef } from 'react';

// Reusable BentoItem component
const BentoItem = ({ className, children }) => {
    const itemRef = useRef(null);

    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const handleMouseMove = (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            item.style.setProperty('--mouse-x', `${x}px`);
            item.style.setProperty('--mouse-y', `${y}px`);
        };

        item.addEventListener('mousemove', handleMouseMove);

        return () => {
            item.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div ref={itemRef} className={`bento-item ${className}`}>
            {children}
        </div>
    );
};

// Main Component
export const CyberneticBentoGrid = () => {
    return (
        <div className="main-container">
            <div className="w-full max-w-6xl z-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8">Core Features</h1>
                <div className="bento-grid">
                    <BentoItem className="col-span-2 row-span-2 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Real-time Analytics</h2>
                            <p className="mt-2 text-gray-400">Monitor your application's performance with up-to-the-second data streams and visualizations.</p>
                        </div>
                        <div className="mt-4 h-48 bg-neutral-800 rounded-lg flex items-center justify-center text-gray-500">
                            Chart Placeholder
                        </div>
                    </BentoItem>
                    <BentoItem>
                        <h2 className="text-xl font-bold text-white">Global CDN</h2>
                        <p className="mt-2 text-gray-400 text-sm">Deliver content at lightning speed, no matter where your users are.</p>
                    </BentoItem>
                    <BentoItem>
                        <h2 className="text-xl font-bold text-white">Secure Auth</h2>
                        <p className="mt-2 text-gray-400 text-sm">Enterprise-grade authentication and user management built-in.</p>
                    </BentoItem>
                    <BentoItem className="row-span-2">
                        <h2 className="text-xl font-bold text-white">Automated Backups</h2>
                        <p className="mt-2 text-gray-400 text-sm">Your data is always safe with automated, redundant backups.</p>
                    </BentoItem>
                    <BentoItem className="col-span-2">
                        <h2 className="text-xl font-bold text-white">Serverless Functions</h2>
                        <p className="mt-2 text-gray-400 text-sm">Run your backend code without managing servers. Scale infinitely with ease.</p>
                    </BentoItem>
                    <BentoItem>
                        <h2 className="text-xl font-bold text-white">CLI Tool</h2>
                        <p className="mt-2 text-gray-400 text-sm">Manage your entire infrastructure from the command line.</p>
                    </BentoItem>
                </div>
            </div>
        </div>
    );
};


demo.tsx
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";

export default function DemoOne() {
  return  <div className="App">
      <CyberneticBentoGrid />
    </div>
}

```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
