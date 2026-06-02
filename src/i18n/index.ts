import en from "./en";
import th from "./th";

export type Language = "en" | "th";
export type { Translations } from "./en";

export const translations: Record<Language, typeof en> = { en, th };

export default translations;
