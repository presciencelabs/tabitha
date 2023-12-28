export const PRONOUN_RULES = new Map()

const FIRST_PERSON = ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves']
const SECOND_PERSON = ['you', 'your', 'yours', 'yourself']
const THIRD_PERSON = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']

PRONOUN_RULES.set(FIRST_PERSON, 'First person pronouns require their respective Noun in parentheses, e.g., I(Paul).')
PRONOUN_RULES.set(SECOND_PERSON, 'Second person pronouns require their respective Noun in parentheses, e.g., you(Paul).')
PRONOUN_RULES.set(THIRD_PERSON, 'Third person pronouns should be replaced with the Noun they represent, e.g., Paul (instead of him).')
