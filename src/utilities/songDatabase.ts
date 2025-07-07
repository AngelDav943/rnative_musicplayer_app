import { ReadDirItem, exists, readDir } from "react-native-fs"
import { ResultSet, SQLiteDatabase } from "react-native-sqlite-storage"
import { DB_song, song } from "../types/song"
import { getNameAndExtension, getSongDuration } from "../utilities/basic"

export async function readFolder() {
	const fileList: ReadDirItem[] = []
	const dir = await readDir("/storage/emulated/0/Music")
	const allowedExts = ["mp3", "aac", "m4a", "wav"]
	dir.forEach(item => {
		const [name, ext] = getNameAndExtension(item.name)
		if (
			item.isFile() &&
			item.path.includes(".trashed") == false &&
			allowedExts.includes(ext.toLowerCase())
		) fileList.push(item)
	})
	return fileList
}

export async function scanSongFolder(db: SQLiteDatabase) {
	const files: song[] = []
	const dir = await readFolder()

	// const durationPromises: Promise<number>[] = []
	const promises: Promise<song>[] = []
	dir.forEach(item => {
		const [name, ext] = getNameAndExtension(item.name
			.replace("_", " ")
			.replace(/([a-z0-9])([A-Z])/g, (_, a, b) => `${a} ${b}`))

		files.push({
			name: name,
			path: item.path
		})

		promises.push(new Promise(async (resolve) => {
			const duration = await getSongDuration(item.path)
			const dbItem = await db.executeSql("INSERT INTO songs (path, name, duration) VALUES (?, ?, ?)", [item.path, name, duration])

			resolve({
				id: dbItem[0].insertId,
				name: name,
				path: item.path,
				duration: duration
			})
		}))
	})

	const results = await Promise.allSettled(promises)
	const songs = results.filter(item => item.status == "fulfilled").map(item => item.value)

	// console.log("results", dbResults)
	console.log("songs res", songs)

	return songs
}

// Checks if each song in sqlite database exists on device, if not then delete and do a scan of the songs folder once again
export async function scanSongDB(db: SQLiteDatabase) {
	const allSongs = (await db.executeSql("SELECT * FROM songs"))[0].rows.raw() as DB_song[]

	const deletePromises: Promise<[ResultSet]>[] = []
	allSongs.forEach(item => {
		const doesExist = exists(item.path)

		if (!doesExist) deletePromises.push(db.executeSql(
			"DELETE FROM songs WHERE path = ?", [item.path]
		))
	})

	const deletes = await Promise.all(deletePromises);
	//const filesRescan = await scanSongFolder();

	return []
}