import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[var(--ink-raised)] border border-[var(--line)] shadow-2xl",
            headerTitle: "text-paper font-semibold",
            headerSubtitle: "text-muted",
            socialButtonsBlockButton: "border-[var(--line)] hover:bg-white/5 text-paper transition-colors",
            socialButtonsBlockButtonText: "font-medium",
            dividerLine: "bg-[var(--line)]",
            dividerText: "text-muted",
            formFieldLabel: "text-muted",
            formFieldInput: "bg-[var(--ink-well)] border-[var(--line)] text-paper focus:border-signal",
            formButtonPrimary: "bg-signal hover:bg-[#edb555] text-[#17130a] transition-colors text-sm py-3",
            footerActionText: "text-muted",
            footerActionLink: "text-signal hover:text-[#edb555] transition-colors",
          },
        }}
      />
    </div>
  );
}
