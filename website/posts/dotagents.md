---
title: "Skills, security and dotagents"
date: "February 17, 2026"
author: "Greg Pstrucha"
---

[Skills](https://agentskills.io/home) have become a common building block for agentic workflows. Most (if not all?) coding agent harnesses support them. I treat them very much as dependencies within the system. As they are capable of introducing new behaviors and whispering into an agent's ear, they should be vetted and kept up to date just as you should do with your code dependencies.

We've built a tool at Sentry called [dotagents](https://github.com/getsentry/dotagents) that is meant to manage the tools that agents use across different agent harnesses.

You can start using `dotagents` by either installing it globally:

`npm install -g @sentry/dotagents`

or using it over npx. Set up by running

`npx @sentry/dotagents init`

It will take you through an interactive wizard that will help set up your initial agents.toml file. It will look something like this:

```toml
version = 1
gitignore = false
agents = ["claude", "cursor"]

[trust]
github_orgs = [ "anthropics" ]
github_repos = [ "getsentry/skills" ]

[[skills]]
name = "code-simplifier"
source = "getsentry/skills"
```

# Why use `dotagents`?

## Dependency Management

Oftentimes skills are useful across multiple repositories in your organization and the current pattern is to pack them up in a [common repository](https://github.com/getsentry/skills) and either install them directly or copy-paste them to a repository. It's hard to keep up to date - you have to do that mostly manually - and difficult to deduplicate that across multiple coding agents (`.agents` vs `.claude` etc.).

There exist tools like `npx skills` which help with skills discovery and installation. However, what I wanted here is something that can help me manage more than just skills (MCPs mostly) and treat the skills as dependencies with version pinning and defining trusted sources.

## Security challenges

The main reason to hesitate to use random skills is that they are a new (and very scary) supply-chain attack vector.

You can read about a great example of a really bad attack [here](https://x.com/theonejvo/status/2015892980851474595). In this case, the attacker injected a malicious skill into one of the skill marketplaces called Clawdhub (meant for OpenClaw assistant agents). The skill simply injects a malicious prompt into one of the skill files without even trying to disguise it.

Even if you read the skills you are adding to your arsenal, you can very very easily miss any malicious instructions. They could be in a file referenced by main SKILL.md (as is described in the article above), could be specifically hidden inside an HTML comment - which will cause it to not render in the pretty GitHub reader. They could also just recommend the agent to install a package that looks innocent but can then be used to exfiltrate data from your machine (i.e install `react-super-awesomeinator` to validate all react changes).

The point is - it's very hard to catch. The attackers have a new vector that can get you pwned in no time. This is even harder if you use any type of skills search engines, where people can maliciously post skills targeted at pwning you.

`dotagents` allows you to define trusted sources:

```toml
version = 1
agents = ["claude", "cursor"]

[trust]
github_orgs = [ "anthropics" ]
github_repos = [ "getsentry/skills" ]
```

In this example, if a developer tries to add a skill from other sources, they should be stopped and limited to only specific trusted repositories. Using the example of [Sentry's skills](https://github.com/getsentry/skills) we could white-list the usage of those and then make sure that we run additional safety checks/[skill scanner](https://github.com/getsentry/skills/tree/main/plugins/sentry-skills/skills/skill-scanner), or external tool to help us build conviction and trust.

## MCP and hooks

We have experimental and limited support for MCP and Hooks management. MCP support should work across our set of supported agents and inject MCP configurations to the respective spots in the configuration files. The same is true of hooks, but as not all agents support hooks (or they diverge too much), the utility is a bit more limited for now. Here's an example of defining MCP server with `dotagents`:

```toml
[[mcp]]
name = "sentry"
url = "https://mcp.sentry.dev/mcp"
```
