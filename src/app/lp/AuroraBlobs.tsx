"use client";

export function AuroraBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "700px",
          maxHeight: "700px",
          background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)",
          top: "-10%",
          left: "-5%",
          animation: "blob-move-1 15s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: "600px",
          maxHeight: "600px",
          background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)",
          top: "10%",
          right: "-10%",
          animation: "blob-move-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "45vw",
          height: "45vw",
          maxWidth: "650px",
          maxHeight: "650px",
          background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)",
          bottom: "-15%",
          left: "25%",
          animation: "blob-move-3 20s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes blob-move-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, 50px) scale(1.15); }
          66% { transform: translate(-30px, 80px) scale(0.9); }
        }
        @keyframes blob-move-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 70px) scale(1.1); }
          66% { transform: translate(-50px, -40px) scale(0.95); }
        }
        @keyframes blob-move-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -60px) scale(1.12); }
          66% { transform: translate(-50px, -30px) scale(0.88); }
        }
      `}</style>
    </div>
  );
}
