import { readFileSync } from "fs";
import { join } from "path";
import { ServicePlanViewer } from "./ServicePlanViewer";

export default function ServicePlanPage() {
  const html = readFileSync(
    join(process.cwd(), "docs", "service-plan.html"),
    "utf-8"
  );

  return <ServicePlanViewer html={html} />;
}
