import { expect, test } from "bun:test";

import { sakerJsonLd } from "./json-ld";

test("escaperar </script>-sekvenser så inbäddat innehåll inte kan bryta ut ur script-taggen", () => {
  const resultat = sakerJsonLd({ text: "</script><script>alert(1)</script>" });

  expect(resultat).not.toContain("</script>");
  expect(resultat).toContain("\\u003c/script>");
});

test("producerar fortfarande giltig, oförändrad JSON för vanligt innehåll utan <-tecken", () => {
  const data = { "@type": "WebSite", name: "Nova IT", url: "https://nova-it.se" };

  expect(JSON.parse(sakerJsonLd(data))).toEqual(data);
});

test("escaperar alla <-tecken, inte bara i </script>", () => {
  const resultat = sakerJsonLd({ text: "1 < 2" });

  expect(resultat).not.toContain("<");
  expect(JSON.parse(resultat)).toEqual({ text: "1 < 2" });
});
