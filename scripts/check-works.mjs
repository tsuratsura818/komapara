import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const works = await prisma.work.findMany({
    select: { id: true, panels: true, title: true, tags: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  let totalPanels = 0;
  for (const w of works) {
    totalPanels += w.panels.length;
    console.log(`${w.title} | panels: ${w.panels.length} | tags: ${w.tags.map((t) => t.name).join(",")}`);
  }
  console.log("---");
  console.log(`Total works: ${works.length}`);
  console.log(`Total panels: ${totalPanels}`);
  await prisma.$disconnect();
}
main();
