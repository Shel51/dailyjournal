import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type JournalCardProps = {
  journal: Journal & { hasLiked: boolean };
  commentsCount: number;
};

export function JournalCard({ journal, commentsCount }: JournalCardProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [localLikeCount, setLocalLikeCount] = useState(journal.likeCount);
  const [localHasLiked, setLocalHasLiked] = useState(journal.hasLiked);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/journals/${journal.id}/like`);
      return res.json();
    },
    onSuccess: (data) => {
      setLocalLikeCount(data.likeCount);
      setLocalHasLiked(true);

      // Update the cache immediately
      queryClient.setQueryData(["/api/journals"], (old: any) => {
        if (!old) return old;
        return old.map((j: Journal) => 
          j.id === journal.id 
            ? { ...j, likeCount: data.likeCount, hasLiked: true }
            : j
        );
      });

      // Also update the individual journal cache if it exists
      queryClient.setQueryData([`/api/journals/${journal.id}`], (old: any) => {
        if (!old) return old;
        return { ...old, likeCount: data.likeCount, hasLiked: true };
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like the journal entry",
        variant: "destructive",
      });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!likeMutation.isPending) {
      likeMutation.mutate();
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-border/50 bg-gradient-to-b from-background/50 to-background hover:from-background/80 hover:to-background"
      onClick={() => navigate(`/journal/${journal.id}`)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-xl md:text-2xl font-serif tracking-tight">{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground/80 font-medium">
          {format(new Date(journal.createdAt), "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm md:text-base text-muted-foreground/90 leading-relaxed mb-6 font-normal">
          {journal.content}
        </p>

        {journal.imageUrl && (
          <div className="mb-6 overflow-hidden rounded-lg">
            <img
              src={journal.imageUrl}
              alt={journal.title}
              className="w-full aspect-square object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground/70" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              localHasLiked ? 'text-red-500' : 'hover:text-red-500'
            }`}
            disabled={likeMutation.isPending}
          >
            <Heart 
              className={`h-5 w-5 transition-all duration-300 ${likeMutation.isPending ? 'animate-pulse' : ''} ${
                localHasLiked ? 'scale-110' : 'scale-100'
              }`}
              fill={localHasLiked ? "currentColor" : "none"}
              stroke={localHasLiked ? "none" : "currentColor"}
            />
            <span className="font-medium">{localLikeCount}</span>
          </button>

          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{commentsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}