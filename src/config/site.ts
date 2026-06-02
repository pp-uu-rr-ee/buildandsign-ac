export const siteConfig = {
  name: "Cool Air Services",
  tagline: "Expert AC Installation, Repair & Cleaning",
  description:
    "Professional air conditioning services — sales, installation, repair, and cleaning. Serving Metro Manila and surrounding areas.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://coolairservices.com",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+63 917 000 0000",
  email: "info@coolairservices.com",
  address: {
    streetAddress: "123 Main Street",
    addressLocality: "Makati City",
    addressRegion: "Metro Manila",
    postalCode: "1200",
    addressCountry: "PH",
  },
  openingHours: "Mo-Sa 08:00-18:00",
  social: {
    facebook: "https://facebook.com/coolairservices",
    instagram: "https://instagram.com/coolairservices",
  },
  // Used for JSON-LD LocalBusiness schema
  geo: {
    latitude: "14.5547",
    longitude: "121.0244",
  },
};

export type SiteConfig = typeof siteConfig;
