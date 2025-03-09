import { useAuth } from "@/hooks/use-auth";
import { JournalEditor } from "@/components/journal-editor";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { type InsertJournal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewEntry() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const isToday = location === "/today";

  const createMutation = useMutation({
    mutationFn: async (data: InsertJournal) => {
      await apiRequest("POST", "/api/journals", data);
    },
    onSuccess: () => {
      // Invalidate both the journal list queries
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journals/search"] });
      setLocation("/");
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-serif">
            {isToday ? "Today's Thoughts" : "New Journal Entry"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JournalEditor 
            onSubmit={async (data) => await createMutation.mutateAsync(data)} 
          />
        </CardContent>
      </Card>
    </div>
  );
}