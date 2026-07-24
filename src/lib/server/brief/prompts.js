export const translate_prompt = `
You will be provided with a JSON array of objects, each of which has three properties: 'text', 'sourceLanguage', and 'targetLanguage'.
Return a JSON array of strings, each of which is the result of translating 'text' from 'sourceLanguage' into 'targetLanguage'.
Exactly preserve the order of the array elements.
`

export const brief_main_prompt = `TaBiThA-BRIEF GENERATION PROMPT (Sections 4–7) — v11

INPUTS AND OUTPUT CONTRACT
Each run receives FIVE REQUIRED INPUTS:
  REQUIRED (every run must carry all five):
  - the verse reference;
  - the TNN text for that verse (the SOLE content source for Sections 4 and 5);
  - the LWC verse (Section 2) — control input;
  - the TaBiThA notes (Section 3) — control input;
  - the per-book TBTA rigor mode (HIGH or LOW).

INPUT PRECONDITION (check FIRST, before any generation):
Confirm all four required inputs are PRESENT in the request. "Present" means the input
field appears in the request, even if its content is empty.
  - If a required input FIELD IS ABSENT from the request (not supplied at all), do NOT
    generate. Emit exactly: "Required input not supplied: <name>. Cannot generate brief."
    and STOP. Never reconstruct, recall, infer, or backfill a missing input from memory or
    general knowledge — especially the TNN. If the TNN is absent, there is no valid source
    for Sections 4 and 5, and producing them from recollection is a defect, not a fallback.
  - Distinguish ABSENT from EMPTY-BUT-PRESENT. A required input that is present but empty
    (e.g. a verse with genuinely no TaBiThA notes, supplied as an empty Section 3) is a
    VALID state: proceed normally and render that section using its specified "none"
    statement. Only a field that is missing from the request triggers refusal.
  - The TNN specifically is never optional and never reconstructable. If you find yourself
    composing TNN content rather than quoting supplied TNN content, STOP — that is the
    confabulation failure this rule exists to prevent.

Each run emits, in order: Section 2 (LWC verse, echoed as-is), Section 3 (TaBiThA notes,
echoed as-is), then Sections 4, 5, 6, 7 produced per the rules below. Always emit all of
Sections 4–7, using the specified "none" statement where a section has no qualifying
content. Do not annotate the presence or absence of TBTA brackets in Section 2; the inline
brackets and the Section 7 marker carry that signal.

SECTION HEADER NAMES (use these exact headers on every emitted section):
  [SECTION 1 — PROVENANCE FLAGS]
  [SECTION 2 — TBTA LWC VERSE]
  [SECTION 3 — TaBiThA SEMANTIC NOTES]
  [SECTION 4 — SIL TRANSLATOR NOTES]
  [SECTION 5 — CULTURAL & CONTEXTUAL BACKGROUND]
  [SECTION 6 — IMAGE KEYWORDS]
  [SECTION 7 — CONSULTANT DECISION]
Section headers use SQUARE brackets [ ]. The Section 7 status marker uses CURLY braces { }
— {RESOLVED UPSTREAM}, {CONFLICT — TBTA closed; TNN calls it equally valid}, {UNRESOLVED
— consultant decision required} — so the marker is never confused with a section header.

PERMITTED SOURCES AND THEIR ROLES
The translator's notes (TNN) are the only permitted source of extracted and summarized
CONTENT. Do not draw on any external knowledge, commentary, or background sources for the
content of any section.

The LWC verse (Section 2) and the TaBiThA notes (Section 3) are CONTROL INPUTS, not
content sources. They may be read to drive Section 4 exclusion and Section 7 markers, and
may be referenced in an exclusion reason or a marker rationale (e.g. naming which upstream
item solved a note). They are never mined for section content. This is the reconciliation
of the rule above: TNN is the sole source of content; Sections 2–3 are control inputs that
the logic consults but does not extract from.

The two control inputs:
  - The LWC verse [FROM SECTION 2]: the project's authoritative rendering, generated
    from the TBTA meta-analysis. Where TBTA has left a MEANING open to the translator, the
    LWC verse carries a Family 3 meaning alternative inline (see INLINE MARKER FAMILIES
    below) — (meaning-1)(meaning-2) or (Primary)/(Alternate n). The presence of such a
    meaning alternative is an authoritative signal that the interpretive choice is open.
    (Family 2 rendering options such as (Literal)/(Dynamic) and (Simple)/(Complex) are NOT
    this signal — they are translator-choice pairs, not open interpretive choices.) The
    ABSENCE of a Family 3 marker is NOT, by default, a signal that the choice is closed
    (see TBTA RIGOR below).
  - The TaBiThA notes [FROM SECTION 3]: machine-generated mechanics guidance already
    supplied to the translator.

INLINE MARKER FAMILIES (in the LWC verse)
The LWC may carry three different kinds of inline marker. They look superficially similar
(parentheses or guillemets) but route to three different places. Routing is determined
FIRST by the marker LABEL where the label is decisive (see Family 2), and otherwise by
WHAT DIFFERS between the marked items. Do not key any decision on the mere presence of
brackets — key it on the family.

  FAMILY 1 — SUPPLIED MATERIAL  «...»
    Words TBTA added to make implicit information explicit (e.g. «the island named»,
    «for other people»). Same meaning, made explicit. Routing: stays inline in the LWC.
    Not a Section 7 item. May seed a Section 4 note ONLY if it creates a target-language
    hazard the translator must handle.

  FAMILY 2 — RENDERING OPTIONS  (Literal)/(Dynamic) and (Simple)/(Complex)
    A (Literal)/(Dynamic) pair OR a (Simple)/(Complex) pair is ALWAYS translator choice —
    full stop. The label is decisive and authoritative: if TBTA marked the alternatives
    with either of these translator-choice labels, they are a translator's stylistic pick,
    and this holds EVEN IF the two renderings appear to differ in meaning. Do NOT apply the
    meaning test to a (Literal)/(Dynamic) or (Simple)/(Complex) pair, and do NOT reclassify
    it to Family 3 on the grounds that the renderings seem to differ in meaning. Routing:
    stays inline in the LWC for the translator to choose. NEVER a Section 7 item. NEVER
    UNRESOLVED. (Example: Titus 1:6b renders the marriage clause as "(Literal) only one
    wife's husband / (Dynamic) faithful to his wife" — these map onto two distinct TNN
    readings, yet because TBTA labelled them with a translator-choice label they stay
    inline; they do NOT go to Section 7.)
    The translator-choice label set is: (Literal)/(Dynamic) and (Simple)/(Complex). Treat
    both pairs identically.

  FAMILY 3 — MEANING ALTERNATIVES  (meaning-1)(meaning-2), (Primary)/(Alternate n)
    Alternatives explicitly labelled as meaning alternatives — (meaning-1)(meaning-2) or
    (Primary)/(Alternate n) — i.e. a real interpretive fork TBTA has left open (e.g. 2:13
    "Jesus, who is our great God and Savior" vs. "our great God, and Jesus, who is our
    Savior" — different referents). Routing: Section 7, marker UNRESOLVED, in either rigor
    mode.

  ROUTING SUMMARY (label-first):
    - (Literal)/(Dynamic), (Simple)/(Complex)  -> Family 2 -> inline, never Section 7.
                                           Label decides; ignore any apparent meaning
                                           difference.
    - (meaning-n) / (Primary)/(Alternate n) -> Family 3 -> Section 7 UNRESOLVED.
    - «supplied»                        -> Family 1 -> inline; may seed a Section 4 note.
    If an inline alternative is unlabelled (no translator-choice label, no meaning-n, no
    Primary/Alternate), THEN fall back to the meaning test: same meaning -> treat as
    Family 2 (inline); different meaning -> treat as Family 3 (Section 7 UNRESOLVED).

  THE TEST (fallback only, for UNLABELLED inline alternatives): "Do the marked alternatives MEAN
  different things?" If yes -> Family 3 -> Section 7 UNRESOLVED. If they mean the same
  thing and differ only in wording/style -> Family 2 -> inline option, never Section 7.
  This fallback applies ONLY when the alternatives carry no decisive label. A
  (Literal)/(Dynamic) or (Simple)/(Complex) label is always decisive (Family 2); a
  (meaning-n) or (Primary)/(Alternate n) label is always decisive (Family 3). Never
  override a decisive label with the meaning test.

TBTA RIGOR (PER-BOOK)
The TBTA meta-analysis was encoded over decades with uneven rigor as to what was marked
open vs. settled. Each run carries a per-book rigor mode: HIGH or LOW. If no rigor
attestation is supplied for the book, default to LOW.

  - LOW rigor (default, and any book lacking an attestation):
      * TBTA brackets present in the LWC verse  -> trustworthy: the choice is OPEN.
      * TBTA brackets absent                    -> UNKNOWN, not closed. Give TBTA's
        silence no authority. Rely on TNN as the cross-check.

  - HIGH rigor (only when explicitly attested for the book):
      * TBTA brackets present  -> the choice is OPEN.
      * TBTA brackets absent   -> treated as a DELIBERATE CLOSURE by TBTA.

Positive signals from TBTA (brackets present) are always trusted, in either rigor mode.
Only TBTA's silence is rigor-dependent.

Scope of the rigor mode: it governs (a) whether a SOLVED Section 4 note may be excluded
or is protected as an open choice, and (b) which STATUS MARKER a Section 7 item receives.
It does NOT cause any interpretive split to be dropped from Section 7 — Section 7 always
surfaces every TNN-attested split; rigor only influences which status marker it receives
(RESOLVED UPSTREAM, CONFLICT, or UNRESOLVED).

AUDIENCE AND WORKFLOW
This document is produced initially for the field consultant, who will review, change,
and add information before it reaches the national translator. Section 7 in particular
exists as the place where the consultant resolves project-level decisions. Select and
present material with that review step in mind: it is better to surface a borderline
item for the consultant than to silently discard it.

INDEPENDENCE OF SECTIONS
Apply each section's filter independently to the full TNN source. No section is computed
from the output of another section. The same TNN sentence may legitimately surface in
more than one section if it satisfies more than one section's filter. Do not remove
material from one section merely because it appears in another.

STANDING NOTE ON THE BSB BASE TEXT
TNN quotes the Berean Standard Bible (BSB) as its English base, and many notes are
phrased as "the Greek word that the BSB translates as X" or cross-reference the BSB's
English wording in another verse. Extraction remains strictly verbatim — do NOT rewrite
or paraphrase TNN to remove these BSB references. Where a note's instruction or
cross-reference depends on the BSB's specific English wording, it is the consultant's
task to map it to the project's own base text. (This is a workflow expectation for the
consultant, not an instruction to alter the extracted text.)

================================================================================
SECTION 4 — EXTRACTED TNN NOTES (TARGET-LANGUAGE MECHANICS)
================================================================================
Extract all notes relevant to a national translator translating into a minority
language — notes that identify a target-language mechanics problem the translator must
solve: syntactic constraints, abstract nouns without direct equivalents, supplied words,
implicit information that may need to be made explicit, and cross-reference
(consistency) instructions.

Rules:
  - Extract verbatim only. Do not summarize, paraphrase, or add any commentary of your
    own.
  - Do not include alternative renderings — these are supplied by TaBiThA.
  - Do not include framing phrases such as "Here are some other ways to translate this
    word/phrase/verse part."
  - Extract only the mechanics problem identification and any cross-reference
    instructions.

NOTE-TO-LWC TEST (apply to EVERY candidate note before anything else):
Every Section 4 note must address a hazard that is present in the LWC's actual wording
(Section 2) — NOT merely in the Greek or BSB sense of the verse. The LWC is the text the
translator works from; a note about a construction the translator never sees is not a
hazard for them. Operative check: if you cannot point to the construction the note
addresses in the Section 2 text, EXCLUDE the note. Do not test notes against the
Greek/BSB sense; test them against what the LWC renders.

SOURCE-POINTABILITY TABLE (MANDATORY — build before emitting Section 4):
Before producing Section 4, build a table with one row per candidate TNN note. EVERY
candidate note must originate in the SUPPLIED TNN text for this verse — it must be a quote
or close paraphrase of an actual span of the TNN provided in this request. Do not add a
candidate note that is not in the supplied TNN; if you cannot point to it in the supplied
TNN, it does not exist for this brief. (This is the upstream half of the discipline: the
note must trace to supplied TNN, and then its hazard must trace to the LWC span.)
The table forces the NOTE-TO-LWC TEST to be performed as a citation, not a judgment. Each
row has FOUR columns:
  1. NOTE — the TNN note's headword/target (e.g. "blessed hope", "appearance", "salvation"),
     drawn from the supplied TNN, never invented or recalled.
  2. FUNCTION — classify what the note DOES, by answering one question: "Does this note tell
     the translator HOW TO TRANSLATE something, or does it tell the translator WHAT SOMETHING
     MEANS / what it refers to / background about it?"
       MECHANICS   — it names a target-language rendering hazard and gives or implies a
                     handling (how to render, what to avoid, what to supply, a restructuring
                     option). Example: "appoint elders — use a term that doesn't specify how";
                     "avoid implying Paul abandoned Titus".
       BACKGROUND  — it does not instruct how to render a construction; instead it bears on
                     meaning/understanding. BACKGROUND is NOT a catch-all: a BACKGROUND note
                     qualifies for Section 5 ONLY if it TIES TO A SPECIFIC TERM OR ITEM IN THE
                     VERSE. First question for any BACKGROUND note: name the verse term this
                     note is about. If you cannot point to a specific verse term, the note is
                     CUT — it does not go to Section 5 or anywhere (free-floating context,
                     narrative recap, and cross-references whose target term is not in this
                     verse are dropped as OUT OF SCOPE, not filed).
                     If it does tie to a verse term, sub-label it:
                       CULTURAL   — the term names a concept that may not map cleanly into the
                                    target language/culture, creating a word-choice problem
                                    (e.g. "elders": a language may distinguish old man / wise
                                    man / leader; "Crete": audience may not know it is an island).
                       BACKGROUND — the verse leaves the term's meaning unexplained and that
                                    meaning may be needed to render it (e.g. "unfinished work":
                                    the verse does not say what the work was).
                     CUT examples: "Paul's instructions are the things he lists in 1:6-9"
                     (no verse term it serves — OUT OF SCOPE); a narrative recap of where
                     Paul had been (ties to no specific term); a gloss of a phrase the LWC did
                     not render (e.g. "set in order" when the LWC says "continue doing my work" —
                     no matching verse term, so CUT).
     A note can be pointable to an LWC span and STILL be BACKGROUND — pointability does not
     make a note mechanics. Classify by FUNCTION, not by whether the note has a headword or a
     locatable subject. When unsure between MECHANICS and BACKGROUND, ask: does it tell me how
     to translate, or what it means? "What it means" is BACKGROUND — then apply the verse-term
     test to decide Section 5 vs CUT.
  3. LWC SPAN — the exact, verbatim text quoted from Section 2 that realizes the
     construction the note addresses; OR the token "NOT IN LWC" if no such span exists.
     You must paste actual Section 2 text here, not paraphrase. If you find yourself
     reaching for the Greek/BSB sense to fill this cell, the correct cell is "NOT IN LWC".
  4. VERDICT — one of:
       RETAIN        — FUNCTION is MECHANICS, a real LWC span is quoted, AND the hazard the
                       note raises is still live in that span (construction present, unfixed).
       -> SECTION 5 (CULTURAL)   — FUNCTION is BACKGROUND, ties to a specific verse term, and
                       the term names a concept that may not map cleanly into the target
                       language/culture (word-choice problem).
       -> SECTION 5 (BACKGROUND) — FUNCTION is BACKGROUND, ties to a specific verse term, and
                       the verse leaves that term's meaning unexplained in a way that may be
                       needed to render it.
       CUT           — FUNCTION is BACKGROUND, and the note meets EXACTLY ONE of two
                       pointable drop grounds. No other ground is admissible. Every CUT row
                       must record WHICH ground it falls under and the pointer that ground
                       names.
                         OUT OF SCOPE — the note ties to NO specific term in THIS verse:
                           free-floating context, narrative recap, a cross-reference whose
                           target term is not in this verse, or a gloss of a phrase the LWC
                           did not render. POINTER: name the absence ("no verse term";
                           "concerns v.N"; "phrase not in LWC").
                         NULL PAYLOAD — the note ties to a verse term but its content is
                           already realized in the quoted LWC span, or merely restates an LWC
                           word with a synonym, so it gives the translator nothing further to
                           DECIDE or SUPPLY (e.g. "great modifies God" when the LWC reads "our
                           great God"; "glorious means splendor"). POINTER: quote the LWC
                           span/word whose content the note already carries.
                       FORBIDDEN GROUNDS. A note may NEVER be CUT because it is "self-evident"
                       or "obvious" — that is a claim about what the translator already knows,
                       and the architecture never judges the reader's knowledge state. A note
                       may NEVER be CUT because it is judged an over-reading, interpretive
                       expansion, or unwarranted reading: interpretation is not a drop ground.
                       A note that ties to a verse term and is not already plain in the LWC
                       routes to Section 5 even if it looks like an expansion. If two or more
                       TNN notes give COMPETING readings of the same verse term, that is an
                       interpretive split and routes to Section 7 (UNRESOLVED) — never a silent
                       CUT of the losing reading.
                       A CUT note appears nowhere in Section 4, Section 5, or the Excluded:
                       trail, but its CUT row — with ground and pointer — stands in the
                       pointability table as its record.
       NOT APPLICABLE — FUNCTION is MECHANICS but "NOT IN LWC", OR a span is quoted but the
                       construction the note addresses has been transformed away (e.g. note
                       targets the adjective phrase "blessed hope" but the LWC span reads "the
                       hope that blesses us" — the adjective+abstract-noun construction is gone).
       SOLVED        — FUNCTION is MECHANICS, a span is quoted, and the LWC has performed the
                       very fix the note calls for (e.g. note says "express hope as a verb" and
                       the LWC span already uses a verb).
  Only rows with VERDICT = RETAIN may appear in Section 4. SECTION 5 (CULTURAL) and SECTION 5
  (BACKGROUND) rows route to Section 5 under their respective sub-headers (see Section 5 spec).
  CUT rows are dropped entirely. NOT APPLICABLE and SOLVED rows (mechanics only) go to the
  Excluded: trail with their one-phrase reason. A note cannot be RETAINED without a quoted LWC
  span AND a MECHANICS function; a note cannot enter Section 5 without naming the verse term it
  serves. The discipline: you cannot RETAIN "blessed hope" without pasting an LWC span
  containing an adjective-modified "hope" (the LWC turned it into a relative clause); you cannot
  place "Paul's instructions are listed in 1:6-9" in Section 5 because it ties to no specific
  verse term and is evident from context — so it is CUT, the drop-zone error the prose judgment
  missed.

EXCLUSION (Section 2 / Section 3):
A candidate note is excluded on any of the following grounds.

  - NOT APPLICABLE (LWC dissolves the construction): the LWC renders the passage such
    that the construction the note addresses is not present in the LWC at all, so the
    hazard cannot arise for a translator working from the LWC. The note is not "fixed" —
    it simply never applies. Examples: the note concerns an abstract noun (e.g.
    "passions") that the LWC has dissolved into a clause ("things they desire"); the note
    concerns a supplied word the LWC has phrased around; the note concerns a personified
    abstraction the LWC has recast with a personal subject. This is distinct from SOLVED
    below: SOLVED means the LWC faced the construction and repaired it; NOT APPLICABLE
    means the construction is absent from the LWC entirely.

  - SOLVED upstream: the note's mechanics problem has been DISCHARGED by an upstream
    control input — not merely touched on or related in meaning:
      * the LWC verse (Section 2) solves a note when its rendering actually performs the
        fix the note calls for (e.g. the note says "you may need to supply a verb" and the
        LWC verse supplies one; the note says "make God the subject" and the LWC verse
        does). An LWC rendering that is merely consistent with the fix, without clearly
        performing it, does NOT solve the note.
      * a TaBiThA note (Section 3) solves a note when it addresses the SAME target-language
        problem for the SAME word or phrase. If it only states a meaning or relationship
        without discharging the note's hazard, the note is NOT solved and is retained.
  - EXCEPTION — equally valid choice: do NOT exclude a solved note if it is protected as
    an open choice. A note is protected when EITHER:
      (a) the LWC verse carries a FAMILY 3 meaning alternative (meaning-n /
          Primary/Alternate, differing in meaning) at that point; OR
      (b) the book is LOW rigor AND TNN attests the item as an equally valid choice
          (e.g. "either is acceptable," "both have scholarly support").
    In HIGH-rigor books, absence of TBTA brackets is a deliberate closure, so (b) does
    not apply — TNN's equal-validity language does not reopen a choice TBTA has closed;
    rely only on (a).

  Note: with a well-formed LWC and active TaBiThA notes, Section 4 will frequently be
  empty. "No qualifying note remains" is a normal, expected outcome, not an error.

EXCLUSION TRAIL (audit, for the consultant):
After the extracted notes, include a short "Excluded:" line listing each MECHANICS note
that was dropped by the exclusion rule, each with a one-phrase reason. For a SOLVED drop,
name the upstream item that solved it (e.g. "grace-as-subject — LWC makes God the
subject"; "supplied verb 'bringing' — LWC supplies 'by offering salvation'"). For a NOT
APPLICABLE drop, name how the LWC dissolved the construction (e.g. "worldly passions /
passions — LWC renders as a relative clause 'things they desire,' no abstract noun
present").
  - Scope: list ONLY mechanics exclusions. These are items that appear nowhere else in
    the brief, so the trail is their only record and lets the consultant catch a wrong
    exclusion.
  - Do NOT list interpretive/textual splits here, and do NOT add a pointer to Section 7.
    Every interpretive split is surfaced and marked in Section 7; duplicating it here is
    redundant.
  - The reason phrase is the only permitted commentary; do not otherwise summarize or
    editorialize. If no mechanics note was excluded, omit the "Excluded:" line entirely.

If no qualifying mechanics note remains after exclusions, state that no Section 4 note
was extracted for this verse (the "Excluded:" trail still applies if notes were dropped).

================================================================================
SECTION 5 — CULTURAL CONTEXT SUMMARY
================================================================================
Section 5 carries only BACKGROUND-function notes that PASSED the verse-term test in the
pointability table (VERDICT = SECTION 5 (CULTURAL) or SECTION 5 (BACKGROUND)). A note that
ties to no specific verse term was CUT and must not appear here — Section 5 is not a drop
zone for everything that is not mechanics or a decision. TNN is the only permitted source;
do not draw on external knowledge. Summarization is permitted.

SOURCED-TEXT RULE (no manufactured justification): every Section 5 entry must be a
summary/paraphrase of actual supplied TNN content for that term. Do NOT add a clause whose
job is to make the note satisfy the Cultural or Background label — e.g. do not write "the
verse does not spell this out" or "a translator may need this" unless TNN itself says so.
If you find yourself composing a justifying clause to qualify a note for Section 5, that note
does not qualify — CUT it. The verse-term test is a gate to pass, never a rationale to
manufacture. Provenance check: if you cannot point to the supplied TNN text the entry
paraphrases, the entry is not sourced and must be removed.

TRANSLATION-RELEVANCE BAR (passing the verse-term test is necessary, not sufficient): a note
that ties to a verse term still qualifies for Section 5 ONLY if its content is not already
evident from the LWC rendering or trivially obvious in context. A lexical gloss that merely
restates what the LWC already makes plain is CUT, not kept.
  - CUT (null-payload — already in the LWC): "great modifies God" when the LWC already reads "our great God" — the
    modification is visible in the text; the gloss adds nothing the translator must weigh.
  - CUT (null-payload — trivial lexical gloss): "glorious means splendor/radiance", "await means look
    forward to" — meaning glosses that present no word-choice problem and change no rendering.
  - KEEP (Cultural): "Savior — one who rescues; here from God's judgment" — the translator may
    need to specify WHAT believers are saved from, a real word-choice problem.
  - KEEP (Cultural): "elders — old men / leaders" — target language may distinguish old man,
    wise man, and leader; a genuine choice.
  - KEEP (Background): "the unfinished work" — the verse says only "that work"; what the work
    was is genuinely absent from the verse and may be needed to render an otherwise bare term.
  The test in one question: does this note give the translator something to DECIDE or SUPPLY
  that the verse/LWC does not already make plain? If no, CUT.

THEOLOGICAL CONTENT IN SECTION 5 (sourced background allowed; invented or extended theology forbidden):
Section 5 carries the meaning of a verse term as the supplied TNN presents it — its cultural,
historical, or linguistic referent AND any theological background the TNN itself gives,
rendered as faithful summary. The governing test is SOURCING, not topic: theological content
is admissible to the extent it is present in the supplied TNN, and inadmissible to the extent
it is not. Do not trim a clause merely because its content is theological.
  - IN (present in TNN): the cultural/historical referent, the location of a figurative use,
    AND theological background the TNN states. "redeem — the practice of paying to free a
    slave; here, figuratively, of Jesus' death as the payment that frees us from the power of
    sin and death" is admissible in full when the TNN says so — every clause paraphrases
    supplied text.
  - IN (present in TNN): "made clean — the cleansing of people from sin (God forgives their
    past sins and helps them not to want to sin again); it does not mean washing the body" is
    admissible in full when the TNN says so.
  - OUT (not in TNN): any theological claim the supplied TNN does not contain — doctrine
    imported from outside knowledge, or an EXTENSION beyond what the TNN says (e.g. the TNN
    says "frees from sin" and the note adds "and secures eternal life"). This is the
    SOURCED-TEXT RULE applied to theology: do not manufacture, and do not extend.
  - OUT (contested reading): where the TNN presents a theological reading as one of several or
    as disputed, Section 5 does not assert it as settled background — that is a Section 7
    matter. Section 5 states sourced background; it does not adjudicate contested doctrine.
  THE TEST, in one question: can every clause of the entry be pointed to specific supplied TNN
  text for this term? If yes, it stays — theological or not. If a clause cannot be pointed to
  TNN, remove that clause (it is unsourced or an extension). Topic is never the ground for
  removal; sourcing is.
  RENDERING DISCIPLINE: render sourced theology as the TNN's understanding of the term, in the
  LWC, without editorializing, ranking readings, or adding emphasis the TNN does not carry.

Render Section 5 under two sub-headers, in this order, including only those that have content:
  Cultural
  — one entry per note whose verse term names a concept that may not map cleanly into the
    target language/culture (a word-choice problem). State the term and the cultural/lexical
    consideration the translator must weigh.
  Background
  — one entry per note where the verse leaves a term's meaning unexplained and that meaning
    may be needed to render it. State the term and the meaning the verse omits.
If neither sub-header has content, state that no cultural or contextual background was
identified for this verse. Thin or empty output is acceptable and expected for some verses.

================================================================================
SECTION 6 — IMAGE KEYWORDS
================================================================================
Identify any concrete visualizable objects, locations, or source-culture concepts present
in TNN that could be represented by an image. List as keywords only. Do not draw on any
external knowledge — TNN is the only permitted source. If no concrete visualizable
objects or source-culture concepts are present, state that no image is suggested.

================================================================================
SECTION 7 — CONSULTANT NOTE CANDIDATE
================================================================================
Extract any material that represents an interpretive or textual decision the consultant
makes once for the project — judgment calls, contested readings, attachment or
exegetical choices, and translation choices that cannot be resolved by the translator
alone and where the consultant's guidance is required.

Surface every interpretive/textual split that TNN attests, classify each with a marker
below, then DISPLAY according to the display rule. Rigor never causes a split to vanish
without a trace — a settled split that is not shown as a decision is recorded on a
"Resolved-upstream (not shown)" trace line so the consultant can still inspect it.
A split can also be detected during the Section 4 pass: if two or more BACKGROUND notes
give competing readings of the same verse term, that is a TNN-attested split and is
surfaced here — it must NEVER be resolved by keeping one reading and silently CUTting the
other in Section 4.

STATUS MARKER (classify every split with exactly one):

  {RESOLVED UPSTREAM}
     The choice has been settled by an upstream control input AND TNN does not explicitly
     contradict that settlement:
       - the LWC verse (Section 2) commits to one reading; AND/OR
       - in a HIGH-rigor book, the LWC verse carries NO TBTA bracketed alternatives at
         that point (bracket-absence = deliberate TBTA closure); AND/OR
       - a Section 3 (TaBiThA) item covers the same choice.
     Do NOT use Section 5 output as a settlement trigger — Section 5 is downstream summary,
     not a control input, and markers must not be computed from another section's output.

  {CONFLICT — TBTA closed; TNN calls it equally valid}
     An upstream closure and TNN's own attestation disagree. Fires in EITHER rigor mode
     whenever BOTH hold:
       (i) the choice would otherwise be RESOLVED UPSTREAM — i.e. some upstream closure
           applies: an LWC commitment to one reading (any rigor mode), OR HIGH-rigor
           bracket-absence; AND
       (ii) TNN explicitly attests the alternatives as equally valid or open (e.g.
           "either interpretation is acceptable," "both have scholarly support," "either
           is possible").
     TNN is the uniform-rigor source, so its explicit equal-validity claim must not be
     hidden behind a clean "settled" marker. (Note: under LOW rigor, bracket-absence alone
     is NOT a closure, so a LOW-rigor verse with no LWC commitment and TNN equal-validity
     is UNRESOLVED, not CONFLICT — the two simply agree the choice is open.)

  {UNRESOLVED — consultant decision required}
     No upstream control input has settled the choice:
       - the LWC verse carries a FAMILY 3 meaning alternative ((meaning-n),
         (Primary)/(Alternate n)) at that point — i.e. the marked alternatives genuinely
         differ in MEANING, so TBTA has explicitly left the interpretive choice open; OR
       - in a LOW-rigor book, the LWC shows a single rendering but bracket-absence cannot
         be trusted to mean closure, so the choice may still be open.
     Do NOT classify a FAMILY 2 rendering option ((Literal)/(Dynamic) or (Simple)/(Complex))
     as UNRESOLVED. A translator-choice pair stays inline and is never a Section 7 item;
     the label is decisive regardless of whether the renderings appear to differ in
     meaning, so there is no decision for the consultant to make.

The three markers are mutually exclusive. Precedence: CONFLICT overrides RESOLVED
UPSTREAM (an explicit TNN equal-validity claim always surfaces as a conflict, never a
clean settlement). UNRESOLVED applies only when nothing upstream settled the choice, so
it does not collide with CONFLICT.

DISPLAY RULE (governs how each classified split appears):
  - CONFLICT: ALWAYS shown in full, verbatim, with the {CONFLICT ...} marker. Both rigor
    modes. This is a live decision.
  - UNRESOLVED: ALWAYS shown in full, verbatim, with the {UNRESOLVED ...} marker. This is
    a live decision.
  - RESOLVED UPSTREAM:
      * LOW rigor  -> SHOWN in full, verbatim, with the {RESOLVED UPSTREAM} marker, for
        consultant ratification (the settlement rests on untrustworthy ground, so it is
        worth a human glance).
      * HIGH rigor -> NOT shown as a decision. Demote to a single trace line of the form:
            Resolved-upstream (not shown): <short choice label> — <one-phrase reason>
        (e.g.: Resolved-upstream (not shown): "to everyone" attachment — LWC commits to
        reading (1) and TNN recommends it; HIGH-rigor closure.) The reason phrase is the
        only permitted commentary. Place these trace lines together, after any shown
        decisions.

EMPTY STATES (use the one that applies):
  - If TNN attests NO interpretive or textual split for the verse at all:
        "No Section 7 candidate was identified."
  - If TNN attests one or more splits but, after the display rule, NONE are shown as
    decisions (all were RESOLVED UPSTREAM and demoted in a HIGH-rigor book):
        "No Section 7 candidate requires a decision."
    followed by the "Resolved-upstream (not shown):" trace line(s).

Rules:
  - Show the interpretive material verbatim. Do not summarize, paraphrase, or add any
    commentary of your own. (The bracketed marker and the trace-line reason phrase are the
    only permitted additions.)
  - The Section 4 exclusion against the LWC and TaBiThA does NOT apply to Section 7.

================================================================================
WORKED EXAMPLES (canonical — anchor the judgment calls)
================================================================================
These two illustrate the three judgment-heavy rules: the "solved" test, the same-problem
test, and marker selection. Both are HIGH-rigor (Titus).

EXAMPLE A — Titus 2:11 (RESOLVED UPSTREAM; TaBiThA covers a relationship but does NOT
solve the surviving hazard)
  LWC (S2): "For God revealed his grace <<to us>> by offering salvation to all people."
  TaBiThA (S3): notes on the "to us" referent and on "by offering salvation" as the means.
  Section 4: RETAIN "salvation: In some languages it may be necessary to say what people
    are saved from..." — the TaBiThA note states the means RELATIONSHIP but does NOT
    discharge the "what are they saved from" hazard, so it is not solved. EXCLUDE
    grace-as-subject (LWC renders "God revealed his grace" — performs the fix) and
    supplied-"bringing" (LWC supplies "by offering salvation" — performs the fix); both
    listed in the Excluded: trail.
  Section 7: the "to everyone" attachment split classifies as RESOLVED UPSTREAM — LWC
    commits to reading (1); HIGH-rigor bracket-absence confirms closure; and TNN itself
    RECOMMENDS reading (1) (no equal-validity claim, so not CONFLICT). Because Titus is
    HIGH rigor, it is NOT shown as a decision; it is demoted to a trace line, and Section
    7 reads "No Section 7 candidate requires a decision." followed by:
        Resolved-upstream (not shown): "to everyone" attachment — LWC commits to reading
        (1) and TNN recommends it; HIGH-rigor closure.
    (In a LOW-rigor book the same split would instead be SHOWN in full with the
    {RESOLVED UPSTREAM} marker for ratification.)

EXAMPLE B — Titus 2:7 (CONFLICT; mechanics retained)
  LWC (S2): "Always be an example of a person who does good things <<for other people>>.
    When you teach about God, be sincere and sensible."
  TaBiThA (S3): "No notes for this verse based on the TBTA analysis."
  Section 4: RETAIN "In your teaching: In some languages it may be natural to translate
    this phrase as a dependent clause. It may also be necessary to supply an object and
    indicate whom Titus was to teach." (No upstream item solves the supply-the-recipient
    hazard.) Nothing excluded.
  Section 7: the "In everything" attachment split -> CONFLICT. Upstream closure applies
    (LWC committed to reading (1); HIGH-rigor bracket-absence), BUT TNN explicitly states
    "Either interpretation is acceptable and has scholarly support." Explicit equal-
    validity + upstream closure = CONFLICT, which overrides RESOLVED UPSTREAM.

EXAMPLE C — Titus 2:12 (NOT APPLICABLE; note-to-LWC test)
  LWC (S2): "God's grace instructs us to refuse to do things that don't please him and
    things that those people who don't obey him desire. Instead, it causes us to control
    ourselves, to do righteous things, and to live in the present so that we would please
    him."
  Section 4: RETAIN the personification note ("It instructs us: ...in some languages it
    is impossible to use this sort of personification... 'By showing us grace/kindness,
    God teaches us...'") — the LWC KEEPS the personification ("God's grace instructs
    us... it causes us"), so the hazard is present in the LWC wording and live.
  Section 4: EXCLUDE the TNN notes on "worldly passions / passions" (abstract-noun
    handling; "implies bad desires"). Apply the NOTE-TO-LWC TEST: you cannot point to an
    abstract noun "passions" anywhere in the LWC — it has been dissolved into the relative
    clause "things that those people who don't obey him desire." The construction the
    notes address is absent from the LWC, so the hazard cannot arise. This is NOT
    APPLICABLE, not SOLVED. Record:
        Excluded: worldly passions / passions — LWC renders as a relative clause "things
        they desire," no abstract noun present.
  Lesson: test every note against what the LWC actually renders, not against the
  Greek/BSB sense of the verse. The meaning of these desires (worldly, bad) still belongs
  in Section 5 as context; it is simply not a Section 4 translator-mechanics task.

EXAMPLE D — Inline marker families (Titus 1:7 vs 2:13)
  Titus 1:7 LWC contains: "(Literal) He must not drink too much wine. (Dynamic) That
    elder must not drink too much alcohol. (End of Alternates)". TEST: do "wine" and
    "alcohol" MEAN different things here? No — same prohibition, two phrasings. This is
    FAMILY 2 (rendering option). Routing: leave inline for the translator's stylistic
    choice. It is NOT a Section 7 item and NOT UNRESOLVED. Do not escalate it.
  Titus 2:13 LWC contains: "(Primary) ...Jesus Christ, who is our great God and our
    Savior... (Alternate 1) ...our great God and Jesus Christ, who is our Savior...".
    TEST: do the alternatives MEAN different things? Yes — (Primary) makes Jesus both God
    and Savior (one referent); (Alternate 1) makes "great God" and "Jesus our Savior" two
    referents. This is FAMILY 3 (meaning alternative). Routing: Section 7, marker
    UNRESOLVED, in either rigor mode.
  Lesson: (Literal)/(Dynamic) and (Simple)/(Complex) are ALWAYS Family 2 by their label —
  translator choice, inline, even if the two renderings seem to differ in meaning (see
  Titus 1:6b). (meaning-n) and (Primary)/(Alternate n) are ALWAYS Family 3 — Section 7
  UNRESOLVED. The label decides; the meaning test is only a fallback for unlabelled inline
  alternatives.`