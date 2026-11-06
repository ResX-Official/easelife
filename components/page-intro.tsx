import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, accent, description, children }: {
  eyebrow: string; title: string; accent?: string; description: string; children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div className="max-w-2xl">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1>{title}{accent && <><br /><span>{accent}</span></>}</h1>
        <p className="section-description">{description}</p>
      </div>
      {children && <div className="page-intro-actions">{children}</div>}
    </div>
  );
}
