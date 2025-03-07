import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div
        className="h-screen bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1526280760714-f9e8b26f318f')`,
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl font-bold mb-6">
              Share Your Thoughts with the World
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              A minimal journaling platform for sharing your daily thoughts,
              reflections, and experiences with a community of readers.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/feed">Read Journals</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
