# 0004: daisyUI as the component/design system

## Status

Accepted

## Context

Apps need a consistent, presentable UI without a dedicated designer on the team, on top of an already-chosen Tailwind CSS foundation.

## Decision

Adopt daisyUI as the component and theming layer across all apps.

- Without a dedicated designer, daisyUI's semantic, pre-built components (buttons, cards, modals, themes) give a coherent, reasonably good-looking design system without needing bespoke per-component design decisions.
- This came out of a real, broad comparison against other UI libraries — daisyUI won decisively, not by default.
- A significant part of the decision was trust in the maintainer specifically: the underlying implementation approach was judged the wisest and most comprehensive among the alternatives evaluated, closely matching how the project's own author would have approached the problem. That trust was reinforced by the maintainer's demonstrated responsiveness and engagement — visible in the project's discussion boards, issue tracker, and PR activity — signaling a well-stewarded, actively-maintained dependency rather than a risky one.
- The choice was also a forward-looking bet: even when daisyUI was less comprehensive than it is today, its user-facing API design and underlying implementation quality signaled it would grow into a mature library. That bet has paid off.
- Being free and open-source was what got it evaluated in the first place, ahead of any other factor.

## Alternatives considered

A broad range of other Tailwind-compatible component/UI libraries were evaluated in a direct comparison; daisyUI won across the dimensions above.

## Consequences

- A consistent, presentable UI is achievable across all five apps without a dedicated designer.
- The project takes on a dependency on a single external maintainer's continued health and direction — a risk consciously accepted based on that maintainer's demonstrated track record, rather than left unexamined.
