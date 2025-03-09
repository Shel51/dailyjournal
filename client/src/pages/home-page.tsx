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
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-lora mb-4">Unspoken Words</h1>
          <p className="text-lg md:text-xl font-merriweather text-muted-foreground mb-6 md:mb-8 leading-[1.8]">
            There are moments that slip through our fingers like grains of sand—unnoticed, unspoken. And then there are reflections that linger, refusing to fade into the hum of routine. Here, I pause. I listen and give them a place to rest.
          </p>
          {user?.isAdmin && (
            <Button asChild className="bg-primary hover:bg-primary/90 text-xl md:text-2xl font-bold p-3 md:p-4 rounded-lg">
              <Link href="/today">
                <PencilLine className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                Today's thought
              </Link>
            </Button>
          )}
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
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