import type { Metadata } from "next";

import { LegalPlaceholder } from "@/components/store/legal-placeholder";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy policy placeholder for Seniors Enterprises.",
};

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Privacy policy"
      description="This page will explain how customer information is handled."
      topics={[
        "Information collected during account creation, checkout, and customer support.",
        "How order and contact information is used and stored.",
        "Customer choices, data requests, and how to contact the business.",
      ]}
    />
  );
}
