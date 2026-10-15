import { describe, expect, it } from "vitest";

import { getMessages } from "./catalog";
import { detectLocale, isLocale, LOCALES } from "./locales";
import { en } from "./messages/en";
import { pluralCategory, translate, type Message } from "./translate";

// The placeholders of a message
const placeholders = (message: Message) => {
  const texts = typeof message === "string" ? [message] : Object.values(message);
  return [
    ...new Set(texts.flatMap((text) => [...text.matchAll(/\{(\w+)\}/gu)].map((match) => match[1] ?? ""))),
  ].toSorted();
};

describe("translate", () => {
  it("interpolates parameters with each language's quotes", () => {
    expect(translate("en", "task.delete", { title: "Milk" })).toBe("Delete “Milk”");
    expect(translate("uk", "task.delete", { title: "Молоко" })).toBe("Видалити «Молоко»");
    expect(translate("de", "task.delete", { title: "Milch" })).toBe("„Milch“ löschen");
    expect(translate("fr", "task.delete", { title: "Lait" })).toBe("Supprimer «\u00a0Lait\u00a0»");
    expect(translate("pl", "task.delete", { title: "Mleko" })).toBe("Usuń „Mleko”");
  });

  it("keeps unknown placeholders untouched", () => {
    expect(translate("en", "task.delete")).toBe("Delete “{title}”");
  });

  it("selects plural forms", () => {
    expect(translate("en", "palette.results", { count: 1 })).toBe("1 result");
    expect(translate("en", "palette.results", { count: 3 })).toBe("3 results");
    expect(translate("uk", "palette.results", { count: 3 })).toBe("3 результати");
    expect(translate("uk", "palette.results", { count: 5 })).toBe("5 результатів");
    expect(translate("uk", "palette.results", { count: 21 })).toBe("21 результат");
    expect(translate("pl", "palette.results", { count: 1 })).toBe("1 wynik");
    expect(translate("pl", "palette.results", { count: 3 })).toBe("3 wyniki");
    expect(translate("pl", "palette.results", { count: 12 })).toBe("12 wyników");
    expect(translate("pl", "palette.results", { count: 22 })).toBe("22 wyniki");
    expect(translate("fr", "palette.results", { count: 0 })).toBe("0 résultat");
    expect(translate("fr", "palette.results", { count: 2 })).toBe("2 résultats");
    expect(translate("de", "palette.results", { count: 1 })).toBe("1 Ergebnis");
    expect(translate("it", "toast.deletedMany", { count: 7 })).toBe("7 attività eliminate");
    expect(translate("cs", "palette.results", { count: 1 })).toBe("1 výsledek");
    expect(translate("cs", "palette.results", { count: 3 })).toBe("3 výsledky");
    expect(translate("cs", "palette.results", { count: 12 })).toBe("12 výsledků");
    expect(translate("pt", "palette.results", { count: 1 })).toBe("1 resultado");
    expect(translate("pt", "palette.results", { count: 0 })).toBe("0 resultados");
  });

  it("detects the first supported browser language", () => {
    expect(detectLocale(["uk-UA", "en-US"])).toBe("uk");
    expect(detectLocale(["de-DE", "en-US"])).toBe("de");
    expect(detectLocale(["pt-BR", "es-419"])).toBe("pt");
    expect(detectLocale(["sk-SK", "cs-CZ"])).toBe("cs");
    expect(detectLocale(["ja-JP"])).toBe("en");
    expect(isLocale("cs")).toBe(true);
    expect(isLocale("ru")).toBe(false);
  });

  it("translates every message in every language", () => {
    const keys = Object.keys(en).toSorted();
    for (const locale of LOCALES) expect(Object.keys(getMessages(locale)).toSorted()).toEqual(keys);
  });

  it("keeps the placeholders of every message", () => {
    const mismatched = LOCALES.flatMap((locale) => {
      const messages = new Map<string, Message>(Object.entries(getMessages(locale)));
      return Object.entries(en)
        .filter(([key, message]) => {
          const translated = messages.get(key);
          return translated === undefined || placeholders(translated).join() !== placeholders(message).join();
        })
        .map(([key]) => `${locale} ${key}`);
    });
    expect(mismatched).toEqual([]);
  });

  it("spells out every plural form a language needs", () => {
    const missing = LOCALES.flatMap((locale) =>
      Object.entries(getMessages(locale)).flatMap(([key, message]) => {
        if (typeof message === "string") return [];
        return Array.from({ length: 200 }, (_, count) => pluralCategory(locale, count))
          .filter((category) => message[category] === undefined)
          .map((category) => `${locale} ${key} ${category}`);
      }),
    );
    expect([...new Set(missing)]).toEqual([]);
  });
});
