"use client";

import { Navigation, MobileNav } from '@/components/Navigation';
import { useLuminaStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreVertical, Trash2, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { FlashcardGenerator } from '@/components/FlashcardGenerator';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DeckLibrary() {
  const { decks, deleteDeck } = useLuminaStore();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredDecks = decks.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline">Study Library</h1>
              <p className="text-muted-foreground">Manage your collections and start review sessions.</p>
            </div>
            <Button 
              onClick={() => setIsGeneratorOpen(true)}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Deck
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search your decks..." 
              className="pl-10 bg-card/50 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck) => (
              <div key={deck.id} className="notion-card group relative">
                <div className="absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => deleteDeck(deck.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Deck
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Link href={`/decks/${deck.id}`}>
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{deck.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{deck.description}</p>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {new Date(deck.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-primary font-bold uppercase tracking-widest">
                        {deck.cardCount} Cards
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-secondary text-foreground hover:bg-secondary/80 study-button">
                      Study Now
                    </Button>
                  </div>
                </Link>
              </div>
            ))}

            {filteredDecks.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-card/20 rounded-2xl border border-dashed border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No decks found</h3>
                  <p className="text-sm text-muted-foreground">Try creating a new one from your study materials.</p>
                </div>
                <Button variant="outline" onClick={() => setIsGeneratorOpen(true)}>Generate Cards</Button>
              </div>
            )}
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