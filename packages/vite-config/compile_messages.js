#!/usr/bin/env node
// @ts-check
// Compiles the current app's Paraglide messages outside of Vite, for svelte-check.
import { compile } from '@inlang/paraglide-js'
import { PARAGLIDE_OPTIONS } from './paraglide.js'

await compile(PARAGLIDE_OPTIONS)
