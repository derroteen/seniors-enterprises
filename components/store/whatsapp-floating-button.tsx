import { WhatsAppIcon } from "@/components/store/icons";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppFloatingButton() {
  const href = getWhatsAppUrl("Hello, I have a question about Seniors Enterprises.");
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Seniors Enterprises on WhatsApp"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
