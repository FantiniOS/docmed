"use client";

import * as React from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { toast } from "./toast";

interface SpeechTextareaProps extends React.ComponentProps<"textarea"> {
  onValueChange?: (value: string) => void;
  value?: string;
}

export const SpeechTextarea = React.forwardRef<HTMLTextAreaElement, SpeechTextareaProps>(
  ({ className, onValueChange, value, onChange, ...props }, ref) => {
    const [isListening, setIsListening] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge refs so we can access the textarea value
    const handleRef = React.useCallback(
      (node: HTMLTextAreaElement) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      // Check for browser support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
          }
          
          if (currentTranscript.trim()) {
            const currentValue = textareaRef.current?.value || "";
            const newValue = currentValue
              ? `${currentValue} ${currentTranscript.trim()}`
              : currentTranscript.trim();
            
            // Dispatch synthetic event so react-hook-form picks it up
            if (textareaRef.current) {
              const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
              )?.set;
              
              if (nativeInputValueSetter) {
                nativeInputValueSetter.call(textareaRef.current, newValue);
                const inputEvent = new Event('input', { bubbles: true });
                textareaRef.current.dispatchEvent(inputEvent);
              }
            }
            
            if (onValueChange) {
              onValueChange(newValue);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          if (event.error === "not-allowed") {
            toast.add({
              title: "Permissão negada",
              description: "Por favor, permita o acesso ao microfone no seu navegador.",
              type: "error",
            });
          } else {
            toast.add({
              title: "Erro de gravação",
              description: "Ocorreu um erro ao tentar ouvir sua voz.",
              type: "error",
            });
          }
        };

        recognition.onend = () => {
          // If it was manually stopped, it stays false.
          // If it stopped due to silence, we might want to keep it false.
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }, [onValueChange]);

    const toggleListening = (e: React.MouseEvent) => {
      e.preventDefault();
      
      if (!recognitionRef.current) {
        toast.add({
          title: "Não suportado",
          description: "Seu navegador não suporta ditado por voz. Tente usar o Google Chrome.",
          type: "error",
        });
        return;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error(err);
        }
      }
    };

    return (
      <div className="relative">
        <Textarea
          ref={handleRef}
          value={value}
          onChange={onChange}
          className={cn("pr-12", className)}
          {...props}
        />
        <Button
          type="button"
          size="icon-sm"
          variant={isListening ? "destructive" : "ghost"}
          className={cn(
            "absolute top-2 right-2 h-7 w-7 rounded-md transition-all duration-300",
            isListening ? "animate-pulse shadow-md" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={toggleListening}
          title={isListening ? "Parar ditado" : "Iniciar ditado por voz"}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }
);
SpeechTextarea.displayName = "SpeechTextarea";
