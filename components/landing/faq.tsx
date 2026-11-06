"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/landing/section-heading";

const FAQS = [
  {
    q: "What kinds of properties are on Easelife?",
    a: "Easelife now focuses on luxury apartments, homes for sale, and curated staycation destinations, including places in Nigeria, the Maldives, Ethiopia, and other standout locations.",
  },
  {
    q: "Can I browse luxury apartments and properties for sale?",
    a: "Yes. We combine premium rental listings with sale opportunities so buyers, investors, and travellers can discover the right fit in one place.",
  },
  {
    q: "Are staycation destinations listed by agents?",
    a: "Yes. Many destination stays are curated and listed by agents who can help connect you directly with the right contact or host for the property or experience.",
  },
  {
    q: "Do I need an account to browse listings?",
    a: "No. Visitors can view listings and contact the relevant property owner or agent directly without creating an account.",
  },
  {
    q: "Can agents and owners list a property here?",
    a: "Yes. Any property or destination can be listed through a private management link, allowing the owner or agent to update details and manage enquiries.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="shell home-section">
      <div className="faq-layout">
        <Reveal>
          <SectionHeading eyebrow="A little clarity" description="A few things you might be wondering before making your next move.">
            Good questions.<br /><span>Simple answers.</span>
          </SectionHeading>
        </Reveal>

        <div className="flex flex-col divide-y divide-slate-200 border-y border-slate-200">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  id={`faq-question-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                >
                  <span className="text-sm font-medium text-blue-950 sm:text-base">{item.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-5 w-5 shrink-0 text-blue-800 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pr-8 pb-5 text-sm leading-7 text-slate-500">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
