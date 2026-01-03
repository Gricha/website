import type { Route } from "./+types/projects";
import { Link } from "react-router";
import type { ReactNode } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Projects | gricha.dev" },
    { name: "description", content: "Projects and open source work" },
  ];
}

interface Project {
  name: string;
  description: ReactNode;
  url?: string;
  github?: string;
  tech?: string[];
  year: string;
}

const projects: Project[] = [
  {
    name: "workspace",
    description:
      "A simple tool in the style of dev containers for optimizing local development flow and parallelizing coding agent execution in a fully sandboxed manner.",
    github: "https://github.com/subroutinecom/workspace",
    tech: ["Go", "Docker"],
    year: "2025",
  },
  {
    name: "FBRetainCycleDetector",
    description:
      "A runtime library for detecting retain cycles in iOS applications. Helps find memory leaks caused by reference cycles in Objective-C code.",
    github: "https://github.com/facebook/FBRetainCycleDetector",
    tech: ["Objective-C", "iOS"],
    year: "2016",
  },
];

const toys: Project[] = [
  {
    name: "cogwork",
    description: (
      <>
        The engine that powers the{" "}
        <Link
          to="/happyholidays"
          className="text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          holiday game
        </Link>
        .
      </>
    ),
    github: "https://github.com/Gricha/cogwork",
    year: "2025",
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const link = project.github || project.url;
  const isGithub = !!project.github;

  return (
    <div
      className="group"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards`,
      }}
    >
      <div className="flex items-baseline gap-3 mb-2">
        <h3 className="text-lg text-gray-900 dark:text-gray-100 font-medium">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              {project.name}
              {isGithub && (
                <svg
                  className="inline-block w-3.5 h-3.5 ml-1.5 opacity-40 group-hover:opacity-100 transition-opacity"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
            </a>
          ) : (
            project.name
          )}
        </h3>
        <span className="text-[11px] text-gray-400 dark:text-gray-600 tracking-wide">
          {project.year}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
        {project.description}
      </p>

      {project.tech && (
        <div className="flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="text-[10px] tracking-wide text-gray-500 dark:text-gray-500 px-2 py-0.5 border border-gray-200 dark:border-gray-800 rounded"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  return (
    <>
      <div className="mb-10">
        <h2 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
          PROJECTS
        </h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"></div>
      </div>

      <div className="space-y-8 mb-16">
        {projects.map((project, index) => (
          <ProjectCard key={project.name} project={project} index={index} />
        ))}
      </div>

      {toys.length > 0 && (
        <>
          <div className="mb-10">
            <h2 className="text-4xl font-semibold mb-3 text-gray-900 dark:text-gray-100 tracking-tight">
              TOYS
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"></div>
          </div>

          <div className="space-y-8">
            {toys.map((project, index) => (
              <ProjectCard
                key={project.name}
                project={project}
                index={projects.length + index}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
