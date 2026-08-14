/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Preferred piping over creating a bunch of intermediate variables or function composition.
 *
 * Written by ChatGPT (possibly sourced from Eric Elliott: https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d)
 * Keep an eye on https://github.com/tc39/proposal-pipeline-operator
 */
export function pipe<T, R = any>(...fns: Array<(arg: any) => any>): (initial: T) => R {
	return function sequencer(args: T): R {
		return fns.reduce((result, f) => f(result), args as any) as R
	}
}

/**
 * Adapted to allow for async functions, taken from https://stackoverflow.com/a/60137179
 */
export function pipe_async<T, R = any>(...fns: Array<(arg: any) => any>): (initial: T) => Promise<R> {
	return function sequencer(args: T): Promise<R> {
		return fns.reduce(async (result, f) => f(await result), args as any) as Promise<R>
	}
}
