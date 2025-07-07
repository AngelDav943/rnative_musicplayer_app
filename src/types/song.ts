export interface song {
	id?: number
	path: string
	name: string
}

export interface DB_song extends song {
	added_at: string
}