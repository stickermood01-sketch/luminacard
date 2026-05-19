"use client";

import { useParams, useRouter } from 'next/navigation';
import { useLuminaStore } from '@/app/lib/store';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, RotateCcw, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function StudySession() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const { cards, decks, updateCardProgress } = useLuminaStore();
  
  const deck = decks.find(d => d.id === deckId);
  const deckCards = useMemo(() => {
    return cards.filter(c => c.deckId === deckId).sort((a, b) => {
      // Prioritize cards with earlier review dates
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    });
  }, [cards, deckId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = deckCards[currentIndex];
  const progress = (currentIndex / deckCards.length) * 100;

  const handleGrade = (grade: 1 | 2 | 3 | 4 | 5) => {
    updateCardProgress(currentCard.id, grade);
    setIsFlipped(false);
    
    if (currentIndex < deckCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (!deck || deckCards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">No cards to study in this deck!</h2>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">You've finished your review for this deck. Keep up the good work to build long-term memory.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Dashboard</Button>
          <Button onClick={() => window.location.reload()}>Review Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
      {/* Header */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <X className="w-6 h-6" />
        </Button>
        <div className="flex flex-col items-center flex-1">
          <span className="text-sm font-medium">{deck.title}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Card {currentIndex + 1} of {deckCards.length}
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-2xl w-full mx-auto mb-6">
        <Progress value={progress} className="h-1" />
      </div>

      {/* Card Interface */}
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col justify-center gap-8">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            "relative w-full aspect-[4/3] md:aspect-[3/2] cursor-pointer transition-all duration-500 preserve-3d group perspective-1000",
            isFlipped ? "rotate-y-180" : ""
          )}
        >
          {/* Front */}
          <div className={cn(
            "absolute inset-0 bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl backface-hidden",
            isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
          )}>
            <div className="absolute top-6 left-6 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Question</div>
            <h2 className="text-2xl md:text-3xl font-medium leading-tight">{currentCard.front}</h2>
            <div className="mt-12 text-muted-foreground flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" />
              Click to flip
            </div>
          </div>

          {/* Back */}
          <div className={cn(
            "absolute inset-0 bg-secondary/30 border border-primary/20 backdrop-blur-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden rotate-y-180",
            !isFlipped ? "pointer-events-none opacity-0" : "opacity-100"
          )}>
            <div className="absolute top-6 left-6 text-[10px] font-bold text-primary tracking-widest uppercase">Answer</div>
            <p className="text-xl md:text-2xl leading-relaxed text-foreground/90">{currentCard.back}</p>
          </div>
        </div>

        {/* Grading Controls */}
        <div className={cn(
          "grid grid-cols-4 gap-3 transition-all duration-300",
          isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}>
          <GradeButton color="bg-red-500/20 text-red-400 border-red-500/30" label="Again" onClick={() => handleGrade(1)} />
          <GradeButton color="bg-orange-500/20 text-orange-400 border-orange-500/30" label="Hard" onClick={() => handleGrade(2)} />
          <GradeButton color="bg-blue-500/20 text-blue-400 border-blue-500/30" label="Good" onClick={() => handleGrade(3)} />
          <GradeButton color="bg-green-500/20 text-green-400 border-green-500/30" label="Easy" onClick={() => handleGrade(5)} />
        </div>

        {!isFlipped && (
          <div className="text-center text-muted-foreground text-sm animate-pulse">
            Press Space or Click to reveal answer
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-2xl w-full mx-auto mt-8 flex justify-center gap-8 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
        <span>Interval: {currentCard.interval} days</span>
        <span>Ease: {currentCard.easeFactor.toFixed(1)}</span>
        <span>Reps: {currentCard.repetitions}</span>
      </div>
    </div>
  );
}

function GradeButton({ color, label, onClick }: { color: string, label: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn("h-16 flex flex-col items-center justify-center border hover:border-white/20 transition-all", color)}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className="text-[10px] opacity-60">Study</span>
    </Button>
  );
}
