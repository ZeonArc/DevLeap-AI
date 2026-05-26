import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center pt-24">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl",
            headerTitle: "text-white font-bold tracking-tight",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "border-white/10 hover:bg-white/5 text-white transition-colors",
            socialButtonsBlockButtonText: "font-semibold",
            dividerLine: "bg-white/10",
            dividerText: "text-gray-500",
            formFieldLabel: "text-gray-300",
            formFieldInput: "bg-black/40 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20",
            formButtonPrimary: "bg-primary hover:bg-primary-hover text-white transition-colors tracking-wider uppercase font-bold text-xs py-3",
            footerActionText: "text-gray-400",
            footerActionLink: "text-primary hover:text-primary-hover transition-colors",
          },
        }}
      />
    </div>
  );
}
