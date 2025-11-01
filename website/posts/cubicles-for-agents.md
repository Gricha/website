---
title: "Cubicles for agents"
date: "October 31, 2025"
author: "Greg Pstrucha"
---

I had a pleasure to give a lightning talk at last edition of Claude Code Anonymous in San Francisco a few weeks back, where I chatted about running multiple instances of coding agents in parallel. I've broken this down into two pieces - what are the mechanisms to run the agents in parallel (The Breadth), and how to improve on agent's ability to finish the request successfully without additional user input (The Depth).

# Running the agents in parallel

I've started to explore running agents in parallel a few months ago. I was curious if I can get to the point where I end up using many of them at the same time. Having been at it for a few months, now I run no more than 2-3 at once, but the way I run them feels very enjoyable and not overwhelming.

I think there's a good argument for running more of them if you have very asynchronous workflows to do (refactors, for instance).

Most of my work with agents boils down to either pairing on hard features where I am still very involved, or having it implement a simple feature, fix a bug, or adjust config, where it can one shot it in a few minutes.

## Paradigms of running agents in parallel

![Mechanisms for parallelization](/public/parallelization.png)

I've seen people use parallel coding agents in a few ways so far. I do wanna preface this doesn't really cover _remote_ workflows where the actual work is done via Claude Code web, etc.

## Same directory

I know some people can successfully run a few agents in the same repository and not worry about the potential of agents crashing into each other.

Not for me. This gives me a sense of impending doom.

## Using `git worktrees`

Lots of tools that I see out there offer parallel agent execution utilizing git worktrees. It's pretty good middle ground between no isolation and full on sandboxing.

In this mode, code itself is separated into multiple [git worktrees](https://git-scm.com/docs/git-worktree) which lets the coding agents modify the code however they want without worrying about atomic commits, and stomping on each other and all that fun stuff.

On the other hand this doesn't exactly offer you the **runtime isolation**. These agents can still run on my host machine, if I want a closed feedback loop for them, I need to be able to run all my services for each one of those. There could be port binding conflicts, or overreaching from an eager agent. The concept of me isolating tools available to the sandbox becomes a bit harder (i.e. make it so the agent can't use kubectl/terraform CLI).

I don't trust I can fully close a loop in this model, and I don't necessarily wanna solve that problem either.

I will say however, it's really nice that (compared with sandboxes in the next section) I don't really have to worry about sharing credentials/logging in in each sandbox for agents, or docker, or syncing neovim configuration with sandbox. The host machine is already configured!

## Sandbox

This is how I **actually** run agents for my work. And not only agents, I just run multiple of these for my own development.

It's docker.

Locally I run a few containers that run the exact copy of my development environment. I've created a CLI for it:

<https://github.com/subroutinecom/workspace>

You can give it a whirl

```
npm install -g @subroutinecom/workspace
```

The aim of this tool is to reproduce the dev environment in as simple way as possible with a bunch of common tools in somewhat opinionated way.

The concept is dead simple - the CLI spins up a container for you, clones the repository of your choice, and tries it's darnest to make it resemble your original workspace as closely as possible. It doesn't use devcontainers, nix, or anything requiring specialized knowledge - it's just a simple CLI, and a few bash scripts. But to be useful it supports a bunch of important things out of the box

- Docker-in-docker
  - Starts up common `buildkitd` container to ensure cache sharing between containers, your hard drive will thank you
- Clones private repositories (it either ssh-agent forwards, or straight up copies your ssh keys) from host
- Installs a bunch of tools you might need
  - Claude Code, OpenCode, Codex, aws-cli, docker, neovim
- It exposes SSH port so you can straight up connect VSCode RemoteSSH to it and it'll work just fine
- It volume mounts your home directory in readonly mode, so you just have access to it if you need to fix something up
- Allows you to define any shell bootstrap scripts you need to make sure your thing works from the get go (for example, I have an entire script that just syncs and preconfigures oh-my-zsh + powerlevel10k on start)
  - ~/.workspaces/userscripts for your personal stuff
  - colocated project-specific bootstrap scripts

### My workflow

These workspaces can persist over time, or you can tear them down whenever. I end up just running a few of persistent ones and bring up/take down new ones as I need them.

`workspace start alpha` will get me a workspace named `alpha`. With it I can do a few things out of the box. Each workspace on creation is assigned a persistent SSH port, so in VSCode, using RemoteSSH, I can just add hosts as `localhost:2222` (or whatever post it has been assigned). Or I can run `workspace shell alpha` and kick off NeoVim directly on the container.

In this example I just run my main workspace directly in VSCode. The terminals each run a Codex instance on a separate workspace. Each of these are fully isolated.

<video controls width="100%" className="rounded-lg my-6">
  <source src="/public/videoVscode.mp4" type="video/mp4" />
  Your browser doesn't support video.
</video>

### Testing in browser

You need to proxy relevant ports from the container onto your host when you wanna test your thing in the browser. There's a simple `workspace proxy <name>` that'll get it done. It's an interruptible command that will establish a tunnel for as long as it's running. The ports that will be specifically mapped are defined in the `.workspace.yml` file:

```yaml
repo:
  remote: git@github.com:Gricha/code.git
  branch: main
  cloneArgs: "--depth=1"

forwards:
  - 2900:2950
  - 3432
  - 3007

bootstrap:
  scripts:
    - workspace-scripts/setup-workspace.sh
```

I still didn't solve all friction points that I want. For instance, credential sharing for coding agents isn't yet properly piped through.

### Rationale

The big appeal of full sandbox is that I can just let the agent completely loose there in a --yolo mode. It will have all the tools and all the code for itself and full, free reign. And no other agent will interfere. I've been using this setup for a few months now and it's been delightful. The open source version is what I've created for the purpose of my original talk, but I'm slowly migrating last bits of functionality to it, and using it full time now.

I think lots of this eventually may end up moving to web with tools like Claude Code web, at least for the coding agent. I do find the tool to be super useful _just_ as a development environments. I oftentimes find myself going into one of the workspaces not to run an agent, but just to do some work on isolated copy of my env when I don't wanna stash changes somewhere else and still want full ecosystem running.

---

# Extra - The Depth

This section will cover some of my tips and things I've learned when improving the accuracy and quality of agents in our ecosystem. The impetus for this change is simple - less input from me is less cognitive overhead.

In practice what I found is that the agent needs to understand the goal and have tools to accomplish that goal. The tools usually are just a good developer experience tools that are maybe a bit dumbed down so it's harder for the agent to confuse itself on how to use them.

Here's some tips and tricks of what has worked for me.

### Tip 0 - Instructions

I point the agent at what I consider a finished request. The goal isn't to just implement a feature, it is to make it tested, to validate it runs, and the project builds cleanly.

```AGENTS.md
You MUST make sure that your code compiles, passes lint check, and the test suite passes.
When writing a new feature, API, or workflow you must write new tests for it. If you are changing existing functionality you must fix tests for it. Never delete tests. If you think you need to delete a test, stop what you're doing and ask if you should delete a test.
```

I make it aware that this feedback loop exists and I'm not part of it unless I must be. These instructions later on will include things like what CLI tools we use, how to run tests, and what are the failure scenarios that should prompt the agent to punt out back to me.

### Tip 1 - Simple CLI

We've built a simple CLI for ourselves long time ago. We use it for ourselves because it helps us dump whatever intricacies of running a service are into config files. For each service I can run `subroutine dev <service>` and it's there.

This works pretty well with coding agents. We provide it instructions on what the CLI can do and usually that's enough.

```AGENTS.md
You must use `subroutine` CLI to interact with services in runtime. The binary is installed and part of PATH.
* `subroutine dev <service>` to start a service
* `subroutine test <service>` to test a service
* `subroutine logs <service>` to look up logs
* `subroutine shell <service> -c` to run a command inside the service's container
```

This usually is enough to get a pretty close feedback loop. The simplification of flow is what matters here. A consistent, simple way of interacting with runtime services makes it very predictable and much easier to use by an agent. A good example of it is writing an iOS app and having an agent try to test it by running xcodebuild directly vs. using <https://github.com/cameroncooke/XcodeBuildMCP>.

We also ask the agent to make sure it still builds clean and lints clean. By default that means running 2-3 different commands like `yarn tsc && yarn eslint && yarn playwright test`.
You could wrap it into one command (`subroutine validate <service>`) to make sure that the agent doesn't just drop one of the tasks and hands it off to you "production ready".

### Tip 2 - Watchers

We always run our services automatically. Running `subroutine dev <service>` starts it in a container, sets up a watcher over relevant files and sets up any side processes to run automatically when needed (for instance, regenerating GraphQL types).

We inform an agent upfront that this is the case so, once the service is started, it doesn't have to restart it, but rather interact with logs unless something goes really wrong. The reason this helps is because there's just a few less things that the agent (and the human) have to do to surface the changes in runtime. The loop is shorter with less mechanics.

### Tip 3 - Linters as guard rails

To avoid slop checked in, we still review all the code that AI writes. It can get funky with how it resolves problems with random `setIntervals`, or magical `useRefs` put in directly in the react component . If during a review we find something that is egregious, we'll just take an extra time to slap a lint rule in ESLint to avoid it in the future. Because of Tip 1, this defends pretty well from repeated offenses.

### Tip 4 - Ruthless optimization

If a task has been done poorly, or required my attention, I'll spend time to make sure the agent has some tools to improve in the future where it makes sense.

As an example - I don't want the agent to run my terraform or apply my kubernetes manifests. I run the agent in a sandbox and in it, kubectl is just not available.

As the last resort, I'll update AGENTS.md. I do usually ask the coding agent itself to update the instructions to reflect any learnings from the conversation, but do so in a concise way that I'll then review. I do wanna be careful with that though, because what lands in AGENTS.md ultimately uses up context.

### Developer Experience

Most of these tips really boil down to working on a good developer experinece in the project. Most of those are generally valuable to engineers working inside the same codebase and onboarding agents may be a good excuse to iron out some kinks and provide great DX for everyone. We want to make sure there's a simple way of running the project without arcane knowledge and bespoke tools, surface quality issues quickly and reduce required operations through automation. We are largely able to do it thanks to my cofounder, Jeremy Stanley, who has zero-tolerance for bad developer experience that can be easily automated away.
