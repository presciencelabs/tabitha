import themes from './src/lib/theme/themes'

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte}'],

	plugins: [
		require('@tailwindcss/typography'),
		require('daisyui'),
	],

	/** @type {import('daisyui').Config} */
	daisyui: {
		themes,
		//TODO: look into this more when the time is right:  https://daisyui.com/docs/config/#rtl
	},
}
