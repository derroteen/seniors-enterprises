import { BRAND } from "@/lib/brand";

let hasWarnedAboutWhatsApp = false;

function getWhatsAppPhoneNumber() {
  const phoneNumber = BRAND.whatsappNumber?.replace(/\D/g, "");
  if (!phoneNumber || !/^\d{8,15}$/.test(phoneNumber)) {
    if (process.env.NODE_ENV === "development" && !hasWarnedAboutWhatsApp) {
      console.warn(
        "WhatsApp links are hidden. Set NEXT_PUBLIC_WHATSAPP_NUMBER to a valid international number.",
      );
      hasWarnedAboutWhatsApp = true;
    }
    return null;
  }

  return phoneNumber;
}

export function isWhatsAppConfigured() {
  return getWhatsAppPhoneNumber() !== null;
}

export function getWhatsAppUrl(message: string) {
  const phoneNumber = getWhatsAppPhoneNumber();
  if (!phoneNumber) {
    return null;
  }

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
