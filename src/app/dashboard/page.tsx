"use client";

import { Navigation, MobileNav } from '@/components/Navigation';
import { useLuminaStore } from '@/app/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Play, Calendar, TrendingUp, Files, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { FlashcardGenerator } from '@/components/FlashcardGenerator';
import { useState } from 'react';

const mockData = [
  { name: 'Mon', count: 12 },
  { name: 'Tue', count: 18 },
  { name: 'Wed', count: 25 },
  { name: 'Thu', count: 20 },
  { name: 'Fri', count: 35 },
  { name: 'Sat', count: 42 },
  { name: 'Sun', count: 30 },
];

export default function Dashboard() {
  const { decks, cards } = useLuminaStore();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const totalReviews = cards.length;
  const masteryAvg = cards.length > 0 
    ? Math.round(cards.reduce((acc, card) => acc + card.masteryLevel, 0) / cards.length) 
    : 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline">Welcome back!</h1>
              <p className="text-muted-foreground">Here's your study overview for today.</p>
            </div>
            <Button 
              onClick={() => setIsGeneratorOpen(true)}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              New Deck from PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              icon={<Files className="w-5 h-5 text-primary" />} 
              label="Active Decks" 
              value={decks.length.toString()} 
              change="+2 this week"
            />
            <StatsCard 
              icon={<BookOpen className="w-5 h-5 text-accent" />} 
              label="Total Cards" 
              value={cards.length.toString()} 
              change="Ready for review"
            />
            <StatsCard 
              icon={<TrendingUp className="w-5 h-5 text-primary" />} 
              label="Average Mastery" 
              value={`${masteryAvg}%`} 
              change="Learning streak: 5d"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="notion-card p-0">
              <CardHeader className="p-6">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Learning Activity
                </CardTitle>
                <CardDescription>Cards reviewed per day</CardDescription>
              </CardHeader>
              <CardContent className="h-64 px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold">Your Decks</h2>
                <Link href="/decks" className="text-sm text-primary hover:underline font-medium">View All</Link>
              </div>
              <div className="space-y-4">
                {decks.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground mb-4">No decks yet. Upload a PDF to start.</p>
                    <Button variant="outline" onClick={() => setIsGeneratorOpen(true)}>Create First Deck</Button>
                  </div>
                ) : (
                  decks.slice(0, 3).map((deck) => (
                    <Link key={deck.id} href={`/decks/${deck.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-secondary/50 transition-colors mb-4 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Files className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-medium group-hover:text-primary transition-colors">{deck.title}</h3>
                            <p className="text-xs text-muted-foreground">{deck.cardCount} cards</p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FlashcardGenerator 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)} 
      />
      <MobileNav />
    </div>
  );
}

function StatsCard({ icon, label, value, change }: { icon: React.ReactNode, label: string, value: string, change: string }) {
  return (
    <Card className="notion-card">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-primary font-medium">{change}</p>
        </div>
        <div className="p-2 bg-background border border-border rounded-lg">
          {icon}
        </div>
      </div>
    </Card>
  );
}