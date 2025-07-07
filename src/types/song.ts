export interface song {
	id?: number
	path: string
	name: string
	duration?: number
}

export interface DB_song extends Omit<song, "duration"> {
	duration?: string
	added_at: string
}