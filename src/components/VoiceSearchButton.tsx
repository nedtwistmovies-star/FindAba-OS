import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  buttonSize?: number;
  iconSize?: number;
  placeholderPrompt?: string;
}

// Browser SpeechRecognition interface
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = '',
  buttonSize = 36,
  iconSize = 16,
  placeholderPrompt = 'Listening for Aba products, markets or artisans...'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-NG'; // Prioritize Nigerian English for local Aba names

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim().length > 0) {
          const cleanedText = transcript.trim();
          onTranscript(cleanedText);
          addToast(`Voice search: "${cleanedText}"`, 'info');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          addToast('Microphone access denied. Please allow microphone permissions.', 'error');
        } else if (event.error === 'no-speech') {
          addToast('No voice detected. Please try speaking again.', 'info');
        } else if (event.error !== 'aborted') {
          addToast(`Voice search error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to initialize speech recognition:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [onTranscript, addToast]);

  const toggleListening = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported || !recognitionRef.current) {
      addToast('Voice search is not supported in this browser. Please use Chrome, Edge, or Safari.', 'info');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        addToast('Listening... Speak a product or market name (e.g., "Ariaria leather", "Bakassi fabrics")', 'info');
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        // Sometimes recognition needs re-instantiating if previously aborted
        try {
          const win = window as unknown as IWindow;
          const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
          if (SpeechRecognitionClass) {
            recognitionRef.current = new SpeechRecognitionClass();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-NG';
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results?.[0]?.[0]?.transcript;
              if (transcript && transcript.trim().length > 0) {
                onTranscript(transcript.trim());
                addToast(`Voice search: "${transcript.trim()}"`, 'info');
              }
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.start();
          }
        } catch (retryErr) {
          addToast('Could not access microphone for voice search.', 'error');
        }
      }
    }
  }, [isSupported, isListening, addToast, onTranscript]);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id="voice-search-button"
        onClick={toggleListening}
        title={isListening ? "Listening... click to stop" : "Search with voice (Web Speech API)"}
        className={`relative flex items-center justify-center rounded-xl transition-all duration-300 active:scale-90 ${
          isListening
            ? 'bg-aba-red text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
            : 'text-white/40 hover:text-aba-gold hover:bg-white/10'
        } ${className}`}
        style={{ width: buttonSize, height: buttonSize }}
        aria-label="Voice Search"
      >
        {isListening ? (
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-aba-red/40 animate-ping" />
            <Mic size={iconSize} className="relative z-10 text-white animate-bounce" />
          </div>
        ) : (
          <Mic size={iconSize} className="transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Floating recording pill when actively listening */}
      {isListening && (
        <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-aba-deep/95 border border-aba-red/40 backdrop-blur-xl px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 pointer-events-none animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-aba-red animate-ping shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-aba-red">
            Listening...
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchButton;
