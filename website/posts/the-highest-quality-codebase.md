---
title: "The highest quality codebase"
date: "December 7, 2025"
author: "Greg Pstrucha"
---

Have you seen one of [the experiments](https://www.reddit.com/r/ChatGPT/comments/1kbj71z/i_tried_the_create_the_exact_replica_of_this/?utm_source=chatgpt.com) where people have been re-feeding the same image to the AI agent a bunch of times?

Or Marques Brownlee's youtube videos where the [video is reuploaded a 1000 times](https://www.youtube.com/watch?v=JR4KHfqw-oE)?

Over the Thanksgiving weekend I had some time on my hands and tasked Claude to write an app that guestimates macronutrients in some foods based on description + photo. There's some interesting setup in getting it right, but that's boring. It has created a great, functional app for me, but then I forced it to do a small, evil experiment for me.

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

...and havoc it wrecked. Over 200 times of unmitigated madness. I have tweaked the prompt here and there when I've been seeing it overindexing on a single thing, but with enough iterations it started covering a lot of ground.. from full code coverage and more tests than functional code, to rust-style Result types, to.. estimating entropy of hashing function (???).

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

We are talking around 20k lines of TS, around 9.7k is in various `__tests__` directories. This was _slightly_ intentional - when working with Claude Code, having good self-validation harness greatly improves the quality of results.

But let's see the aftermath.

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

**84 thousand!** We went 20k -> 84k on "improvements" to the quality of the codebase.

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

We went from around 700 to a whooping **5369** tests. In the original project I had e2e tests using actual simulator - they are pretty important to make sure that the coding agent has closed feedback loop, but in the process of improving the quality they seemed to have been forgotten ¯\\\_(ツ)\_/¯.

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

I _like_ Rust's result-handling system, I don't think it works very well if you try to bring it to the entire ecosystem that already is standardized on error throwing. In my previous job we experimented with doing that in Python. It wasn't clicking very well with people and using it felt pretty forced. I'd stray away from it.

This made me giggle because of course AI started bringing patterns from Rust. There's [lib/option.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/option.ts) too.

- Functional programming utilities [lib/functional.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/functional.ts) - Type-safe composition, currying, overloads for 20+ params, this has it all.
- Circuit breaking [lib/circuitBreaker.ts](https://github.com/Gricha/macro-photo/blob/highest-quality/lib/circuitBreaker.ts)

## Infra

In some iterations, coding agent put on a hat of security engineer. For instance - it created a `hasMinimalEntropy` function meant to "detect obviously fake keys with low character variety". I don't know why.

To ensure we have proper scalability it has implemented circuit breaking and jittering exponential backoff. The only API we are talking to is OpenAI/Anthropic. You're welcome.

**The positive** - there's been a lot of time spent on making sure that we have strict type checking, we don't overly cast (`as any as T`) and, hey, I respect that.

## The success criteria - Quality Metrics

The prompt, in all its versions, always focuses on us improving the codebase quality. It was disappointing to see how that metric is perceived by AI agent. The leading principle was to define a few vanity metrics and push for "more is better".

In message log, the agent often boasts about the number of tests added, or that code coverage (ugh) is over some arbitrary percentage. We end up with an absolute moloch of unmaintainable code in the name of quality. But hey, the number is going up.

# Summary

All in all, the project has more code to maintained, most of it largely useless. Tons of tests got added, but some tests that mattered the most (maestro e2e tests that validated the app still works) got forgotten. It had some moments of "goodness", like making sure typechecks are of high quality.

To truly resemble the test of "redraw this image 1000 times"/"reupload this video 1000 times", I think the loop would have to be two step:

- Read and summarize the project
- Implement a fresh project based off of this description

This was obviously done in jest, I didn't expect that this will improve the quality of codebase in the ways that I think truly matters. I've prompted Claude Code to failure here and it definitely produced some funny results.

I still use coding agents for my day to day development. If anything it feels like time spent reviewing AI code was not a waste of time.

..oh and the app still works, although it has a few new bugs.
