import { useState, useEffect } from "react";
import { Volume2, VolumeX, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TextToSpeechProps {
  text: string;
}

export function TextToSpeech({ text }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  // Initialize and update available voices
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Try to find a good female voice
      const preferredVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        voice.name.toLowerCase().includes('female')
      );

      // Set default voice preference
      if (preferredVoices.length > 0) {
        setSelectedVoice(preferredVoices[0]);
      } else if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = () => setIsPlaying(false);
    setSpeech(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, rate, selectedVoice]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (speech) {
        window.speechSynthesis.speak(speech);
        setIsPlaying(true);
      }
    }
  };

  const speeds = [
    { label: "Slow (0.8x)", value: 0.8 },
    { label: "Normal (1x)", value: 1 },
    { label: "Fast (1.2x)", value: 1.2 },
  ];

  const changeSpeed = (newRate: number) => {
    setRate(newRate);
    if (speech) {
      speech.rate = newRate;
      if (isPlaying) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(speech);
      }
    }
  };

  const changeVoice = (voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className={`gap-2 text-muted-foreground hover:text-foreground ${
          isPlaying ? "text-primary" : ""
        }`}
      >
        {isPlaying ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isPlaying ? "Stop Reading" : "Read Aloud"}
        </span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          <DropdownMenuLabel>Voice Selection</DropdownMenuLabel>
          {availableVoices.map((voice) => (
            <DropdownMenuItem
              key={voice.name}
              onClick={() => changeVoice(voice)}
              className={selectedVoice?.name === voice.name ? "bg-muted" : ""}
            >
              {voice.name}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Reading Speed</DropdownMenuLabel>
          {speeds.map((speed) => (
            <DropdownMenuItem
              key={speed.value}
              onClick={() => changeSpeed(speed.value)}
              className={rate === speed.value ? "bg-muted" : ""}
            >
              {speed.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}