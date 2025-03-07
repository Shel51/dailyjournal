import { type Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useLocation, NavigateFunction } from "wouter";

type JournalCardProps = {
  journal: Journal;
  commentsCount: number;
  onLike: () => void;
};

export function JournalCard({ journal, commentsCount, onLike }: JournalCardProps) {
  const [_, navigate] = useLocation() as [string, NavigateFunction];

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/journal/${journal.id}`)}
    >
      <CardHeader>
        <CardTitle>{journal.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(new Date(journal.createdAt), "MMMM d, yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm mb-4">{journal.content}</p>

        {journal.imageUrl && (
          <img
            src={journal.imageUrl}
            alt={journal.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}

        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onLike}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span>{journal.likeCount}</span>
          </button>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}