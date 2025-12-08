---
title: "The highest quality codebase"
date: "December 7, 2025"
author: "Greg Pstrucha"
---

Have you seen one of [the experiments](https://www.reddit.com/r/ChatGPT/comments/1kbj71z/i_tried_the_create_the_exact_replica_of_this/?utm_source=chatgpt.com) where people have been re-feeding the same image to the AI agent a bunch of times?

Or Marques Brownlee's youtube videos where the [video is reuploaded a 1000 times](https://www.youtube.com/watch?v=JR4KHfqw-oE)?

Over the thanksgiving weekend I had some time on my hands and tasked Claude to write me an app to guestimate macronutrients in some foods based on description + photo. There's some interesting setup in getting it right, but that's boring. It has created a great, functional app for me, but then I forced it to do a small, evil experiment for me.

I've written a quick script that looped over my codebase and ran this command.

```bash
#!/usr/bin/env bash

set -euo pipefail

PROMPT="Ultrathink. You're a principal engineer. Do not ask me any questions. We need to improve the quality of this codebase.  Implement improvements to codebase quality."
MAX_ITERS="200"

for i in $(seq 1 "$MAX_ITERS"); do
  claude --dangerously-skip-permissions -p "$PROMPT"

  git add -A

  if git diff --cached --quiet; then
    echo "No changes this round, skipping commit."
  else
    git commit --no-verify -m "yolo run #$i: $PROMPT"
  fi
done
```

...and havoc it wrecked. Over 200 times of unmitigated madness. I have tweaked the prompt here and there when I've been seeing it overindexing in single thing, but with enough iterations it was touching everything.. from full code coverage and more tests than functional code, to rust-style Result types (in Typescript), to.. estimating entropy of hashing function (???).

This was running for around 36 hours and took me some time to grok through, but let's see what it did. The entire [repo is here btw](https://github.com/Gricha/macro-photo/tree/highest-quality). The branch you're looking for is `highest-quality`.

## Pure numbers

This app is around 4-5 screens. Take a photo, add description, get AI response. Simple as that. The version "pre improving quality" was already pretty large:

```shell
cloc . --exclude-dir=node_modules,dist,build,.expo,.husky,.maestro,Pods
     132 text files.
     127 unique files.
      11 files ignored.
github.com/AlDanial/cloc v 2.04  T=0.11 s (1167.4 files/s, 487085.6 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSON                             4              0              0          23733
TypeScript                      99           3019           1541          20160
Markdown                        11           1004              0           2700
JavaScript                       9             26             51            269
Bourne Shell                     2             34             41            213
YAML                             2             35              2            162
-------------------------------------------------------------------------------
SUM:                           127           4118           1635          47237
-------------------------------------------------------------------------------
```

We are talking around 20k lines of TS, around 9.7k is in various `__tests__` directories. This was slightly intentional - when working with Claude Code, I find it having good self-validation harness greatly improves the quality of results.

But let's see what our "principal engineer" did.

```shell
 cloc . --exclude-dir=node_modules,dist,build,.expo,.husky,.maestro,Pods
     285 text files.
     281 unique files.
      10 files ignored.
github.com/AlDanial/cloc v 2.04  T=0.60 s (468.1 files/s, 268654.5 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     247          17587          18749          84185
JSON                             5              0              0          24863
Markdown                        14           4151              0          10391
JavaScript                       9             41            140            598
Bourne Shell                     3             41             41            228
YAML                             3             50              3            215
-------------------------------------------------------------------------------
SUM:                           281          21870          18933         120480
-------------------------------------------------------------------------------
```

**84 thousand!** We went 20k -> 84k on, keep in mind, improvements to the quality of the codebase.

```shell
cloc . \
  --exclude-dir=node_modules,dist,build,.expo,.husky,.maestro,Pods \
  --match-d='__tests__'
     138 text files.
     138 unique files.
       1 file ignored.
github.com/AlDanial/cloc v 2.04  T=0.23 s (612.9 files/s, 346313.3 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     138          13919           3685          60366
-------------------------------------------------------------------------------
SUM:                           138          13919           3685          60366
-------------------------------------------------------------------------------
```

So we went:

- Business logic - 10k -> 20k
- **Tests - 10k -> 60k**

I feel much safer.

For what it's worth, we went from around 700 to a whooping **5369** tests. We also had e2e tests using actual simulator - they are pretty important to make sure that the coding agent has closed feedback loop, but in the process of improving the quality they seemed to have been kinda forgotten ¯\\\_(ツ)\_/¯.

Btw. we went from ~1500 lines of comments to 18.7k.

OK, but what did it _actually do_? I have the full log of what Claude Code was outputting in the summary after every run in. [You can check it here](https://github.com/Gricha/macro-photo/blob/highest-quality/MESSAGE_LOG.md)

## Not-Invented-Here

Claude Code really didn't like using 3rd party libraries and created _a ton_ of [random utilities](https://github.com/Gricha/macro-photo/tree/highest-quality/lib).

I can sort of respect that the [dependency list](https://github.com/Gricha/macro-photo/blob/highest-quality/package.json#L37-L64) is pretty small, but at the cost of very unmaintainable 20k+ lines of utilities. I guess it really wanted to avoid supply-chain attacks.

Some of them are really unnecessary and could be replaced with off the shelf solution:

- Full on hierarchical logger with built in performance tracking instead of using something simple off the shelf [lib/logger.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/logger.ts)
- [React Hooks](https://github.com/Gricha/macro-photo/tree/highest-quality/hooks). Some of them are specific to our use-case, but bunch of them really doesn't have to be reinvented (or invented in the first place).

Some are just insane - here are my favorites!

- The Result Type implementation [lib/result.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/result.ts) - `This module provides a Result type (similar to Rust's Result<T, E>)`.

I _like_ Rust's result-handling system, I don't think it works very well if you try to bring it to the entire ecosystem that already is standardized on error throwing. In my previous job we experimented with doing that in Python. It wasn't clicking very well with people and felt pretty forced.

This made me giggle because of course AI started bringing patterns from Rust. There's [lib/option.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/option.ts) too.

- Functional programming utilities [lib/functional.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/functional.ts) - Type-safe composition, currying, overloads for 20+ params, this has it all.
- Circuit breaking [lib/circuitBreaker.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/circuitBreaker.ts)

## Infra

In some iterations, coding agent put on a hat of security engineer. For instance - it created a `hasMinimalEntropy` function meant to "detect obviously fake keys with low character variety". I don't know why.

To ensure we have proper scalability it has implemented circuit breaking and jittering exponential backoff. Keep in mind the only API we are talking to is OpenAI/Anthropic. You're welcome.

The positive - there's been a lot of time spent on making sure that we have strict type checking, we don't overly cast (`as any as T`) and, hey, I respect that.

## The Quality Metrics

The prompt, in all its versions, always focuses on us improving the codebase quality. It is interesting to see how that metric is perceived by AI agent. It was disappointing to see that the leading principle was to define vanity metrics and push for "more is better".

In message log, the agent often boasts about the number of tests added, or that code coverage (ugh) is over some arbitrary percentage. We end up with an absolute moloch of unmaintainable code in the name of quality. But hey the number is going up.

# Summary

This was obviously done in jest. I'm not anti coding agents by any means. I use them daily for work and side projects. The app I produced at the beginning is actually something that I use for myself now.

It is, however, very funny to see how it operated when I prompted it to failure. It also makes me feel I haven't been wasting my time by reviewing the code that AI produces for the actual work I need done.

..oh and the app still works, although it has a few new bugs.
