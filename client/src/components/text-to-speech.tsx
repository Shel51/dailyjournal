import { useState, useEffect } from "react";
import { Volume2, VolumeX, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TextToSpeechProps {
  text: string;
}

export function TextToSpeech({ text }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => setIsPlaying(false);
    setSpeech(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, rate]);

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
            <span className="hidden sm:inline">Speed</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
