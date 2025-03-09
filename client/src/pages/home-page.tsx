import { useQuery } from "@tanstack/react-query";
import { type Journal } from "@shared/schema";
import { JournalCard } from "@/components/journal-card";
import { Button } from "@/components/ui/button";
import { PencilLine } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const { data: journals = [], isLoading } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/comments"],
  });

  const getCommentCount = (journalId: number) => {
    return comments.filter((comment) => comment.journalId === journalId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">Welcome to My World!</h1>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              There are moments that slip through our fingers like grains of sand—unnoticed, unspoken. And then there are reflections that linger, refusing to fade into the hum of routine.
            </p>
            <p>
              Here, I pause. I listen. I gather the quiet whispers of the day—the fleeting, the profound, the in-between—and give them a place to rest.
            </p>
            <p>
              Perhaps, in these words, you will find a glimpse of your own thoughts, a quiet resonance in the rhythm of life.
            </p>
          </div>
          {user?.isAdmin && (
            <Button asChild className="bg-primary hover:bg-primary/90 text-2xl font-bold p-4 rounded-lg mt-8">
              <Link href="/today">
                <PencilLine className="mr-2 h-6 w-6" />
                Today's thought
              </Link>
            </Button>
          )}
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {journals.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              commentsCount={getCommentCount(journal.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}