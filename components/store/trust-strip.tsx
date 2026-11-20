import {
  DeliveryIcon,
  QualityIcon,
  SecureIcon,
} from "@/components/store/icons";

const trustPoints = [
  {
    title: "Considered quality",
    description: "Thoughtfully selected pieces made for everyday confidence.",
    Icon: QualityIcon,
  },
  {
    title: "Fast delivery",
    description: "Reliable delivery to your doorstep across Kenya.",
    Icon: DeliveryIcon,
  },
  {
    title: "Secure payment",
    description: "Pay with confidence through trusted, secure checkout.",
    Icon: SecureIcon,
  },
];

export function TrustStrip() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {trustPoints.map(({ title, description, Icon }) => (
        <div key={title} className="flex gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" />
          </span>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
