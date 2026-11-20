import type { Metadata } from "next";

import { LegalPlaceholder } from "@/components/store/legal-placeholder";

export const metadata: Metadata = {
  title: "Delivery information",
  description: "Delivery information placeholder for Seniors Enterprises.",
};

export default function DeliveryPage() {
  return (
    <LegalPlaceholder
      title="Delivery information"
      description="This page will describe delivery coverage and timing."
      topics={[
        "Delivery locations, fees, and expected timeframes.",
        "How delivery updates and address changes are handled.",
        "What to do if a delivery is delayed or unsuccessful.",
      ]}
    />
  );
}
