# Information Security Council, output blocks

Every advisor ends its turn with the block for this run's question type. Generated from the
Claude Code orchestrator (SKILL.md); do not edit by hand.

**PROBABILITY, in every block.** Your estimate, 0 to 100, that with 12 months of hindsight a reviewer would still choose the course in YOUR OWN position over the alternatives, **whether or not an incident happens anyway**. It rates the choice, not the weather. A breach that would have happened under every option does not lower it; a quiet year after a poor choice does not raise it. Not the council's eventual recommendation, which you have not seen. Write the number only: the orchestrator derives the confidence word from it (low < 55, medium 55 to 74, high >= 75).

**CONDITION.** One atomic condition, at most 25 words: the one thing that must be true or must happen for you to move to go. One requirement, not two joined by "and" and not a list. If you need several things, name the one whose absence would change your position most, and put the rest under ASSUMPTIONS. Write "keys issued to the payroll staff first", not "keys issued, sessions revoked and the portal behind SSO". Never write "none" or "n/a" on a conditional position: a placeholder reads as a named condition and passes a comparison it should have failed.

**Decision** (`-type=decision`):
```
STANCE: <go | conditional-go | no-go | defer | reframe>
CONDITION: <required for conditional-go, defer or reframe; omit the line for a plain go or no-go>
PROBABILITY: <0-100>%
ASSUMPTIONS: <the load-bearing assumptions behind my view>
WHAT WOULD CHANGE MY MIND: <the evidence that would flip me>
UNKNOWNS: <what I don't know that matters>
```

**Option choice** (`-type=choice`):
```
CHOICE: <the option I would pick, by its label>
CONDITION: <only if the choice holds only under a condition; otherwise omit the line>
PROBABILITY: <0-100>%
ASSUMPTIONS: <...>
WHAT WOULD CHANGE MY MIND: <...>
UNKNOWNS: <...>
```

**Action plan** (`-type=plan`):
```
FIRST: <the one action to start first, with who does it>
NOT NOW: <the one action to drop or defer to make room, and why>
PROBABILITY: <0-100>%
ASSUMPTIONS: <...>
WHAT WOULD CHANGE MY MIND: <...>
UNKNOWNS: <...>
```

**Bundle**: the block for the primary question's type, then one line per secondary question:
```
SECONDARY <n>: <my one-line answer>
```
