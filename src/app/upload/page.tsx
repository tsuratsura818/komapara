import { WorkUploadForm } from "@/components/works/WorkUploadForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投稿する",
};

export default function UploadPage() {
  return <WorkUploadForm />;
}
