"use client";

import { useEffect, useState, useId } from "react";
import mermaid from "mermaid";

interface Skill {
  name: string;
  level: string;
  context: string;
}

interface ArchitectureDiagram {
  title: string;
  mermaid_code: string;
  description: string;
}

interface ProjectSummary {
  pitch: string;
  key_features: string[];
}

export interface DeveloperProfile {
  skills: Skill[];
  architecture_diagrams: ArchitectureDiagram[];
  summary: ProjectSummary;
}

/**
 * Sanitize Gemini-generated mermaid code for Mermaid v11 compatibility.
 */
function sanitizeMermaid(code: string): string {
  let cleaned = code.trim();

  // Strip ```mermaid ... ``` wrapper
  cleaned = cleaned.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/, "");

  // Normalize whitespace per line
  cleaned = cleaned
    .split("\n")
    .map(line => line.trimEnd())
    .filter((line, i, arr) => {
      // Remove leading blank lines
      if (i === 0 && line === "") return false;
      return true;
    })
    .join("\n")
    .trim();

  return cleaned;
}

// Initialize mermaid once
let mermaidInitialized = false;
function initMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "inherit",
    logLevel: 5, // fatal only, suppress warnings/errors in console
  });
  mermaidInitialized = true;
}

/** Individual mermaid diagram renderer with validation + error handling */
function MermaidDiagram({ code, diagramIdx }: { code: string; diagramIdx: number }) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const uniquePrefix = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;

    async function tryRender() {
      initMermaid();
      const sanitized = sanitizeMermaid(code);
      if (!sanitized) {
        setFailed(true);
        return;
      }

      // Step 1: Validate syntax with parse() first
      try {
        await mermaid.parse(sanitized);
      } catch {
        // Invalid syntax — skip render entirely
        if (!cancelled) setFailed(true);
        return;
      }

      // Step 2: Render to SVG string
      try {
        const renderKey = `mm${uniquePrefix}d${diagramIdx}`;
        const { svg } = await mermaid.render(renderKey, sanitized);
        if (!cancelled) {
          setSvgHtml(svg);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }

      // Step 3: Clean up any stray mermaid error elements from the DOM
      if (typeof document !== "undefined") {
        document.querySelectorAll('[id^="d"]  .error-icon, #d mermaid .error-text').forEach(el => el.remove());
      }
    }

    tryRender();
    return () => { cancelled = true; };
  }, [code, diagramIdx, uniquePrefix]);

  // Fallback: show raw code
  if (failed) {
    const sanitized = sanitizeMermaid(code);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-yellow-500/70 text-[10px] uppercase tracking-widest font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/70" />
          Architecture Diagram (source)
        </div>
        <pre className="bg-black/80 p-4 rounded-lg text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap font-mono border border-white/5">
          {sanitized}
        </pre>
      </div>
    );
  }

  // Rendered SVG
  if (svgHtml) {
    return (
      <div
        className="bg-black/60 p-4 rounded-lg overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }

  // Loading
  return (
    <div className="bg-black/60 p-4 rounded-lg flex items-center justify-center py-8">
      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function PortfolioRenderer({ profile }: { profile: DeveloperProfile | null }) {
  if (!profile) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg mt-8">
        <h2 className="text-2xl font-bold text-primary mb-4">Initializing Profiler...</h2>
        <p className="text-gray-400">Awaiting repository data stream.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in mt-8">
      <section className="glass-panel p-6 rounded-lg border-t-4 border-t-primary">
        <h2 className="text-3xl font-bold gradient-text mb-4">Project Summary</h2>
        <p className="text-lg mb-4 text-gray-200">{profile.summary.pitch}</p>
        <h3 className="text-xl text-primary font-medium mb-2">Key Features</h3>
        <ul className="list-disc list-inside space-y-1">
          {profile.summary.key_features.map((feature, idx) => (
            <li key={idx} className="text-gray-300">{feature}</li>
          ))}
        </ul>
      </section>

      <section className="glass-panel p-6 rounded-lg border-t-4 border-t-primary">
        <h2 className="text-3xl font-bold gradient-text mb-4">Core Skills Extracted</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.skills.map((skill, idx) => (
            <div key={idx} className="border border-white/10 p-4 rounded bg-black/40 hover:border-primary/50 transition-colors duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl font-bold text-gray-100">{skill.name}</span>
                <span className="text-xs uppercase tracking-wider bg-primary/20 text-primary px-2 py-1 rounded">
                  {skill.level}
                </span>
              </div>
              <p className="text-sm text-gray-400">{skill.context}</p>
            </div>
          ))}
        </div>
      </section>

      {profile.architecture_diagrams.length > 0 && (
        <section className="glass-panel p-6 rounded-lg border-t-4 border-t-primary">
          <h2 className="text-3xl font-bold gradient-text mb-4">System Architecture</h2>
          {profile.architecture_diagrams.map((diagram, idx) => (
            <div key={idx} className="mb-8 last:mb-0">
              <h3 className="text-2xl text-primary font-medium mb-2">{diagram.title}</h3>
              <p className="text-gray-400 mb-4">{diagram.description}</p>
              <MermaidDiagram code={diagram.mermaid_code} diagramIdx={idx} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
