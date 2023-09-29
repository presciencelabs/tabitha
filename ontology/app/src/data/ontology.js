/**
 * @typedef Concept
 * @property {number} id
 * @property {string} stem
 */
/** 
 * @type Concept[]
 */
const ontology = [
	{
		id: 1,
		stem: 'stub1',
	},
	{
		id: 2,
		stem: 'stub2',
	},
	{
		id: 3,
		stem: 'stub3',
	},
	{
		id: 4,
		stem: 'stub4',
	},
	{
		id: 5,
		stem: 'stub5',
	},
	{
		id: 6,
		stem: 'dummy1'
	},
	{
		id: 7,
		stem: 'dummy7'
	},
	{
		id: 8,
		stem: 'dummy8'
	},
	{
		id: 9,
		stem: 'dummy9'
	},
	{
		id: 10,
		stem: 'dummy10'
	},
]

export function get_concepts(filter = '') {
	if (!filter) {
		return ontology
	}

	return ontology.filter(({stem}) => stem.includes(filter))
}