"use client";

import { createContext, useContext, useState } from "react";

type SearchState = { query: string; setQuery: (q: string) => void };

const SearchCtx = createContext<SearchState>({ query: "", setQuery: () => {} });

/**
 * ヘッダーの検索入力とフィードの絞り込みを繋ぐ。
 * URLクエリ(useSearchParams)にしないのは、ホームがISR(静的)のため
 * 静的化が外れる/Suspense必須になるのを避けるため。画面遷移もさせない。
 */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <SearchCtx.Provider value={{ query, setQuery }}>{children}</SearchCtx.Provider>;
}

export const useSearch = () => useContext(SearchCtx);
