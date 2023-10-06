/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte}'],

	plugins: [
		require('@tailwindcss/typography'),
		require('daisyui')
	],

	/** @type {import('daisyui').Config} */
	daisyui: {
		themes: [
			'corporate', // light
			'business',
			// TODO: look into offering some user preferences around themes
		],
		darkTheme: 'business',
		//TODO: look into this more when the time is right:  https://daisyui.com/docs/config/#rtl
	}
}
