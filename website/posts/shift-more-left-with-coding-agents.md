---
title: "Shift more left with coding agents"
date: "January 18, 2026"
author: "Greg Pstrucha"
unlisted: false
---

I use coding agents almost exclusively, and they still produce a lot of slop. I don't mind any of that for prototyping but shipping good-quality software is still *hard*.

By slop, I mean things like **production issues, performance regressions, bad user experience, or unnecessary complexity**. I don't like it growing surface area when it's not needed - it invites more issues in the future. I don't really care about code style/any other type of localized slop.

I don't like the sentiment of "there will be more AI slop and we should just get comfortable with it". It's exhausting. As we move forward we need to end up with very strict codebases where feedback loop is as local as possible and embraces the **"shift left" mentality**.

AI slop isn't new. Sloppy code has always been easier to ship when systems weren't very strict and checks weren't strongly enforced. Before AI, feedback loops and shift-left practices still mattered, but we put more trust in humans to validate changes before checking them in, and as a result the strictness of the codebase mattered less. With AI, we can move much more analysis closer to where code is written, and it's significantly easier to build stronger checks and balances.

## Shift Left

Shift left is the idea that you surface issues as early in the process as possible. IDE diagnostics/type-safety is considered very far to the left, and furthest down are your users finding bugs and reporting them to you. The farther you are, the costlier discovering the bug and the longer the turn around is.

![Shift left diagram showing development timeline from local to production](/shift-left-diagram.png)

With coding agents specifically, I want to shift left as much as possible. It's the same idea as "closing the feedback loop" where agents can generate more meaningful output faster if they are presented with data/tools to obtain that data.

I want to get to the point where, by the time I make a PR, there's a good chance it will be green. This begs the question of what type of validation I can shift over and run locally. I can't do everything. For instance, testing iOS apps from my linux dev server just won't happen, and if my e2e test suites are too big, they would take too much time. Ideally CI then becomes just a smoke test.

Validation such as *code review* can also be shifted, at least partially, to local machine because it can be performed well by a coding agent and doesn't need a human back-and-forth. This is where I started exploring additional skills and sub-agents to make validation process even tighter.

## Low hanging fruits - fast, deterministic feedback

Type checks - depending on language and how good of a type system you have, it's a great value and a no brainer. Tons of issues can be avoided by simply making sure the interfaces align. I'd add to that - type check the interfaces - frameworks like oRPC/tRPC/GraphQL provide a level of validation across the wire.

Enable linters. Most projects do this already. The super power that can get looked over is that you can **create new lint rules**. If I fix a bug, I ask coding agent whether it can design a lint rule to protect us against the same class of bugs. For instance, if you use oRPC for type-safe API calls, you could add a rule that flags direct `fetch` calls to your own API routes - ensuring all requests go through the typed client where the compiler catches mismatched types.

Write tests. Simple unit tests that can run alongside linters, are fast and provide instant feedback are great. I have invested lots of time in making sure some form of end-to-end tests work as well. I make sure I have proper frameworks set up and ready to use for the interfaces I need to access the application - vitest for unit, playwright for Web, maestro for React Native. I'm unsure what to do about TUIs short of running some manual tests in tmux sessions.

Tests have an important caveat - e2e tests can run for very long as your test suite grows. Locally I just instruct the agent to run e2e tests that are related to the set of features it's working on - scoped down to a package, or tighter. There's a lower likelihood that it will break features outside of its scope of work, so we can push the unrelated parts of the test suite to CI. I also don't use test coverage as a metric. [AI can be trigger happy](https://gricha.dev/blog/the-highest-quality-codebase) with that and often produce tests that don't add any value other than false sense of security.

## Human interfaces

Agents are very good at building APIs/other headless functionalities. It's easy for them to consume them and write tests against them. The surface area of the interface is pretty limited.

One fundamental issue with UIs is that **LLMs aren't people**. An AI agent is more accepting of issues in UI, and the complexity introduced in it. It doesn't care if random visual bugs appear, or animations bug out if the final outcome still works according to its acceptance criteria. It can make things pretty, but today a great UX still requires human guidance.

UIs are **notoriously hard to test**. Simple bug in dependency array of `useEffect` can cause random UI jitter under certain conditions, random data/screen flushes, or janky animations are hard to catch. It's very easy to introduce performance regression that can go uncaught.

Because I'm still actively using these apps myself, I am able to notice the issues and fix them, but I struggle with codifying them in the codebase other than through some skills reviewing the code.

## Shift the review left

One of the things that AI allows us to shift left is code reviews.

![Shift left diagram with AI code review moved to local](/shift-left-diagram-ai.png)

I'm not saying to eliminate human code review - for real world brown field application I still want to do them, but they can be enhanced by AI code reviews of various types. I've been experimenting with Sentry's code review and Bugbot in my side projects and the issues they catch are real, and oftentimes go unnoticed by Opus 4.5/GPT 5.2.

The important bit is that this feedback, coming from other machines, doesn't have to be posted on PR (only) - it can and is surfaced much earlier in your agents iteration loop. Agent doesn't have to wait for other humans in that case, so being able to give it a local "review" execution path via MCP/skill/subagent is valuable for two reasons.

First one is that it speeds up the iteration speed being local and integrated with your agent. Second, and more important one, is that you likely have your project set up and running on your local machine, so the review agent could be more capable - it doesn't need to rely on just reading the code. If it suspects the bug is there and it can come up with a reproduction scenario - it could just run it.

A useful extension is asking the subagent running my review to not only provide feedback for current changes, but also suggest improvements to my linting layer that would prevent this type of specific bugs in the future (if it's feasible). I still trust linters more - **they are deterministic**.

I'm currently experimenting with a few other checks. I wrote two subagents - one that wraps [Vercel's React Best Practices](https://vercel.com/blog/introducing-react-best-practices) and validates against them, and second - generic instructions based skill, that validates performance implications of a change.

![Subagents running in parallel performing security, performance, and React best practices reviews](/shift-left-subagents.png)

Another I'm experimenting with is a "code simplifier" which, as part of review, proposes simpler code/solution, finds dead code and so on.

For agent reviews, I don't actually enforce these things to run. The basic checks, like unit tests and lints, can be enforced via pre-commit hooks. For agent's validation/review I prompt it as requirement in AGENTS.md and so far it has been working fine. I still have my CI as my smoke test and you could technically run your own skill-based subagents as "reviewers" in CI.

## Design framework with shift-left in mind

Another way to close the feedback loop is to choose stricter tools that enforce correctness by design. I'm a big proponent of type safety - it improves human reasoning and dramatically improves agent's ability to reason about the code.

A good database-side example is [Convex](https://www.convex.dev/). In it your DB schema, queries and mutations are all colocated typescript code, providing LSP information to your agent. It also has a strong requirement that [schema must match production data](https://docs.convex.dev/production#making-safe-changes) making it much harder for the agent to break your production deployment with bad migration. [Theo covers it in this video very well](https://www.youtube.com/watch?v=B6C-MWCFfAg&t=1140s).

To a lesser extent you can get similar benefits with frameworks such as [Kysely](https://kysely.dev/). It supports type safety for your schema that the agents can benefit from.

And since we are in the times when whipping up your own frameworks is easier than ever, paying attention to making it simple for the machines to use in the future is much more important than it was before.

## Conclusions

We can push more validation into the local layer for agents to interact with and I've seen clear value in that. I've started using more subagents in my own development, delegating some knowledge to skills, and writing custom lint rules to prevent recurring bugs.

I hope to see improvements on the side of UI/UX testing, and controlling the regressions on both performance and UI side. Some of this will come in a form of better SOTA models, some in form of products, and tools that are more aimed at supporting agents. While writing this article I found out about [agent-browser](https://github.com/vercel-labs/agent-browser) that seems like the type of things aiming at improving the agent's ability to not trip over itself.
