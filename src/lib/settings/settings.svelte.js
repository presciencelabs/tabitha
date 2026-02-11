
/** @type {ViewSettings} */
const defaults = {
	show_hover_popups: true,
}
export let view_settings = $state(defaults)

/**
 * 
 * @param {ViewSettings} new_settings 
 */
export function set_settings(new_settings) {
	view_settings.show_hover_popups = new_settings.show_hover_popups
}