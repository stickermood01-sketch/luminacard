"use client";

import { useParams, useRouter } from 'next/navigation';
import { Navigation, MobileNav } from '@/components/Navigation';
import { useLuminaStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Play, LayoutGrid, List, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DeckDetail() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const { decks, cards } = useLuminaStore();

  const deck = decks.find(d => d.id === deckId);
  const deckCards = cards.filter(c => c.deckId === deckId);

  if (!deck) {
    return <div>Deck not found</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          
          <Button 
            variant="ghost" 
            className="gap-2 -ml-2 text-muted-foreground" 
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Library
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </div>
              <h1 className="text-4xl font-bold font-headline">{deck.title}</h1>
              <p className="text-muted-foreground max-w-2xl">{deck.description}</p>
            </div>
            <Link href={`/study/${deck.id}`}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 h-14 px-8 gap-3 text-lg font-medium shadow-lg shadow-primary/20">
                <Play className="w-5 h-5 fill-current" />
                Start Session
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard label="Mastery" value="0%" sub="New Deck" />
            <MetricCard label="Cards" value={deckCards.length.toString()} sub="Total count" />
            <MetricCard label="Due Today" value={deckCards.length.toString()} sub="Scheduled reviews" />
          </div>

          <Tabs defaultValue="list" className="w-full pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Card List</h2>
              <TabsList className="bg-secondary">
                <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" /> List</TabsTrigger>
                <TabsTrigger value="grid" className="gap-2"><LayoutGrid className="w-4 h-4" /> Grid</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-3">
              {deckCards.map((card) => (
                <div key={card.id} className="p-4 rounded-xl border border-border bg-card/50 flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{card.front}</p>
                    <p className="text-sm text-muted-foreground mt-1">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Lvl {card.masteryLevel}%</span>
                    <span className="px-2 py-1 rounded bg-secondary text-foreground">New</span>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deckCards.map((card) => (
                <div key={card.id} className="p-6 rounded-xl border border-border bg-card/50 min-h-[160px] flex flex-col justify-center text-center">
                  <p className="font-medium">{card.front}</p>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">{card.back}</p>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card flex flex-col items-center justify-center text-center space-y-1">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  );
}