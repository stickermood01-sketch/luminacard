"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { generateFlashcardsFromPdf } from '@/ai/flows/generate-flashcards-from-pdf';
import { useLuminaStore, Flashcard } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export function FlashcardGenerator({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState('');
  const [topic, setTopic] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const { addDeck, addCards } = useLuminaStore();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!pdfText || !deckTitle) {
      toast({
        title: "Missing fields",
        description: "Please provide both PDF content and a deck title.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateFlashcardsFromPdf({
        pdfTextContent: pdfText,
        topic: topic || undefined,
        numberOfFlashcards: 10
      });

      const deckId = uuidv4();
      
      const newDeck = {
        id: deckId,
        title: deckTitle,
        description: topic || "Generated from PDF",
        createdAt: new Date().toISOString(),
        cardCount: result.flashcards.length
      };

      const newCards: Flashcard[] = result.flashcards.map(c => ({
        id: uuidv4(),
        front: c.front,
        back: c.back,
        deckId: deckId,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
        masteryLevel: 0
      }));

      addDeck(newDeck);
      addCards(newCards);

      toast({
        title: "Success!",
        description: `Generated ${result.flashcards.length} flashcards for your new deck.`,
      });

      onClose();
      setPdfText('');
      setTopic('');
      setDeckTitle('');
    } catch (error) {
      console.error(error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your flashcards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create AI Flashcards
          </DialogTitle>
          <DialogDescription>
            Paste your notes or PDF text below and our AI will extract the most important concepts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deckTitle">Deck Title</Label>
            <Input 
              id="deckTitle" 
              placeholder="e.g. Biology Exam - Ch. 4" 
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pdfText">PDF Content / Study Material</Label>
            <Textarea 
              id="pdfText" 
              placeholder="Paste the text from your PDF here..." 
              className="min-h-[150px] bg-background resize-none"
              value={pdfText}
              onChange={(e) => setPdfText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Specific Focus (Optional)</Label>
            <Input 
              id="topic" 
              placeholder="e.g. Focus on definitions only" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-xs text-muted-foreground border border-primary/10">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            <span>Gemini AI works best when you paste concise text sections (under 5000 words).</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Generate Cards'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}