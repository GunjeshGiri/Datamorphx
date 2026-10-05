import Workbench from '@/components/Workbench';

export default function Home() {
  return (
    // Fill the viewport below the 3.5rem (h-14) sticky navbar; footer sits below the fold.
    <main className="h-[calc(100dvh-3.5rem)] min-h-[600px]">
      <Workbench />
    </main>
  );
}
