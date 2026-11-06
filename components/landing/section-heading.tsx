import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  children,
  description,
}: {
  eyebrow: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">{children}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}
