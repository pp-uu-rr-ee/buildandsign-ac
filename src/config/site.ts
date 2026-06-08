export const siteConfig = {
  name: "Cool Air Services",
  tagline: "Expert AC Installation, Repair & Cleaning",
  description:
    "Professional air conditioning services — sales, installation, repair, and cleaning. Serving Bangkok and surrounding areas.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://coolairservices.com",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+66 81 000 0000",
  phone2: process.env.NEXT_PUBLIC_BUSINESS_PHONE2 ?? "+66 99 000 0000",
  email: "info@coolairservices.com",
  address: {
    streetAddress: "123 Sukhumvit Road",
    addressLocality: "Bangkok",
    addressRegion: "Bangkok",
    postalCode: "10110",
    addressCountry: "TH",
  },
  openingHours: "Mo-Sa 08:00-18:00",
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61576667166263",
    line: process.env.NEXT_PUBLIC_LINE_URL ?? "https://line.me/R/ti/p/@893blxlh?from=page&openQrModal=true&searchId=893blxlh",
  },
  // Used for JSON-LD LocalBusiness schema — Bangkok city centre
  geo: {
    latitude: "13.7563",
    longitude: "100.5018",
  },
};

export type SiteConfig = typeof siteConfig;
