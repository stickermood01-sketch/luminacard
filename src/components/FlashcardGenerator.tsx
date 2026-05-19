
"use client";

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Sparkles, AlertCircle, Upload, X, FileCheck, CheckCircle2 } from 'lucide-react';
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
  const [pdfText, setPdfText] = useState('');
  const [topic, setTopic] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addDeck, addCards } = useLuminaStore();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      // Se o título estiver vazio, usa o nome do arquivo
      if (!deckTitle) {
        setDeckTitle(file.name.replace('.pdf', ''));
      }
      
      setStep('extracting');
      try {
        const text = await extractTextFromPdf(file);
        setPdfText(text);
        setStep('idle');
        toast({
          title: "PDF processado",
          description: `${file.name} foi lido com sucesso.`,
        });
      } catch (error: any) {
        console.error('PDF extraction failed:', error);
        toast({
          title: "Falha na extração",
          description: error.message || "Não foi possível ler o conteúdo do PDF. Tente colar o texto manualmente.",
          variant: "destructive"
        });
        setPdfFile(null); // Reseta se falhar
        setStep('idle');
      }
    } else if (file) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, envie um arquivo PDF.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setPdfFile(null);
    setPdfText('');
    setTopic('');
    setDeckTitle('');
    setStep('idle');
  };

  const handleGenerate = async () => {
    // Validação rigorosa
    if (!deckTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, dê um nome ao seu novo deck.",
        variant: "destructive"
      });
      return;
    }

    if (!pdfText.trim()) {
      toast({
        title: "Conteúdo ausente",
        description: "Por favor, faça upload de um PDF ou cole o texto do seu estudo.",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');
    try {
      const result = await generateFlashcardsFromPdf({
        pdfTextContent: pdfText,
        topic: topic.trim() || undefined,
        numberOfFlashcards: 10
      });

      if (!result.flashcards || result.flashcards.length === 0) {
        throw new Error("A IA não retornou nenhum flashcard. Tente fornecer mais contexto.");
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
      }, 2000);

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro na geração",
        description: error.message || "Ocorreu um problema ao gerar seus flashcards. Tente novamente.",
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
            <p className="text-muted-foreground mt-2">Seus flashcards com IA estão prontos para estudo.</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Gerar Flashcards com IA
              </DialogTitle>
              <DialogDescription>
                Faça o upload de um PDF ou cole suas anotações. O Gemini analisará tudo para você.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="deckTitle">Título do Deck</Label>
                <Input 
                  id="deckTitle" 
                  placeholder="Ex: Biologia Marinha - Cap. 2" 
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  className="bg-background"
                  disabled={isProcessing}
                />
              </div>

              {!pdfFile && !pdfText ? (
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
                    <p className="text-xs text-muted-foreground">ou cole o texto manualmente abaixo</p>
                  </div>
                </div>
              ) : pdfFile && step !== 'extracting' ? (
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate max-w-[200px]">{pdfFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">Texto extraído ({pdfText.length} caracteres)</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetForm} disabled={isProcessing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}

              {step === 'extracting' && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 bg-secondary/20 rounded-xl animate-pulse">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm font-medium">Extraindo texto do PDF...</p>
                </div>
              )}

              {(!pdfFile || pdfText) && step !== 'extracting' && (
                <div className="space-y-2">
                  <Label htmlFor="pdfText">Conteúdo para Estudo {pdfFile ? "(Extraído do PDF)" : ""}</Label>
                  <Textarea 
                    id="pdfText" 
                    placeholder="Cole seu texto aqui ou envie um PDF acima..." 
                    className="min-h-[120px] bg-background resize-none text-xs"
                    value={pdfText}
                    onChange={(e) => setPdfText(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="topic">Tópico de Foco (Opcional)</Label>
                <Input 
                  id="topic" 
                  placeholder="Ex: Dê foco em fórmulas químicas" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="bg-background"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg text-[10px] text-muted-foreground border border-primary/10">
                <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>O Gemini criará aproximadamente 10 cartões otimizados para seu aprendizado.</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isProcessing || (!pdfText.trim() && !pdfFile)}
                className="bg-primary hover:bg-primary/90 min-w-[140px] gap-2"
              >
                {step === 'generating' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    IA Processando...
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
