"use client";

export function AuroraBlobs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "900px",
          maxHeight: "900px",
          background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, transparent 60%)",
          top: "-20%",
          left: "-10%",
          animation: "blob-move-1 15s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: "750px",
          maxHeight: "750px",
          background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 60%)",
          top: "0%",
          right: "-15%",
          animation: "blob-move-2 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: "800px",
          maxHeight: "800px",
          background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 60%)",
          bottom: "-20%",
          left: "20%",
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
