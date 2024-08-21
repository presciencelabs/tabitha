# TaBiThA

## Apps

### Ontology

https://github.com/presciencelabs/tabitha-ontology

### Sources

https://github.com/presciencelabs/tabitha-sources

### Editor

https://github.com/presciencelabs/tabitha-editor

### Targets

https://github.com/presciencelabs/tabitha-targets

## Databases

https://github.com/presciencelabs/tabitha-databases

## Contributing

### Resources

https://github.com/mdn/curriculum

### Development philosophies

1. classes at end of elements
1. minimal `if`'s
1. code indentation via <kbd>tab</kbd> instead of <kbd>space</kbd>
1. normalize data as close to source as possible, e.g., see how occurrences are handled in the Ontology app
1. pure functions, i.e., no changes outside of scope and no more that one arg at a time
1. components should be self-contained, i.e., always let parent be responsible for layout, positioning, etc., component should not assume anything outside its containment

# TBTA Basics

## What does it do?

### Mark 1:2 NIV

> as it is written in Isaiah the prophet: “I will send my messenger ahead of you, who will prepare your way"

### Encoded into "Phase 1" form

> Isaiah [who told God's messages to people] wrote, ["You(Christ) (imp) listen to me(God)]. I(God) (primary) will send my(God's) person [who takes messages to people] [before I(God) send you(Christ)]. I(God) (meaning-1) will send my(God's) person [who takes messages to people] in-front-of you(Christ). (literal) And that person/messenger will prepare-B your(Christ's) path." (dynamic) And that person/messenger will say/announce [you(Christ) are coming]."

### Encoded into final, "Semantic" form

#### Raw encoding

`~\\wd ~\\tg c-IDp00NNNNNNNNNNNNN.............~\\lu {~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A1SDAnK3NN........~\\lu Isaiah~\\wd ~\\tg c-tDp00NNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A1SDAnK3NN........~\\lu Isaiah~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1DrUINAN...........~\\lu tell~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A2PFAnK3NN........~\\lu message~\\wd ~\\tg n-SNN.N........~\\lu (~\\wd ~\\tg P-1A.....~\\lu -Generic Genitive~\\wd ~\\tg N-1A3SDAnK3NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SdN.N........~\\lu (~\\wd ~\\tg N-1A4PGAnK3NN........~\\lu person~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1CrUINAN...........~\\lu write~\\wd ~\\tg ~\\lu )~\\wd ~\\tg c-PIpMRnNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg r-1A.....~\\lu -QuoteBegin~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A5SDAnK2NN........~\\lu Christ~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1AEUINAN...........~\\lu listen~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg .-~\\lu .~\\wd ~\\tg ~\\lu }~\\wd ~\\tg c-IDpMRnNNNNNNNNNPNN.............~\\lu {~\\wd ~\\tg c-EDpMRnNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg P-1A.....~\\lu before~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1APUINAN...........~\\lu send~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A5SDAnK2NN........~\\lu Christ~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1AEUINAN...........~\\lu send~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A7SFAnK3NN........~\\lu person~\\wd ~\\tg n-SNN.N........~\\lu (~\\wd ~\\tg P-1A.....~\\lu -Generic Genitive~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg c-TDpMRnNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A7SGAnK3NN........~\\lu person~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1APUINAN...........~\\lu take~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A2PGAnK3NN........~\\lu message~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SdN.N........~\\lu (~\\wd ~\\tg N-1A4PGAnK3NN........~\\lu person~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg ~\\lu )~\\wd ~\\tg .-~\\lu .~\\wd ~\\tg ~\\lu }~\\wd ~\\tg c-IDpMRnNNNNNNNNNANN.............~\\lu {~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1AEUINAN...........~\\lu send~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A7SFAnK3NN........~\\lu person~\\wd ~\\tg n-SNN.N........~\\lu (~\\wd ~\\tg P-1A.....~\\lu -Generic Genitive~\\wd ~\\tg N-1A3SDAnK1NN........~\\lu God~\\wd ~\\tg ~\\lu )~\\wd ~\\tg c-TDpMRnNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A7SGAnK3NN........~\\lu person~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1APUINAN...........~\\lu take~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A2PGAnK3NN........~\\lu message~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SdN.N........~\\lu (~\\wd ~\\tg N-1A4PGAnK3NN........~\\lu person~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SNN.N........~\\lu (~\\wd ~\\tg P-1A.....~\\lu in-front-of~\\wd ~\\tg N-1A5SDAnK2NN........~\\lu Christ~\\wd ~\\tg ~\\lu )~\\wd ~\\tg .-~\\lu .~\\wd ~\\tg ~\\lu }~\\wd ~\\tg c-IDpMRnNNNNNNNNNLNN.............~\\lu {~\\wd ~\\tg C-1A.....~\\lu and~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A7SDAcK3NN........~\\lu person/Amessenger~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1CEUINAN...........~\\lu prepare~\\wd ~\\tg ~\\lu )~\\wd ~\\tg n-SPN.N........~\\lu (~\\wd ~\\tg N-1A6SFAnK3NN........~\\lu path~\\wd ~\\tg n-SNN.N........~\\lu (~\\wd ~\\tg P-1A.....~\\lu -Generic Genitive~\\wd ~\\tg N-1A5SDAnK2NN........~\\lu Christ~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu )~\\wd ~\\tg .-~\\lu .~\\wd ~\\tg ~\\lu }~\\wd ~\\tg c-IDpMRnNNNNNNNNNdNN.............~\\lu {~\\wd ~\\tg C-1A.....~\\lu and~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A7SDAcK3NN........~\\lu person/Amessenger~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1CEUINAN...........~\\lu say/Bannounce~\\wd ~\\tg ~\\lu )~\\wd ~\\tg c-PDpMRnNNNNNNNNNNNN.............~\\lu [~\\wd ~\\tg n-SAN.N........~\\lu (~\\wd ~\\tg N-1A5SDAnK2NN........~\\lu Christ~\\wd ~\\tg ~\\lu )~\\wd ~\\tg v-S.....~\\lu (~\\wd ~\\tg V-1APIINAN...........~\\lu come~\\wd ~\\tg ~\\lu )~\\wd ~\\tg ~\\lu ]~\\wd ~\\tg .-~\\lu .~\\wd ~\\tg ~\\lu }`

#### Simplified

`[C [NP Isaiah(N) [C [NP Isaiah(N) ] [VP tell-D(V) ] [NP message(N) [NP -Generic Genitive(Adp) God(N) ] ] [NP person(N) ] ] ] [VP write-C(V) ] [C -QuoteBegin(Par) [NP Christ(N) ] [VP listen(V) ] [NP God(N) ] ] . ] [C [C before(Adp) [NP God(N) ] [VP send(V) ] [NP Christ(N) ] ] [NP God(N) ] [VP send(V) ] [NP person(N) [NP -Generic Genitive(Adp) God(N) ] [C [NP person(N) ] [VP take(V) ] [NP message(N) ] [NP person(N) ] ] ] . ] [C [NP God(N) ] [VP send(V) ] [NP person(N) [NP -Generic Genitive(Adp) God(N) ] [C [NP person(N) ] [VP take(V) ] [NP message(N) ] [NP person(N) ] ] ] [NP in-front-of(Adp) Christ(N) ] . ] [C and(Con) [NP person/Amessenger(N) ] [VP prepare-C(V) ] [NP path(N) [NP -Generic Genitive(Adp) Christ(N) ] ] . ] [C and(Con) [NP person/Amessenger(N) ] [VP say/Bannounce-C(V) ] [C [NP Christ(N) ] [VP come(V) ] ] . ]`

### Generation to target language

_English used as a target language here for simplicity._  Even though the source and the targets are the same, the verses are different due to the simpler grammar.

> Isaiah, who was a prophet, wrote, “Listen to me. Before I send you, I'll send my messenger. And that messenger will prepare your path.

## Components

### Ontology

Holds all of the semantic concepts that can be used in a semantic representation, along with their meanings and expected context.

### Semantic representation

The TBTA-specific encoding for each sentence in the source. This includes the clause/phrase structure and all the features on the concepts.

### Lexicon

The words of a target language, along with their associated features and forms. Some examples are shown below:

1. In English, a singular noun is the same as the noun stem. A plural noun by default adds the suffix 's' (with some exceptions)
1. In English, a noun has a 'Gender' feature marked as Male (use 'he'), Female (use 'she'), or Neuter (use 'it') so the grammar can select the appropriate pronoun.
1. In Tagalog, a noun needs no such feature because there is no grammatical gender (but it will need other features relevant to the Tagalog grammar)
1. In Gichuka, a verb always ends in -a, -ia, or -ii. A 'Final Vowel' feature on the verb tells the grammar what ending to add to the stem.

### Grammar

The rules to accomplish transforming the semantic representation into target language text. Some examples are shown below:

1. In English, add 'that' before a noun that is marked as 'Distal', eg. 'that man (over there)'
1. In English, use the Past form of a verb when marked as 'Discourse' or any level of past
1. In Spanish, place an adjective after the noun.
1. In Gichuka, add a -wa suffix to a passive verb.

## Structures

### Sentence

> John lives in a big house.

#### Phase 1 structure

```mermaid
graph TD
	Sentence -.- s([John lives in a big house.])

	s --> C[Clause]
	s --> P[Punctuation]

	C --> NP1[NounPhrase]
	C --> VP[VerbPhrase]
	C --> NP2[NounPhrase]

	P -.- t([.])

	NP1 --> NP1-N[Noun]
	VP --> VP-V[Verb]
	NP2 --> NP2-Adp[Adposition]
	NP2 --> NP2-FW[FunctionWord]
	NP2 --> NP2-AdjP[AdjectivePhrase]
	NP2 --> NP2-N[Noun]

	NP1-N -.- NP1-N-n([John])
	VP-V -.- VP-V-v([lives])
	NP2-Adp -.- NP2-adp([in])
	NP2-FW -.- NP2-fw([a])
	NP2-AdjP --> NP2-Adj[Adjective]
	NP2-N -.- NP2-n([house])
	NP2-Adj -.- NP2-adj([big])
```

#### Semantic representaion structure

```mermaid
graph TD
	Sentence -.- s([John lives in a big house.])

	s --> C[Clause]
	s --> P[Punctuation]

	C --> NP1[NounPhrase]
	C --> VP[VerbPhrase]
	C --> NP2[NounPhrase]

	P -.- t([.])

	NP1 --> NP1-N[Noun]
	VP --> VP-V[Verb]
	NP2 --> NP2-Adp[Adposition]
	NP2 --> NP2-AdjP[AdjectivePhrase]
	NP2 --> NP2-N[Noun]

	NP1-N -.- NP1-N-n([John])
	VP-V -.- VP-V-v([lives])
	NP2-Adp -.- NP2-adp([in])
	NP2-AdjP --> NP2-Adj[Adjective]
	NP2-N -.- NP2-n([house])
	NP2-Adj -.- NP2-adj([big])
```

### Sentence

> John's very tall friend wants to go to that store.

#### Phase 1 structure

```mermaid
graph TD
	Sentence -.- s([John's very tall friend wants to go to that store.])

	s --> C[Clause]

	C --> NP1-friend[NounPhrase]
	C --> VP1-want[VerbPhrase]
	C --> CSub[Clause]
	C --> P[.]

	NP1-friend --> NP2-John[NounPhrase]
	NP1-friend --> AdjP-tall[AdjectivePhrase]
	NP1-friend --> N1[Noun]
	AdjP-tall --> FW1[FunctionWord]
	AdjP-tall --> Adj1[Adjective]
	NP2-John --> N2[Noun]
	VP1-want --> V1[Verb]

	CSub --> VP2-go[VerbPhrase]
	CSub --> NP3-store[NounPhrase]
	VP2-go --> FW2[FunctionWord]
	VP2-go --> V2[Verb]
	NP3-store --> FW3[FunctionWord]
	NP3-store --> FW4[FunctionWord]
	NP3-store --> N3[Noun]

	N2 -.- N2-John([John's])
	FW1 -.- FW1-very([very])
	Adj1 -.- Adj1-tall([tall])
	N1 -.- N1-friend([friend])
	V1 -.- V1-want([wants])
	FW2 -.- FW2-to([to])
	V2 -.- V2-go([go])
	FW3 -.- FW3-to([to])
	FW4 -.- FW4-to([that])
	N3 -.- N3-store([store])
```

#### Semantic representation structure

```mermaid
graph TD
	Sentence -.- s([John's very tall friend wants to go to that store.])

	s --> C[Clause]

	C -->|Agent| NP1-friend["NounPhrase"]
	C --> VP1-want[VerbPhrase]
	C --> CSub[Clause]
	C --> P[.]

	NP1-friend --> N1[Noun]
	NP1-friend --> AdjP-tall[AdjectivePhrase]
	NP1-friend --> NP2-John[NounPhrase]
	AdjP-tall -->|"Intensified (very)"| Adj1[Adjective]
	NP2-John -->|Relation from 's| Adp1[Adposition]
	NP2-John --> N2[Noun]
	VP1-want -->|Present| V1[Verb]

	CSub -->|"Agent (implied)"| NP4-friend[NounPhrase]
	CSub --> VP2-go[VerbPhrase]
	CSub -->|"Destination (to)"| NP3-store[NounPhrase]
	NP4-friend --> N4[Noun]
	VP2-go --> V2[Verb]
	NP3-store -->|"Contextually Near (that)"| N3[Noun]

	N2 -.- N2-John([John])
	Adp1 -.- Adp1-genitive([-GenericGenitive])
	Adj1 -.- Adj1-tall([tall])
	N1 -.- N1-friend([friend])
	V1 -.- V1-want([want])
	N4 -.- N4-friend([friend])
	V2 -.- V2-go([go])
	N3 -.- N3-store([store])
```
