"use client";

export function AuroraBlobs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Purple blob - top left */}
      <div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "800px",
          maxHeight: "800px",
          background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)",
          top: "-15%",
          left: "-10%",
          filter: "blur(80px)",
          animation: "blob-move-1 15s ease-in-out infinite",
        }}
      />
      {/* Blue blob - top right */}
      <div
        className="absolute rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          maxWidth: "700px",
          maxHeight: "700px",
          background: "radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.1) 40%, transparent 70%)",
          top: "5%",
          right: "-15%",
          filter: "blur(80px)",
          animation: "blob-move-2 18s ease-in-out infinite",
        }}
      />
      {/* Pink blob - bottom center */}
      <div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: "850px",
          maxHeight: "850px",
          background: "radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(236,72,153,0.1) 40%, transparent 70%)",
          bottom: "-20%",
          left: "20%",
          filter: "blur(80px)",
          animation: "blob-move-3 20s ease-in-out infinite",
        }}
      />
      {/* Cyan accent blob - center */}
      <div
        className="absolute rounded-full"
        style={{
          width: "30vw",
          height: "30vw",
          maxWidth: "500px",
          maxHeight: "500px",
          background: "radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 60%)",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(80px)",
          animation: "blob-move-4 12s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes blob-move-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(120px, 60px) scale(1.15); }
          66% { transform: translate(-40px, 100px) scale(0.9); }
        }
        @keyframes blob-move-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-100px, 80px) scale(1.1); }
          66% { transform: translate(-60px, -50px) scale(0.95); }
        }
        @keyframes blob-move-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(80px, -70px) scale(1.12); }
          66% { transform: translate(-60px, -40px) scale(0.88); }
        }
        @keyframes blob-move-4 {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) translate(40px, -30px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
