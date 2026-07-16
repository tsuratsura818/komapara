"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PanelState,
  SeriesOption,
  ImportMethod,
  UploadStep,
  ImportedData,
  DEFAULT_PANELS,
  emptyPanel,
} from "./types";
import { MethodSelector } from "./MethodSelector";
import { ImportFromX } from "./ImportFromX";
import { ImportFromInstagram } from "./ImportFromInstagram";
import { DirectUpload } from "./DirectUpload";
import { WorkInfoForm } from "./WorkInfoForm";
import { UploadComplete } from "./UploadComplete";

export function UploadWizard({ userSeries = [] }: { userSeries?: SeriesOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("select-method");
  const [method, setMethod] = useState<ImportMethod | null>(null);

  const [panelCount, setPanelCount] = useState(DEFAULT_PANELS);
  const [panels, setPanels] = useState<PanelState[]>(
    Array.from({ length: DEFAULT_PANELS }, emptyPanel)
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [xPostUrl, setXPostUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completedWork, setCompletedWork] = useState<{ id: string; title: string; coverImage?: string } | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  const handleSelectMethod = (m: ImportMethod) => {
    setMethod(m);
    setStep("import");
    setError("");
    setPanels(Array.from({ length: DEFAULT_PANELS }, emptyPanel));
    setPanelCount(DEFAULT_PANELS);
    setTitle("");
    setDescription("");
    setSelectedGenres([]);
    setSelectedSeriesId("");
    setXPostUrl("");
  };

  const handleImportComplete = (data: ImportedData) => {
    setPanels(data.panels);
    setPanelCount(data.panelCount);
    if (data.description) setDescription(data.description);
    if (data.xPostUrl) setXPostUrl(data.xPostUrl);
    setStep("work-info");
    setError("");
  };

  const handleDirectUploadReady = () => {
    setStep("work-info");
    setError("");
  };

  const handleBackToSelect = () => {
    setStep("select-method");
    setMethod(null);
    setPanels(Array.from({ length: DEFAULT_PANELS }, emptyPanel));
    setPanelCount(DEFAULT_PANELS);
    setError("");
  };

  const handleBackToImport = () => {
    setStep("import");
    setError("");
  };

  const handleSwitchToDirect = () => {
    setMethod("direct");
    setPanels(Array.from({ length: DEFAULT_PANELS }, emptyPanel));
    setPanelCount(DEFAULT_PANELS);
    setError("");
  };

  const uploadPanel = async (index: number): Promise<string> => {
    const panel = panels[index];
    if (panel.url) return panel.url;
    if (!panel.file) throw new Error(`画像${index + 1}が選択されていません`);

    setPanels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploading: true };
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("file", panel.file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          throw new Error("ログインが必要です");
        }
        let message = `画像${index + 1}のアップロードに失敗しました`;
        try {
          const errData = await res.json();
          if (errData.error) message = errData.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (!data.url) throw new Error(`画像${index + 1}のURLが取得できませんでした`);
      return data.url;
    } finally {
      setPanels((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], uploading: false };
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const urls = await Promise.all(panels.map((_, i) => uploadPanel(i)));

      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          panels: urls,
          genreSlugs: selectedGenres.length ? selectedGenres : undefined,
          seriesId: selectedSeriesId || undefined,
          xPostUrl: xPostUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          return;
        }
        let message = "投稿に失敗しました";
        try {
          const data = await res.json();
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const work = await res.json();
      setCompletedWork({ id: work.id, title: title.trim(), coverImage: urls[0] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (completedWork) {
    return <UploadComplete workId={completedWork.id} workTitle={completedWork.title} coverImage={completedWork.coverImage} />;
  }

  return (
    <>
      {error && (
        <div ref={errorRef} className="max-w-lg mx-auto px-4">
          <div className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg border border-red-200">
            {error}
          </div>
        </div>
      )}

      {step === "select-method" && (
        <MethodSelector onSelect={handleSelectMethod} />
      )}

      {step === "import" && method === "x" && (
        <ImportFromX
          onImportComplete={handleImportComplete}
          onBack={handleBackToSelect}
        />
      )}

      {step === "import" && method === "instagram" && (
        <ImportFromInstagram
          onImportComplete={handleImportComplete}
          onBack={handleBackToSelect}
          onSwitchToDirect={handleSwitchToDirect}
        />
      )}

      {step === "import" && method === "direct" && (
        <DirectUpload
          panels={panels}
          panelCount={panelCount}
          onPanelsChange={setPanels}
          onPanelCountChange={setPanelCount}
          onReady={handleDirectUploadReady}
          onBack={handleBackToSelect}
          setError={setError}
        />
      )}

      {step === "work-info" && (
        <WorkInfoForm
          panels={panels}
          title={title}
          description={description}
          selectedGenres={selectedGenres}
          selectedSeriesId={selectedSeriesId}
          xPostUrl={xPostUrl}
          userSeries={userSeries}
          submitting={submitting}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onGenresChange={setSelectedGenres}
          onSeriesChange={setSelectedSeriesId}
          onXPostUrlChange={setXPostUrl}
          onSubmit={handleSubmit}
          onBack={handleBackToImport}
        />
      )}
    </>
  );
}
