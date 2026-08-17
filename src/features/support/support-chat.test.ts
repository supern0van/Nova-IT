import { describe, expect, test } from "bun:test";
import { byggChattMeddelanden, byggChattSystemPrompt, tolkaChattSvar } from "./support-chat";
import type { KnowledgeDoc } from "./support-knowledge";

const dokument: KnowledgeDoc[] = [
  {
    id: "flow:wifi",
    kind: "flow",
    title: "Wi-Fi",
    text: "Nätet bryts.",
    sourceUrl: "/assistent#wifi",
  },
  { id: "faq:0", kind: "faq", title: "Fråga", text: "Svar.", sourceUrl: "/faq#fraga-1" },
];

describe("byggChattSystemPrompt", () => {
  test("listar alla dokument numrerat och nämner citering", () => {
    const prompt = byggChattSystemPrompt(dokument);
    expect(prompt).toContain("[1] Wi-Fi");
    expect(prompt).toContain("[2] Fråga");
    expect(prompt).toContain("citera");
  });

  test("nämner felsökningsförbudet och prompt-injektionsskyddet", () => {
    const prompt = byggChattSystemPrompt(dokument);
    expect(prompt).toMatch(/felsökningsråd/i);
    expect(prompt).toMatch(/instruktioner till dig/i);
  });

  test("hanterar en tom dokumentlista utan att hitta på källor", () => {
    const prompt = byggChattSystemPrompt([]);
    expect(prompt).toMatch(/inget underlag/i);
  });

  test("kan väva in regelmotorns tips", () => {
    const prompt = byggChattSystemPrompt(dokument, "Wi-Fi (angelägenhet: priority)");
    expect(prompt).toContain("Wi-Fi (angelägenhet: priority)");
  });
});

describe("byggChattMeddelanden", () => {
  test("kapar historiken till MAX_TURNS senaste", () => {
    const historik = Array.from({ length: 20 }, (_, i) => ({
      role: "user" as const,
      content: `meddelande ${i}`,
    }));
    const resultat = byggChattMeddelanden(historik);
    expect(resultat.length).toBeLessThanOrEqual(14);
    expect(resultat.at(-1)?.content).toBe("meddelande 19");
  });

  test("kapar ett enskilt meddelandes längd", () => {
    const resultat = byggChattMeddelanden([{ role: "user", content: "x".repeat(2000) }]);
    expect(resultat[0].content.length).toBeLessThanOrEqual(800);
  });
});

describe("tolkaChattSvar", () => {
  test("tolkar och validerar ett korrekt svar", () => {
    const svar = tolkaChattSvar(
      JSON.stringify({
        reply: "Vi hjälper gärna till.",
        citedDocIds: [1],
        quickReplies: ["Ja", "Nej"],
        serviceSlug: "natverk",
        urgency: "priority",
        securityIncident: false,
      }),
      2,
    );
    expect(svar).toEqual({
      reply: "Vi hjälper gärna till.",
      citedDocIds: [1],
      quickReplies: ["Ja", "Nej"],
      serviceSlug: "natverk",
      urgency: "priority",
      securityIncident: false,
    });
  });

  test("returnerar null när reply saknas eller är tom", () => {
    expect(tolkaChattSvar(JSON.stringify({ reply: "" }), 2)).toBeNull();
    expect(tolkaChattSvar(JSON.stringify({}), 2)).toBeNull();
  });

  test("filtrerar bort citedDocIds utanför dokumentlistans intervall", () => {
    const svar = tolkaChattSvar(JSON.stringify({ reply: "Hej", citedDocIds: [0, 1, 5, 2.5] }), 2);
    expect(svar?.citedDocIds).toEqual([1]);
  });

  test("faller tillbaka på 'standard' urgency och null serviceSlug vid ogiltiga värden", () => {
    const svar = tolkaChattSvar(
      JSON.stringify({ reply: "Hej", urgency: "hittepa", serviceSlug: "root-access" }),
      0,
    );
    expect(svar?.urgency).toBe("standard");
    expect(svar?.serviceSlug).toBeNull();
  });

  test("saniterar felsökningsråd i svaret", () => {
    const svar = tolkaChattSvar(JSON.stringify({ reply: "Prova att starta om datorn." }), 0);
    expect(svar?.reply).not.toMatch(/starta om/i);
  });

  test("plockar ut JSON ur kodstaket/prosa", () => {
    const svar = tolkaChattSvar('Visst, här kommer svaret:\n```json\n{"reply":"Hej"}\n```', 0);
    expect(svar?.reply).toBe("Hej");
  });

  test("returnerar null för trasig JSON", () => {
    expect(tolkaChattSvar("inte json alls", 0)).toBeNull();
  });
});
