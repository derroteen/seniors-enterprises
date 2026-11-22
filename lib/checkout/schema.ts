import { z } from "zod";

import { getKenyanCountyByName } from "@/lib/config/kenya-locations";

const kenyanPhonePattern = /^(?:\+254|254|0)(?:7|1)\d{8}$/;

export const kenyanPhoneSchema = z
  .string()
  .trim()
  .regex(
    kenyanPhonePattern,
    "Use a Kenyan mobile number, for example 0712345678 or +254712345678.",
  );

export const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.email("Enter a valid email address."),
  phone: kenyanPhoneSchema,
  county: z
    .string()
    .trim()
    .refine((county) => getKenyanCountyByName(county) !== undefined, {
      error: "Select a county from the list.",
    }),
  town: z.string().trim().min(1, "Enter your town.").max(80),
  street: z.string().trim().min(2, "Enter a street or estate.").max(120),
  landmark: z.string().trim().min(2, "Enter a nearby landmark.").max(120),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
