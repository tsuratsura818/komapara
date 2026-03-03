"use client";

export function AuroraBlobs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Slow-moving gradient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
          top: "-10%",
          left: "-5%",
          animation: "blob-move-1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
          top: "10%",
          right: "-10%",
          animation: "blob-move-2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[550px] h-[550px] rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)",
          bottom: "-5%",
          left: "30%",
          animation: "blob-move-3 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15 blur-[80px]"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
          top: "40%",
          left: "10%",
          animation: "blob-move-4 18s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes blob-move-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, 40px) scale(1.1); }
          50% { transform: translate(40px, 80px) scale(0.95); }
          75% { transform: translate(-30px, 50px) scale(1.05); }
        }
        @keyframes blob-move-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-60px, 60px) scale(1.08); }
          50% { transform: translate(-80px, 20px) scale(0.92); }
          75% { transform: translate(-20px, -40px) scale(1.04); }
        }
        @keyframes blob-move-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -50px) scale(1.06); }
          50% { transform: translate(-40px, -30px) scale(0.94); }
          75% { transform: translate(30px, 30px) scale(1.1); }
        }
        @keyframes blob-move-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(70px, -30px) scale(1.12); }
          66% { transform: translate(-50px, 50px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
