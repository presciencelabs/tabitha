import adjectives from './adjectives'
import prepostional_phrases from './prepostional_phrases'

/** @param {string} input */
export function parse(input) {
	return input
		.replace(/[^ ][0-9]*:([0-9]*)\nP1S\nP1P-eng\nP2-pre\nC\nP2 signoff\nP3 signoff[\n ]*\n/g, '\\v$1 ')
		.replace(/[^ ][0-9]*:([0-9]*)\nReview\nBack Translate[ ]*\nCheck\n[\n ]*\n/g, '\n\n\\v$1 ')
		.replace(/[^ ][0-9]*:([0-9]*)\nScreener\nReviewer\nBacktrans[ ]*\nChecker\n[\n ]*\n/g, '\n\n\\v$1 ')
		.replace(/[0-9]*:([0-9]*)\nScreener\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n.*\n/g, '\n\n\\v $1 ')

		//remove senses and simple words
		.replace(/-[A-Z]([ .!?>/,\]])/g, '$1')
		.replace(/([" []*)[a-zA-Z-]*\//g, '$1')
		.replace(/(\w+) _implicitNecessary/g, '<$1>')
		.replace(/> </g, ' ')
		.replace(/ _1stAs3rd([ .?!])/g, '$1')
		.replace(/(see|saw|know|knew|say|said) \[/g, '$1 that [')

		// verbs that take a clausal argument that are often translated as 'that....'
		.replace(/\[([^[.?!]*) \(implicit-situational\) (.*?)\]/g, '<<$1 $2>>')
		.replace(/\[([^[.?!]*) \(implicit-background\) (.*?)\]/g, '<<$1 $2>>')
		.replace(/\[([^[.?!]*) \(implicit-subaction\) (.*?)\]/g, '<<$1 $2>>')
		.replace(/([ .?!]*)\(implicit-situational\) ([^.?!]*[.?!])/g, '$1 <<$2>>')
		.replace(/([ .?!]*)\(implicit-background\) ([^.?!]*[.?!])/g, '$1 <<$2>>')
		.replace(/([ .?!]*)\(implicit-subaction\) ([^.?!]*[.?!])/g, '$1 <<$2>>')
		.replace(/by( .*?) _implicitActiveAgent/g, '<<by$1>>')
		.replace(/[[\]]/g, '')
		.replace(/([a-z,A-Z])\([^ ]*\)/g, '$1') //Do this before imperatives

		//Imperatives
		.replace(/You \(imp\) ([a-z])/g, (match, p1) => p1.toUpperCase())
		.replace(/You \(imp\) /g, '')
		.replace(/you \(imp\) /g, '')
		.replace(/_excl([ .?!])/g, '$1')
		.replace(/ _inLDV([ .!?,])/g, '$1')
		.replace(/_restrictive /g, '')
		.replace(/_descriptive /g, '')
		.replace(/_routiunely([ .?!])/g, '$1')
		.replace(/_generic([ .?!])/g, '$1')
		.replace(/_frameinferrable([ .?!])/g, '$1')
		.replace(/_morally([ .?!])/g, '$1')
		.replace(/_inclusive([ .?!])/g, '$1')
		.replace(/_modeof([ .?!])/g, '$1')
		.replace(/_adj([ .?!])/g, '$1')
		.replace(/_incl([ .?!])/g, '$1')
		.replace(/each-other/g, 'each other')
		.replace(/(The|the) ([^ ]*?) of (the )?(.+?) _dynamicExpansion/g, '<<$3 $4 of>> $1 $2')
		.replace(/([^ ]*?) of (.+?) _dynamicExpansion/g, '<<$2 of>> $1')
		.replace(/(The|the) ([^ ]*?) of (.+?) _literalExpansion/g, '<<$3 of>> $1 $2')
		.replace(/([^ ]*?) of (.+?) _literalExpansion/g, '<<$2 of>> $1')
		.replace(/the ([^ ]*?) of (.+?) _metonymy/g, '<<$2 of>> the $1')
		.replace(/([^ ]*?) of (.+?) _metonymy/g, '<<$2 of>> $1')
		.replace(/ named /g, ' named& ')
		.replace(/([^ ]*?) named& ([^&]+?) _explainName/g, '<<$2 of>> $1')
		.replace(/([^ ]*?) named& ([^&]+?) _implicitExplainName/g, '<<$2 of>> $1')
		.replace(/&/g, '')
		.replace(/-/g, ' ')
		.replace(/ +/g, ' ')
		.replace(/ _[0-9] /g, ' ')
		.replace(/\\v/g, '\\v ')
		.replace(/_firstMention /g, '')
		.replace(/\\v /g, '\n\\v')
		.replace(new RegExp(`(${adjectives.join('|')}) _implicit`, 'gi'), '<<$1>>')
		.replace(new RegExp(`(\\b(?:${prepostional_phrases.join('|')})\\b\\s+[a-zA-Z ]{1,16})\\s+_implicit`, 'gi'), '<<$1>>')
		.replace(/ _\w+/g, '').replace(/>> <</g, ' ')
}
