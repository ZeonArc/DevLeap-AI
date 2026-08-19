"use client";

import { useEffect, useState, useId } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/lib/theme";

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

  cleaned = cleaned.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/, "");

  cleaned = cleaned
    .split("\n")
    .map(line => line.trimEnd())
    .filter((line, i) => !(i === 0 && line === ""))
    .join("\n")
    .trim();

  return cleaned;
}

/**
 * Mermaid bakes colours into the SVG at render time, so it cannot inherit CSS
 * variables the way the rest of the UI does. We read the active theme's tokens
 * off the document and feed it real values, re-initialising whenever the
 * visitor switches themes.
 */
let initialisedFor: string | null = null;

function initMermaid(themeId: string) {
  if (initialisedFor === themeId) return;

  const cs = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;

  const mono = `${token("--font-jetbrains", "")}, ui-monospace, monospace`;
  const surface = token("--surface", "#151b23");
  const text = token("--text", "#e6edf3");
  const bg = token("--bg", "#0d1117");
  const border = token("--line-strong", "rgba(230,237,243,0.18)");

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    fontFamily: mono,
    themeVariables: {
      background: token("--surface-2", "#0a0e14"),
      primaryColor: surface,
      primaryTextColor: text,
      primaryBorderColor: border,
      secondaryColor: surface,
      tertiaryColor: bg,
      lineColor: token("--alt", "#5fb3a3"),
      textColor: text,
      mainBkg: surface,
      nodeTextColor: text,
      edgeLabelBackground: bg,
      clusterBkg: bg,
      clusterBorder: border,
      fontFamily: mono,
    },
  });

  initialisedFor = themeId;
}

function MermaidDiagram({ code, diagramIdx }: { code: string; diagramIdx: number }) {
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const uniquePrefix = useId().replace(/:/g, "");
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function tryRender() {
      initMermaid(theme);
      const sanitized = sanitizeMermaid(code);
      if (!sanitized) {
        setFailed(true);
        return;
      }

      try {
        await mermaid.parse(sanitized);
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }

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

      if (typeof document !== "undefined") {
        document.querySelectorAll('[id^="d"]  .error-icon, #d mermaid .error-text').forEach(el => el.remove());
      }
    }

    tryRender();
    return () => { cancelled = true; };
  }, [code, diagramIdx, uniquePrefix, theme]);

  if (failed) {
    const sanitized = sanitizeMermaid(code);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--signal-dim)] text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-dim)]" />
          Architecture diagram (source)
        </div>
        <pre className="panel-well p-4 text-xs text-muted overflow-x-auto whitespace-pre-wrap font-mono">
          {sanitized}
        </pre>
      </div>
    );
  }

  if (svgHtml) {
    return (
      <div
        className="panel-well p-4 overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    );
  }

  return (
    <div className="panel-well p-4 flex items-center justify-center py-8">
      <span className="w-4 h-4 border-2 border-signal border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function PortfolioRenderer({ profile }: { profile: DeveloperProfile | null }) {
  if (!profile) {
    return (
      <div className="panel-well p-8 text-center">
        <h2 className="font-display text-xl mb-2">Awaiting repository data</h2>
        <p className="text-sm text-muted">Run an ingestion to see a profile here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-3">summary</p>
        <p className="text-base text-paper leading-relaxed mb-4">{profile.summary.pitch}</p>
        {profile.summary.key_features?.length > 0 && (
          <ul className="space-y-1.5">
            {profile.summary.key_features.map((feature, idx) => (
              <li key={idx} className="text-sm text-muted flex gap-2.5">
                <span className="text-signal">–</span>
                {feature}
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile.skills?.length > 0 && (
        <section>
          <p className="eyebrow mb-3">skills extracted</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.skills.map((skill, idx) => (
              <div key={idx} className="panel-well p-4">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <span className="badge badge-circuit">{skill.level}</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{skill.context}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.architecture_diagrams?.length > 0 && (
        <section>
          <p className="eyebrow mb-3">architecture</p>
          <div className="space-y-6">
            {profile.architecture_diagrams.map((diagram, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-medium mb-1">{diagram.title}</h3>
                <p className="text-xs text-muted mb-3">{diagram.description}</p>
                <MermaidDiagram code={diagram.mermaid_code} diagramIdx={idx} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
