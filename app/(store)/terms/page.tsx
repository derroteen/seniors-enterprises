import type { Metadata } from "next";

import { LegalPlaceholder } from "@/components/store/legal-placeholder";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms and conditions placeholder for Seniors Enterprises.",
};

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Terms and conditions"
      description="The final terms will explain the conditions for using this store."
      topics={[
        "Product listings, availability, and pricing.",
        "Order acceptance, payment, and customer responsibilities.",
        "Limitations, dispute handling, and business contact details.",
      ]}
    />
  );
}
