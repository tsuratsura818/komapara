import { WorkFeed } from "@/components/works/WorkFeed";

export default function HomePage() {
  return (
    <>
      {/* Hero banner */}
      <section className="relative overflow-hidden bg-gradient-main px-4 py-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">
            4コマの世界を、もっと楽しく
          </h1>
          <p className="text-white/80 text-sm mt-2">
            お気に入りの4コマ漫画を見つけて、作家をフォローしよう
          </p>
        </div>
        {/* Decorative floating elements */}
        <div className="absolute top-2 right-4 w-16 h-16 bg-white/10 rounded-lg rotate-12 animate-float" />
        <div
          className="absolute bottom-2 right-16 w-12 h-12 bg-white/10 rounded-lg -rotate-6 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-4 right-36 w-8 h-8 bg-white/5 rounded-lg rotate-45 animate-float"
          style={{ animationDelay: "2s" }}
        />
      </section>
      <WorkFeed />
    </>
  );
}
