import type { Metadata } from "next";

import { LegalPlaceholder } from "@/components/store/legal-placeholder";

export const metadata: Metadata = {
  title: "Returns and exchanges",
  description: "Returns and exchanges placeholder for Seniors Enterprises.",
};

export default function ReturnsPage() {
  return (
    <LegalPlaceholder
      title="Returns and exchanges"
      description="This page will explain the return and exchange process."
      topics={[
        "Eligible items and the time allowed to request a return.",
        "Condition, packaging, refund, and exchange requirements.",
        "How to contact the store to start a request.",
      ]}
    />
  );
}
