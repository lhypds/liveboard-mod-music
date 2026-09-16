export type Lang = "en" | "zh" | "ja";

/** The board's language narrowed to the three the cards are written in, English for anything else. */
export function pickLang(language: string | undefined): Lang {
  const lang = language?.split("-")[0];
  return lang === "zh" || lang === "ja" ? lang : "en";
}

/** Display form of a note or chord symbol: ♯ and ♭ in place of # and b. */
export const pretty = (note: string) => note.replace(/#/g, "♯").replace(/b/g, "♭");
