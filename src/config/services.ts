import { Wrench, Sparkles, Package, ClipboardCheck } from "lucide-react";

export type ServiceId = "cleaning" | "repair" | "installation" | "inspection";

export type ServiceConfig = {
  id: ServiceId;
  title: string;
  tagline: string;
  description: string;
  durationMinutes: number;
  basePriceInCents: number;
  icon: typeof Wrench;
  includes: string[];
  faqs: { question: string; answer: string }[];
};

export const servicesConfig: ServiceConfig[] = [
  {
    id: "cleaning",
    title: "AC Cleaning",
    tagline: "Deep-clean your unit for peak performance.",
    description:
      "Our thorough AC cleaning service removes dust, mold, and bacteria from filters, coils, and the drainage system. A clean unit runs more efficiently and improves indoor air quality.",
    durationMinutes: 60,
    basePriceInCents: 79900,
    icon: Sparkles,
    includes: [
      "Filter wash and dry",
      "Evaporator coil cleaning",
      "Drainage pipe flush",
      "Fan blade wipe-down",
      "Exterior cabinet wipe",
      "Before-and-after performance check",
    ],
    faqs: [
      {
        question: "How often should I have my AC cleaned?",
        answer:
          "Every 3–6 months for residential units. Heavy-use or commercial units benefit from cleaning every 2–3 months.",
      },
      {
        question: "How long does cleaning take?",
        answer:
          "Approximately 1 hour per indoor unit. Additional units are serviced at a discounted rate.",
      },
      {
        question: "Do I need to be home during the service?",
        answer:
          "Yes, an adult must be present at the start. You can leave after the technician begins if needed.",
      },
    ],
  },
  {
    id: "repair",
    title: "AC Repair",
    tagline: "Fast diagnosis and reliable fixes.",
    description:
      "Our certified technicians diagnose and repair all makes and models — from refrigerant leaks and compressor issues to sensor faults and PCB problems. We carry common parts in our service vehicles.",
    durationMinutes: 120,
    basePriceInCents: 149900,
    icon: Wrench,
    includes: [
      "Full system diagnosis",
      "Error code reading",
      "Refrigerant pressure test",
      "Component inspection",
      "Labor for standard repairs",
      "90-day warranty on workmanship",
    ],
    faqs: [
      {
        question: "Is the diagnostic fee included?",
        answer:
          "Yes — the booking fee covers diagnosis. Parts and refrigerant top-up are billed separately at market rates.",
      },
      {
        question: "What if my unit needs a major part replacement?",
        answer:
          "We'll provide a written quotation after diagnosis. You can approve or decline with no obligation.",
      },
      {
        question: "Do you service all AC brands?",
        answer:
          "Yes — Carrier, Daikin, Panasonic, LG, Samsung, Midea, Fujitsu, and more.",
      },
    ],
  },
  {
    id: "installation",
    title: "AC Installation",
    tagline: "Professional mounting, wiring, and commissioning.",
    description:
      "Proper installation is critical to your AC's lifespan and efficiency. Our team handles everything — bracket mounting, refrigerant line laying, electrical connection, and initial commissioning — to manufacturer specs.",
    durationMinutes: 180,
    basePriceInCents: 249900,
    icon: Package,
    includes: [
      "Standard bracket installation",
      "Up to 3 metres of refrigerant line",
      "Electrical connection",
      "Vacuum and refrigerant charge",
      "Thermostat and remote setup",
      "Test run and client walkthrough",
    ],
    faqs: [
      {
        question: "What's included in the standard rate?",
        answer:
          "Standard rate covers up to 3 metres of refrigerant copper line and 2 metres of electrical cable. Additional materials are billed at cost.",
      },
      {
        question: "Do you supply the AC unit?",
        answer:
          "You can purchase one from our shop or supply your own. We install all standard residential split-type and window-type units.",
      },
      {
        question: "Will the installation void my warranty?",
        answer:
          "No — our technicians are brand-certified and follow manufacturer guidelines to preserve your warranty.",
      },
    ],
  },
  {
    id: "inspection",
    title: "AC Inspection",
    tagline: "Comprehensive health check before problems arise.",
    description:
      "Our inspection covers 25 check points across your AC system — from refrigerant levels and electrical safety to structural mounting and drainage. Ideal before buying a secondhand unit or before the summer season.",
    durationMinutes: 60,
    basePriceInCents: 59900,
    icon: ClipboardCheck,
    includes: [
      "25-point system check",
      "Refrigerant level assessment",
      "Electrical safety inspection",
      "Mounting and structural check",
      "Detailed written report",
      "Priority repair booking if needed",
    ],
    faqs: [
      {
        question: "Do I get a written report?",
        answer:
          "Yes — you'll receive a PDF report within 24 hours covering all 25 check points with photos and recommendations.",
      },
      {
        question: "When is inspection most useful?",
        answer:
          "Before the summer heat peaks, before/after a typhoon season, or when buying a secondhand unit.",
      },
    ],
  },
];

export function getService(id: string): ServiceConfig | undefined {
  return servicesConfig.find((s) => s.id === id);
}
