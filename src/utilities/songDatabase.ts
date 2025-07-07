import { ReadDirItem, exists, readDir } from "react-native-fs"
import { ResultSet, SQLiteDatabase } from "react-native-sqlite-storage"
import { DB_song, song } from "../types/song"
import { getNameAndExtension } from "../utilities/basic"

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
	const promises: Promise<[ResultSet]>[] = []
	dir.forEach(item => {
		const [name, ext] = getNameAndExtension(item.name
			.replace("_", " ")
			.replace(/([a-z0-9])([A-Z])/g, (_, a, b) => `${a} ${b}`))

		files.push({
			name: name,
			path: item.path
		})

		promises.push(
			db.executeSql("INSERT INTO songs (path, name) VALUES (?, ?)", [item.path, name])
		)
	})

	const results = await Promise.allSettled(promises)
	const insertIds = results.filter(item => item.status == "fulfilled").map(item => item.value[0].insertId)

	insertIds.forEach((item, index) => {
		files[index].id = item
	})

	console.log("results", results)
	console.log("files res", files)

	return files
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