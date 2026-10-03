declare const __OG_IMAGE_VERSION__: string;

export const siteUrl = "https://nova-it.se";

// Plattformar som Facebook, LinkedIn och Slack cachar en länks og:image under
// obestämd tid, nyckladt enbart på URL:en. Utan en versionsparameter som
// ändras vid varje deploy fastnar de på den allra första skrapningen - delade
// länkar visar då en gammal bild/text även långt efter att sidan uppdaterats.
export const socialImageUrl = `${siteUrl}/nova-it-workspace.png?v=${__OG_IMAGE_VERSION__}`;
