import Link from "next/link";
import { Search, MessageCircle, KeyRound, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/landing/section-heading";

const steps = [
  { icon: Search, title: "Find a place you love", body: "Explore homes and stays by location, budget, and the way you want to live." },
  { icon: MessageCircle, title: "Meet the person behind it", body: "Contact the owner or agent directly. Ask questions and arrange a viewing." },
  { icon: KeyRound, title: "Take the next step", body: "Agree on the details together and make your next chapter happen." },
];

export function HowItWorks() {
  return (
    <section className="shell home-section">
      <Reveal className="section-header">
        <SectionHeading eyebrow="From browsing to belonging">Your next move,<span> made simpler.</span></SectionHeading>
        <Link href="/list-property" className="text-link">Here to list a property? <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
      </Reveal>
      <ol className="process-grid">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Reveal delay={i * 0.07} className="process-step">
              <div className="process-step-top">
                <span className="process-step-icon"><step.icon aria-hidden="true" className="h-5 w-5" /></span>
                <span className="text-xs tracking-[0.12em] text-slate-400">0{i + 1}</span>
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight text-blue-950">{step.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-7 text-slate-500">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
