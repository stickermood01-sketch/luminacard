import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  // Spaced Repetition Fields (Simplified SM-2)
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  masteryLevel: number; // 0-100
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  cardCount: number;
}

interface LuminaState {
  decks: Deck[];
  cards: Flashcard[];
  addDeck: (deck: Deck) => void;
  addCards: (newCards: Flashcard[]) => void;
  updateCardProgress: (cardId: string, grade: 1 | 2 | 3 | 4 | 5) => void;
  deleteDeck: (deckId: string) => void;
}

// Simple SM-2 Algorithm implementation
function calculateSM2(grade: number, prevInterval: number, prevEase: number, repetitions: number) {
  let nextInterval: number;
  let nextEase: number;
  let nextRepetitions: number;

  if (grade >= 3) {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(prevInterval * prevEase);
    }
    nextRepetitions = repetitions + 1;
    nextEase = prevEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
    nextEase = prevEase;
  }

  if (nextEase < 1.3) nextEase = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInterval);

  return {
    interval: nextInterval,
    easeFactor: nextEase,
    repetitions: nextRepetitions,
    nextReviewDate: nextDate.toISOString(),
    masteryLevel: Math.min(100, Math.round((nextInterval / 30) * 100)) // Estimate based on 30 days
  };
}

// In a real app with Supabase/Firebase, this would be a server-side store or hooks
// For this demo, we use Zustand with persistence.
import { create as createZustand } from 'zustand';

export const useLuminaStore = createZustand<LuminaState>()(
  persist(
    (set) => ({
      decks: [],
      cards: [],
      addDeck: (deck) => set((state) => ({ decks: [...state.decks, deck] })),
      addCards: (newCards) => set((state) => ({ cards: [...state.cards, ...newCards] })),
      deleteDeck: (deckId) => set((state) => ({
        decks: state.decks.filter(d => d.id !== deckId),
        cards: state.cards.filter(c => c.deckId !== deckId)
      })),
      updateCardProgress: (cardId, grade) => set((state) => {
        const cardIndex = state.cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return state;

        const card = state.cards[cardIndex];
        const newStats = calculateSM2(grade, card.interval, card.easeFactor, card.repetitions);

        const updatedCards = [...state.cards];
        updatedCards[cardIndex] = { ...card, ...newStats };

        return { cards: updatedCards };
      }),
    }),
    {
      name: 'lumina-card-storage',
    }
  )
);
