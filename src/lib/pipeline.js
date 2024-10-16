/**
 * preferred piping over creating a bunch of intermediate variables or function composition
 *
 * Written by ChatGPT (possibly sourced from Eric Elliott: https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d)
 * keep an eye on https://github.com/tc39/proposal-pipeline-operator
 *
 * @param  {...Function} fns
 * @returns {Function}
 */
export function pipe(...fns) {
	return sequencer

	/** @param {any} args */
	function sequencer(args) {
		return fns.reduce((result, f) => f(result), args)
	}
}

/**
 * Adapted to allow for async functions, taken from https://stackoverflow.com/a/60137179
 *
 * @param  {...Function} fns
 * @returns {Function}
 */
export function pipe_async(...fns) {
	return sequencer

	/** @param {any} args */
	function sequencer(args) {
		return fns.reduce(async (result, f) => f(await result), args)
	}
}
