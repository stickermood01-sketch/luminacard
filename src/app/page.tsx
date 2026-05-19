import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl w-full space-y-8 relative z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          Powered by Gemini 2.5 Flash
        </div>

        <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter text-foreground">
          Study smarter with <span className="text-primary italic">AI</span>
        </h1>
        
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          LuminaCard transforms your PDFs into high-quality flashcards using advanced AI. Optimize your learning with intelligent spaced repetition.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 text-lg font-medium bg-primary hover:bg-primary/90 gap-2">
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-border hover:bg-secondary">
            View Live Demo
          </Button>
        </div>

        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Brain className="w-6 h-6 text-primary" />} 
            title="AI Extraction" 
            desc="Automatically generate cards from complex research papers and PDFs." 
          />
          <FeatureCard 
            icon={<Clock className="w-6 h-6 text-accent" />} 
            title="Spaced Repetition" 
            desc="Algorithmically timed reviews to maximize long-term retention." 
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-primary" />} 
            title="Cloud Sync" 
            desc="Your library and progress synced across all devices instantly." 
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card/50 text-left space-y-3 hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-border">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}