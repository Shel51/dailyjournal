import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

type JournalCardProps = {
  journal: Journal;
  commentsCount: number;
  onLike: () => void;
};

export function JournalCard({ journal, commentsCount, onLike }: JournalCardProps) {
  const [_, navigate] = useLocation();

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-0 shadow-none hover:bg-accent/5"
      onClick={() => navigate(`/journal/${journal.id}`)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-serif">{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(journal.createdAt), "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-base text-muted-foreground leading-relaxed mb-6">
          {journal.content}
        </p>

        {journal.imageUrl && (
          <img
            src={journal.imageUrl}
            alt={journal.title}
            className="w-full aspect-video object-cover rounded-md mb-6"
          />
        )}

        <div className="flex items-center gap-6 text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Heart className="h-5 w-5" />
            <span>{journal.likeCount}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-5 w-5" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}