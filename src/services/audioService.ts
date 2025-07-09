import { AudioPro, AudioProContentType, AudioProEvent, AudioProEventType, AudioProTrack } from "react-native-audio-pro";
import EventEmitter, { EmitterSubscription } from "react-native/Libraries/vendor/emitter/EventEmitter";
import { song } from "../types/song";
import { getDatabase } from "./databaseService";

export type PlayerLoopMode = "none" | "loop" | "queue" | "shuffle"
export enum PlayerEventType {
	PROGRESS = "PROGRESS",
	SEEK_COMPLETE = "SEEK_COMPLETE",
	LOOPED = "LOOPED",
	ADDED = "ADDED",
	STOP = "STOP",
	ADDED_QUEUE = "ADDED_QUEUE",
	MOVED_QUEUE = "MOVED_QUEUE",
}
export const playerEmitter = new EventEmitter()

function playerEmit(eventType: PlayerEventType, data?: any) {
	playerEmitter.emit("event", {
		type: eventType,
		data
	})
}

type PlayerEvent = {
	type: "PROGRESS" | "SEEK_COMPLETE",
	data: {
		position: number
		duration: number
	}
} | {
	type: PlayerEventType.LOOPED,
	data: song
} | {
	type: PlayerEventType.ADDED,
	data: song
} | {
	type: PlayerEventType.STOP,
	data: null
} | {
	type: PlayerEventType.ADDED_QUEUE,
	data: song[]
} | {
	type: PlayerEventType.MOVED_QUEUE,
	data: {
		position: number
		queue: song[]
	}
}

export function listenPlayerEvents(
	callback: (event: PlayerEvent) => void
): EmitterSubscription {
	return playerEmitter.addListener("event", callback)
}

let currentlyPlaying: song | null = null
let loopMode: PlayerLoopMode = "none"

let queue: song[] | null = null
let queuePosition: number = 0

export function setupPlayer() {
	AudioPro.configure({
		contentType: AudioProContentType.MUSIC,
	});
}

export function setupListeners() {
	AudioPro.addEventListener(async (event: AudioProEvent) => {
		// console.log("playing:", currentlyPlaying)

		if (event.payload && event.payload.position && event.payload.duration) {
			if (event.type == AudioProEventType.SEEK_COMPLETE) {
				playerEmit(PlayerEventType.SEEK_COMPLETE, {
					position: event.payload.position,
					duration: event.payload.duration
				})
				return;
			}

			if (event.type == AudioProEventType.PROGRESS) {
				playerEmit(PlayerEventType.PROGRESS, {
					position: event.payload.position,
					duration: event.payload.duration
				})
				return;
			}
		}

		if (event.type == AudioProEventType.TRACK_ENDED || event.type == AudioProEventType.REMOTE_NEXT) {
			const [nextSong, nextSongType] = determineNextSong()

			if (nextSong !== null) {
				AudioPlay(nextSong)

				if (nextSongType == PlayerEventType.MOVED_QUEUE) {
					playerEmit(PlayerEventType.MOVED_QUEUE, {
						position: queuePosition,
						songs: queue
					})
				} else {
					playerEmit(nextSongType, currentlyPlaying)
				}
				return;
			}

			AudioPro.clear()
			playerEmit(nextSongType)
			currentlyPlaying = null

			if (queue) {
				queue = null
			}
		}

		// console.log("Sound event!!", event)
	})
}

function determineNextSong(): [song | null, PlayerEventType] {
	if (
		(currentlyPlaying == null && queue == null) ||
		loopMode == "none"
	) return [null, PlayerEventType.STOP];

	if (loopMode == "loop") {
		return [currentlyPlaying, PlayerEventType.LOOPED]
	}

	if (queue && queue.length > 0) {
		if (loopMode == "shuffle") {
			queuePosition = Math.round(Math.random() * queue.length)
			return [queue[queuePosition], PlayerEventType.MOVED_QUEUE]
		}

		if (currentlyPlaying == null && queue.length > 0) {
			queuePosition = 0
			return [queue[0], PlayerEventType.MOVED_QUEUE]
		}

		const currentIndex = queue.findIndex(queueSong => queueSong.id == currentlyPlaying?.id)
		queuePosition = (currentIndex + 1) % queue.length
		const nextSong = queue[queuePosition]
		return [nextSong, PlayerEventType.MOVED_QUEUE]
	}

	return [null, PlayerEventType.STOP]
}

export function updateLoopMode(mode: PlayerLoopMode) {
	console.log("updating loop mode from", loopMode, " to", mode)
	loopMode = mode
}

export function getLoopMode() {
	return loopMode
}

export function getCurrentlyPlaying() {
	return currentlyPlaying
}

export function getQueue() {
	return queue
}

export async function InsertQueue(playlistID: number, autoPlay: boolean = true, startPosition?: number) {
	const database = await getDatabase()

	const [{ rows: results }] = await database.executeSql(
		"SELECT songs.* FROM songs JOIN playlist_song ON songs.id = song_id AND playlist_id = ?",
		[playlistID]
	)
	const songs = results.raw() as song[]
	queue = [...songs];

	if (autoPlay) {
		if (loopMode == "shuffle") {
			queuePosition = Math.round(Math.random() * queue.length)
		} else {
			queuePosition = 0
		}

		AudioPlay(queue[startPosition ? startPosition : queuePosition])
	}

	const result = await database.executeSql(
		"UPDATE playlists SET updated_at = ? WHERE id = ?",
		[new Date().toISOString(), playlistID]
	)

	playerEmit(PlayerEventType.ADDED_QUEUE, [...songs])
}

export async function AudioPlay(song: song) {
	const track: AudioProTrack = {
		id: String(song.id),
		artwork: require("../assets/images/gradient.png"),
		// artwork: "https://angeldav.net/images/boxly.png",
		url: `file://${song.path}`,
		title: song.name,
	}

	currentlyPlaying = song
	AudioPro.play(track)

	const database = await getDatabase()
	const result = await database.executeSql("INSERT INTO recent_songs (song_id) VALUES (?)", [song.id])

	playerEmit(PlayerEventType.ADDED, song)
}