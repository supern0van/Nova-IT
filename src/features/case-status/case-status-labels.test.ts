import { expect, test } from "bun:test";
import {
  aktivtGrundsteg,
  kategoriEtikett,
  statusEtikett,
  statusVagledning,
} from "./case-status-labels";

test("statusEtikett översätter kända statusar och faller tillbaka på rådata annars", () => {
  expect(statusEtikett("vantar_pa_kund")).toBe("Väntar på dig");
  expect(statusEtikett("lost")).toBe("Löst");
  expect(statusEtikett("okand_status")).toBe("okand_status");
});

test("statusVagledning ger en generisk fallback för okänd status", () => {
  expect(statusVagledning("pagaende").rubrik).toBe("Vi arbetar med ärendet");
  expect(statusVagledning("okand_status")).toEqual({
    rubrik: "Vi håller dig uppdaterad",
    beskrivning: "Nästa uppdatering kommer att synas här.",
  });
});

test("kategoriEtikett översätter kända kategorier och faller tillbaka på rådata annars", () => {
  expect(kategoriEtikett("natverk_wifi")).toBe("Nätverk och Wi-Fi");
  expect(kategoriEtikett("ovanlig_kategori")).toBe("ovanlig_kategori");
});

test("aktivtGrundsteg placerar ny/pagaende/lost-stangd på rätt grundsteg", () => {
  expect(aktivtGrundsteg("ny")).toBe(0);
  expect(aktivtGrundsteg("pagaende")).toBe(1);
  expect(aktivtGrundsteg("vantar_pa_kund")).toBe(1);
  expect(aktivtGrundsteg("bokad")).toBe(1);
  expect(aktivtGrundsteg("lost")).toBe(2);
  expect(aktivtGrundsteg("stangd")).toBe(2);
});
