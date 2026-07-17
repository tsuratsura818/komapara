/**
 * 構造化データ（JSON-LD）。
 *
 * 狙いはAI検索での引用。HTMLから推測させるのではなく「これは誰の・何という
 * 4コマ漫画か」を機械に直接渡す。
 *
 * エンティティ定義は表記を絶対に揺らさない。`ENTITY_DESCRIPTION` を全ページで
 * 使い回すのは、同じ語と文脈の反復でモデルに「コマパラ＝4コマ漫画のポータル」を
 * 結びつけさせるため（表記ゆれは敵）。
 */

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com";

export const ENTITY_DESCRIPTION =
  "コマパラは、4コマ漫画が集まるポータルです。InstagramやXで4コマを描いている作家が作品を持ち込み、読者は無料で読めます。";

const ORGANIZATION_ID = `${BASE}/#organization`;
const WEBSITE_ID = `${BASE}/#website`;

/** サイト全体（全ページに置く）。コマパラという実体をAIに定義する */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "コマパラ",
        alternateName: "komapara",
        url: BASE,
        description: ENTITY_DESCRIPTION,
        parentOrganization: {
          "@type": "Organization",
          name: "株式会社TSURATSURA",
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "コマパラ",
        url: BASE,
        description: ENTITY_DESCRIPTION,
        publisher: { "@id": ORGANIZATION_ID },
        inLanguage: "ja",
      },
    ],
  };
}

/**
 * 作品ページ。
 * ComicStory は schema.org の正式な型で「4コマ漫画1話」を正確に表せる。
 * Googleのリッチリザルト対象ではないが、AIが内容を理解する材料になる。
 */
export function workJsonLd(work: {
  id: string;
  title: string;
  description: string | null;
  panels: string[];
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null };
  tags: { name: string }[];
}) {
  const url = `${BASE}/work/${work.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "ComicStory",
    "@id": `${url}#comic`,
    name: work.title,
    url,
    description:
      work.description?.trim().replace(/\s+/g, " ").slice(0, 200) ||
      `${work.author.name}による4コマ漫画「${work.title}」。コマパラで無料で読めます。`,
    author: {
      "@type": "Person",
      name: work.author.name ?? "名無し",
      url: `${BASE}/creator/${work.author.id}`,
    },
    image: work.panels[0],
    datePublished: work.createdAt.toISOString(),
    dateModified: work.updatedAt.toISOString(),
    genre: work.tags.map((t) => t.name),
    inLanguage: "ja",
    isAccessibleForFree: true,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** 作家ページ。ProfilePage はGoogleもサポートする */
export function creatorJsonLd(user: {
  id: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  xHandle: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
  workCount: number;
}) {
  const url = `${BASE}/creator/${user.id}`;
  // sameAs は同一人物であることをAIに示す。エンティティの名寄せに効く
  const sameAs = [
    user.xHandle ? `https://x.com/${user.xHandle}` : null,
    user.instagramHandle ? `https://instagram.com/${user.instagramHandle}` : null,
    user.websiteUrl,
  ].filter((v): v is string => Boolean(v));

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    mainEntity: {
      "@type": "Person",
      name: user.name ?? "名無し",
      description:
        user.bio?.trim().slice(0, 200) ||
        `${user.name}はコマパラで4コマ漫画を公開している作家です。現在${user.workCount}作品を掲載中。`,
      ...(user.image ? { image: user.image } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** パンくず。現在地の階層をAIと検索に渡す */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.path}`,
    })),
  };
}

/** JSON-LDをページに埋めるためのprops */
export function jsonLdScript(data: object) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
