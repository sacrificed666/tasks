import { describe, expect, it } from "vitest";

import { parseDatePhrase, parseQuickAdd } from "./quickAdd";

const today = "2026-10-01";

describe("parseQuickAdd", () => {
  it("recognises relative dates at the end of the title", () => {
    expect(parseQuickAdd("Call mom tomorrow", today)).toEqual({
      title: "Call mom",
      dueDate: "2026-10-02",
      important: false,
      repeat: null,
      projectId: null,
      tags: [],
    });
    expect(parseQuickAdd("Подзвонити мамі завтра", today).dueDate).toBe("2026-10-02");
    expect(parseQuickAdd("Renew passport in 10 days", today).dueDate).toBe("2026-10-11");
    expect(parseQuickAdd("Оплатити рахунки через 3 дні", today).dueDate).toBe("2026-10-04");
  });

  it("recognises weekdays", () => {
    expect(parseQuickAdd("Team retro on friday", today).dueDate).toBe("2026-10-02");
    expect(parseQuickAdd("Standup thursday", today).dueDate).toBe("2026-10-08");
    expect(parseQuickAdd("Зустріч у п'ятницю", today)).toMatchObject({ title: "Зустріч", dueDate: "2026-10-02" });
    expect(parseQuickAdd("Звіт наступного вівторка", today)).toMatchObject({ title: "Звіт", dueDate: "2026-10-06" });
    expect(parseQuickAdd("Йога наступної середи", today).dueDate).toBe("2026-10-07");
    expect(parseQuickAdd("Похід цієї суботи", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Ремонт наступний понеділок", today).dueDate).toBe("2026-10-05");
  });

  it("recognises explicit dates", () => {
    expect(parseQuickAdd("Dentist 2026-11-03", today).dueDate).toBe("2026-11-03");
    expect(parseQuickAdd("Day off 24.12", today).dueDate).toBe("2026-12-24");
    expect(parseQuickAdd("Book tickets 15.09", today).dueDate).toBe("2027-09-15");
    expect(parseQuickAdd("Invalid 31.02", today)).toMatchObject({ title: "Invalid 31.02", dueDate: null });
  });

  it("marks tasks as important and moves #tags out of the title", () => {
    expect(parseQuickAdd("Ship the release friday #work !", today)).toEqual({
      title: "Ship the release",
      dueDate: "2026-10-02",
      important: true,
      repeat: null,
      projectId: null,
      tags: ["#work"],
    });
    expect(parseQuickAdd("Call #mom about the #Trip #trip", today)).toMatchObject({
      title: "Call about the",
      tags: ["#mom", "#Trip"],
    });
    expect(parseQuickAdd("#idea", today)).toMatchObject({ title: "#idea", tags: [] });
  });

  it("leaves ordinary titles untouched", () => {
    expect(parseQuickAdd("Read “Tomorrow and tomorrow” again", today)).toEqual({
      title: "Read “Tomorrow and tomorrow” again",
      dueDate: null,
      important: false,
      repeat: null,
      projectId: null,
      tags: [],
    });
    expect(parseQuickAdd("Tomorrow", today)).toEqual({
      title: "Tomorrow",
      dueDate: null,
      important: false,
      repeat: null,
      projectId: null,
      tags: [],
    });
    expect(parseQuickAdd("Enjoy the sun", today).dueDate).toBeNull();
  });

  it("parses standalone phrases", () => {
    expect(parseDatePhrase("Next Week", today)).toBe("2026-10-08");
    expect(parseDatePhrase("someday", today)).toBeNull();
  });
});

describe("parseDatePhrase edge cases", () => {
  it("rolls past day-month dates into the next valid year", () => {
    expect(parseDatePhrase("29.02", "2027-03-01")).toBe("2028-02-29");
    expect(parseDatePhrase("29.02.2027", today)).toBeNull();
  });
});

describe("parseQuickAdd in other languages", () => {
  it("understands relative days", () => {
    expect(parseQuickAdd("Zahnarzt anrufen morgen", today)).toMatchObject({
      title: "Zahnarzt anrufen",
      dueDate: "2026-10-02",
    });
    expect(parseQuickAdd("Comprar pan pasado mañana", today)).toMatchObject({
      title: "Comprar pan",
      dueDate: "2026-10-03",
    });
    expect(parseQuickAdd("Appeler maman aujourd'hui", today)).toMatchObject({ title: "Appeler maman", dueDate: today });
    expect(parseQuickAdd("Pagare la bolletta dopodomani", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Boodschappen overmorgen", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Zadzwonić do mamy jutro", today)).toMatchObject({
      title: "Zadzwonić do mamy",
      dueDate: "2026-10-02",
    });
    expect(parseQuickAdd("Sprawozdanie w przyszłym tygodniu", today).dueDate).toBe("2026-10-08");
    expect(parseQuickAdd("Rapport la semaine prochaine", today).dueDate).toBe("2026-10-08");
  });

  it("understands days counted from today", () => {
    expect(parseQuickAdd("Bericht in 3 Tagen", today).dueDate).toBe("2026-10-04");
    expect(parseQuickAdd("Informe dentro de 2 días", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Rapport dans 5 jours", today).dueDate).toBe("2026-10-06");
    expect(parseQuickAdd("Relazione tra 4 giorni", today).dueDate).toBe("2026-10-05");
    expect(parseQuickAdd("Verslag over 2 dagen", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Raport za 10 dni", today).dueDate).toBe("2026-10-11");
  });

  it("understands weekdays with articles and modifiers", () => {
    expect(parseQuickAdd("Teammeeting am Freitag", today)).toMatchObject({
      title: "Teammeeting",
      dueDate: "2026-10-02",
    });
    expect(parseQuickAdd("Reunión el próximo lunes", today)).toMatchObject({ title: "Reunión", dueDate: "2026-10-05" });
    expect(parseQuickAdd("Réunion lundi prochain", today).dueDate).toBe("2026-10-05");
    expect(parseQuickAdd("Riunione mercoledi", today).dueDate).toBe("2026-10-07");
    expect(parseQuickAdd("Vergadering op dinsdag", today).dueDate).toBe("2026-10-06");
    expect(parseQuickAdd("Spotkanie w piątek", today)).toMatchObject({ title: "Spotkanie", dueDate: "2026-10-02" });
  });

  it("accepts German day-month dates with a trailing dot", () => {
    expect(parseQuickAdd("Urlaub 24.12.", today).dueDate).toBe("2026-12-24");
    expect(parseQuickAdd("Urlaub 24.12.2027", today).dueDate).toBe("2027-12-24");
    expect(parseQuickAdd("Seite 20.102026", today)).toMatchObject({ title: "Seite 20.102026", dueDate: null });
  });

  it("does not mistake mornings for tomorrow", () => {
    expect(parseQuickAdd("Correr por la mañana", today)).toMatchObject({
      title: "Correr por la mañana",
      dueDate: null,
    });
    expect(parseQuickAdd("Joggen am Morgen", today)).toMatchObject({ title: "Joggen am Morgen", dueDate: null });
  });
});

describe("parseQuickAdd in Czech and Portuguese", () => {
  it("understands relative days and days counted from today", () => {
    expect(parseQuickAdd("Zavolat mámě zítra", today)).toMatchObject({ title: "Zavolat mámě", dueDate: "2026-10-02" });
    expect(parseQuickAdd("Úklid pozítří", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Zpráva za 3 dny", today).dueDate).toBe("2026-10-04");
    expect(parseQuickAdd("Ligar à mãe amanhã", today)).toMatchObject({ title: "Ligar à mãe", dueDate: "2026-10-02" });
    expect(parseQuickAdd("Relatório depois de amanhã", today).dueDate).toBe("2026-10-03");
    expect(parseQuickAdd("Relatório daqui a 5 dias", today).dueDate).toBe("2026-10-06");
    expect(parseQuickAdd("Exame na próxima semana", today).dueDate).toBe("2026-10-08");
  });

  it("understands weekdays and keeps Portuguese ordinals as words", () => {
    expect(parseQuickAdd("Schůzka v pátek", today)).toMatchObject({ title: "Schůzka", dueDate: "2026-10-02" });
    expect(parseQuickAdd("Porada příští pondělí", today)).toMatchObject({ title: "Porada", dueDate: "2026-10-05" });
    expect(parseQuickAdd("Jóga ve středu", today).dueDate).toBe("2026-10-07");
    expect(parseQuickAdd("Reunião na sexta", today)).toMatchObject({ title: "Reunião", dueDate: "2026-10-02" });
    expect(parseQuickAdd("Dentista segunda-feira", today).dueDate).toBe("2026-10-05");
    expect(parseQuickAdd("Ler a quinta", today)).toMatchObject({ title: "Ler a quinta", dueDate: null });
    expect(parseQuickAdd("Visitar quintas", today)).toMatchObject({ title: "Visitar quintas", repeat: null });
  });

  it("understands repeats", () => {
    expect(parseQuickAdd("Zalít květiny každý týden", today)).toMatchObject({
      title: "Zalít květiny",
      repeat: "weekly",
    });
    expect(parseQuickAdd("Bazén každou středu", today)).toMatchObject({
      title: "Bazén",
      repeat: "weekly",
      dueDate: "2026-10-07",
    });
    expect(parseQuickAdd("Regar as plantas todos os dias", today)).toMatchObject({
      title: "Regar as plantas",
      repeat: "daily",
    });
    expect(parseQuickAdd("Ginásio às segundas", today)).toMatchObject({
      title: "Ginásio",
      repeat: "weekly",
      dueDate: "2026-10-05",
    });
    expect(parseQuickAdd("Renda todos os meses", today).repeat).toBe("monthly");
  });
});

describe("parseQuickAdd repeats", () => {
  it("understands intervals in every language", () => {
    expect(parseQuickAdd("Water the plants every day", today)).toMatchObject({
      title: "Water the plants",
      repeat: "daily",
      dueDate: today,
    });
    expect(parseQuickAdd("Standup every weekday", today).repeat).toBe("weekdays");
    expect(parseQuickAdd("Полити квіти щотижня", today).repeat).toBe("weekly");
    expect(parseQuickAdd("Miete zahlen monatlich", today).repeat).toBe("monthly");
    expect(parseQuickAdd("Revisión cada año", today).repeat).toBe("yearly");
    expect(parseQuickAdd("Courir tous les jours", today).repeat).toBe("daily");
    expect(parseQuickAdd("Riunione ogni settimana", today).repeat).toBe("weekly");
    expect(parseQuickAdd("Planten water geven dagelijks", today).repeat).toBe("daily");
    expect(parseQuickAdd("Podlać kwiaty co tydzień", today).repeat).toBe("weekly");
  });

  it("starts weekly repeats on the named weekday, today included", () => {
    expect(parseQuickAdd("Gym every friday", today)).toMatchObject({
      title: "Gym",
      repeat: "weekly",
      dueDate: "2026-10-02",
    });
    expect(parseQuickAdd("Standup every thursday", today)).toMatchObject({ repeat: "weekly", dueDate: today });
    expect(parseQuickAdd("Йога щопонеділка", today)).toMatchObject({
      title: "Йога",
      repeat: "weekly",
      dueDate: "2026-10-05",
    });
    expect(parseQuickAdd("Басейн по понеділках", today)).toMatchObject({ title: "Басейн", repeat: "weekly" });
    expect(parseQuickAdd("Sport montags", today)).toMatchObject({
      title: "Sport",
      repeat: "weekly",
      dueDate: "2026-10-05",
    });
    expect(parseQuickAdd("Marché tous les samedis", today)).toMatchObject({
      title: "Marché",
      repeat: "weekly",
      dueDate: "2026-10-03",
    });
    expect(parseQuickAdd("Basen w każdy wtorek", today)).toMatchObject({
      title: "Basen",
      repeat: "weekly",
      dueDate: "2026-10-06",
    });
  });

  it("combines repeats with explicit dates, importance and tags", () => {
    expect(parseQuickAdd("Pay rent monthly 05.10 #home !", today)).toEqual({
      title: "Pay rent",
      dueDate: "2026-10-05",
      important: true,
      repeat: "monthly",
      projectId: null,
      tags: ["#home"],
    });
  });

  it("does not treat single weekdays as repeats", () => {
    expect(parseQuickAdd("Dentist friday", today)).toMatchObject({ repeat: null, dueDate: "2026-10-02" });
    expect(parseQuickAdd("Reunión el lunes", today)).toMatchObject({ repeat: null, dueDate: "2026-10-05" });
  });
});

describe("parseQuickAdd projects", () => {
  const projects = [
    { id: "work", name: "Work" },
    { id: "home", name: "🏠 Home", label: "Home" },
    { id: "trip", name: "Trip to Lviv" },
  ];

  it("assigns the project mentioned with @ anywhere in the title", () => {
    expect(parseQuickAdd("Send slides @work tomorrow", today, projects)).toEqual({
      title: "Send slides",
      dueDate: "2026-10-02",
      important: false,
      repeat: null,
      projectId: "work",
      tags: [],
    });
    expect(parseQuickAdd("@Home Fix the shelf", today, projects)).toMatchObject({
      title: "Fix the shelf",
      projectId: "home",
    });
  });

  it("matches names with spaces, accents and different case", () => {
    expect(parseQuickAdd("Pack bags @trip to lviv !", today, projects)).toMatchObject({
      title: "Pack bags",
      important: true,
      projectId: "trip",
    });
    expect(parseQuickAdd("Café @WÖRK", today, [{ id: "w", name: "Work" }]).projectId).toBe("w");
  });

  it("leaves e-mail addresses and unknown mentions alone", () => {
    expect(parseQuickAdd("Write to anna@work.com", today, projects)).toMatchObject({
      title: "Write to anna@work.com",
      projectId: null,
    });
    expect(parseQuickAdd("Ask @olena about it", today, projects)).toMatchObject({
      title: "Ask @olena about it",
      projectId: null,
    });
    expect(parseQuickAdd("Sync with @workshop team", today, projects).projectId).toBeNull();
  });
});
