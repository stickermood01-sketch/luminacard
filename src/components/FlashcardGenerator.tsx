"use client";

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, AlertCircle, Upload, X, FileCheck, CheckCircle2 } from 'lucide-react';
import { generateFlashcardsFromPdf } from '@/ai/flows/generate-flashcards-from-pdf';
import { useLuminaStore, Flashcard } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPdf } from '@/lib/pdf-utils';
import { cn } from '@/lib/utils';

type GenerationStep = 'idle' | 'extracting' | 'generating' | 'success';

export function FlashcardGenerator({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState<GenerationStep>('idle');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addDeck, addCards, cards } = useLuminaStore();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      if (!deckTitle) {
        setDeckTitle(file.name.replace('.pdf', ''));
      }
      
      setStep('extracting');
      try {
        const text = await extractTextFromPdf(file);
        setContent(text);
        setStep('idle');
        toast({
          title: "PDF processado",
          description: `${file.name} foi lido com sucesso.`,
        });
      } catch (error: any) {
        toast({
          title: "Falha na extração",
          description: error.message || "Não foi possível ler o conteúdo do PDF.",
          variant: "destructive"
        });
        setPdfFile(null);
        setStep('idle');
      }
    }
  };

  const resetForm = () => {
    setPdfFile(null);
    setContent('');
    setTopic('');
    setDeckTitle('');
    setStep('idle');
  };

  const handleGenerate = async () => {
    if (!deckTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, dê um nome ao seu novo deck.",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Conteúdo ausente",
        description: "O conteúdo para estudo está vazio. Faça o upload de um PDF ou cole seu texto.",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');
    try {
      // Get all current questions to avoid duplicates
      const existingQuestions = cards.map(c => c.front);

      const result = await generateFlashcardsFromPdf({
        pdfTextContent: content,
        topic: topic.trim() || undefined,
        numberOfFlashcards: 10,
        existingQuestions: existingQuestions
      });

      if (!result.flashcards || result.flashcards.length === 0) {
        throw new Error("A IA não retornou nenhum flashcard único. Tente fornecer mais material.");
      }

      const deckId = uuidv4();
      
      const newDeck = {
        id: deckId,
        title: deckTitle.trim(),
        description: topic.trim() || "Gerado automaticamente a partir do material de estudo",
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

      setStep('success');
      
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Erro na geração",
        description: error.message || "Ocorreu um problema ao gerar seus flashcards.",
        variant: "destructive"
      });
      setStep('idle');
    }
  };

  const isProcessing = step === 'extracting' || step === 'generating';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) onClose();
    }}>
      <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl overflow-hidden">
        {step === 'success' ? (
          <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">Deck Criado!</h2>
            <p className="text-muted-foreground mt-2">Seus flashcards únicos com IA estão prontos.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Gerar Flashcards com IA
              </DialogTitle>
              <DialogDescription>
                Faça o upload de um PDF ou cole suas anotações para análise dinâmica do Gemini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="deckTitle">Título do Deck</Label>
                <Input 
                  id="deckTitle" 
                  placeholder="Ex: Resumo de História" 
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="bg-background"
                  disabled={isProcessing}
                />
              </div>

              {!pdfFile && (
                <div 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group",
                    isProcessing && "pointer-events-none opacity-50"
                  )}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf" 
                    onChange={handleFileChange}
                  />
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Clique para enviar PDF</p>
                    <p className="text-xs text-muted-foreground">O texto será extraído automaticamente</p>
                  </div>
                </div>
              )}

              {pdfFile && step !== 'extracting' && (
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate max-w-[200px]">{pdfFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">PDF carregado ({content.length} caracteres)</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetForm} disabled={isProcessing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {step === 'extracting' && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 bg-secondary/20 rounded-xl animate-pulse">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm font-medium">Extraindo texto do PDF...</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo para Estudo</Label>
                <Textarea 
                  id="content" 
                  placeholder="O texto extraído do PDF aparecerá aqui ou você pode colar manualmente..." 
                  className="min-h-[120px] bg-background resize-none text-xs"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Tópico de Foco (Opcional)</Label>
                <Input 
                  id="topic" 
                  placeholder="Ex: Focar em fórmulas matemáticas" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-background"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-[10px] text-muted-foreground border border-primary/10">
                <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>O Gemini garantirá que nenhum cartão seja repetido e criará um mix de dificuldades.</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isProcessing || !content.trim() || !deckTitle.trim()}
                className="bg-primary hover:bg-primary/90 min-w-[140px] gap-2"
              >
                {step === 'generating' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando Unicidade...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Flashcards
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
