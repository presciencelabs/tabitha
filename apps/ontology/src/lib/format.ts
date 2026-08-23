export type LocaleSettings = {
	locale: string
	time_zone: string
}

export function format_datetime(date: Date, { locale, time_zone }: LocaleSettings): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: time_zone }).format(date)
}

export function format_time(date: Date, { locale, time_zone }: LocaleSettings): string {
	return new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: time_zone }).format(date)
}
