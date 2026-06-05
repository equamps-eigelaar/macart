import React, { useState } from "react";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    number: 1,
    title: "See your compliance list",
    helper: "This is every requirement an auditor checks — your audit binder, but it can't go missing.",
    why: "Know what's expected before the auditor walks in.",
    button: "Show me the list",
  },
  {
    number: 2,
    title: "Mark where one item stands",
    helper: "Pick any requirement and click Edit to set its status — the same call you'd make on the floor, now recorded. You can change it later — nothing here is locked.",
    why: "A recorded status is a conversation you won't have to repeat.",
    button: "Set a status",
  },
  {
    number: 3,
    title: "Add your evidence",
    helper: "Type the reference to a procedure or photo on file, or paste in a URL. That's your evidence trail — auditors want to see it.",
    why: "Evidence in now = nothing to scramble for at audit.",
    button: "Add evidence",
  },
  {
    number: 4,
    title: "Give one item an owner and a date",
    helper: "Assign who's responsible and when it's due — like handing out jobs at morning meeting.",
    why: "Gaps get closed when someone owns them.",
    button: "Assign it",
  },
  {
    number: 5,
    title: "You're set",
    helper: "Do a few more when you have a minute.",
    why: "Every item you finish is one less audit surprise.",
    button: "Go to my list",
  },
];

export default function OnboardingOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) { onClose(); return; }
    setStep(s => s + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold leading-snug">Welcome to MacARt — let's start your audit file</h2>
            <p className="text-sm text-muted-foreground mt-1">5 quick steps, about 10 minutes. Stop and come back anytime.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary flex-shrink-0 mt-0.5">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {current.number}
            </span>
            <h3 className="font-semibold text-base">{current.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{current.helper}</p>
          <div className="bg-accent/40 border border-accent rounded-lg px-4 py-3">
            <p className="text-sm text-accent-foreground">
              <span className="font-semibold">Why it matters: </span>{current.why}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {current.button}
            {isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}