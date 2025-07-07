import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AudioPro, AudioProContentType } from "react-native-audio-pro";
import { exists, readDir, ReadDirItem } from "react-native-fs";
import { databaseInit, getDatabase } from "../utilities/database";
import { getNameAndExtension, hasStoragePerms } from "../utilities/basic";
import { DB_song, song } from "../types/song";
import { setting } from "../types/settings";
import { ResultSet, SQLiteDatabase } from "react-native-sqlite-storage";
import { scanSongFolder, scanSongDB } from "../utilities/songDatabase";
import { useDatabase } from "./useDatabase";

const playerContext = createContext<any>(null);

interface ProviderUtils {
	songPosition: number | null
	songDuration: number | null
	allSongs: song[]
	playSong: (songID: number) => void
}

export const usePlayer: () => ProviderUtils = () => {
	return useContext(playerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
	const { getDB } = useDatabase();

	AudioPro.configure({
		contentType: AudioProContentType.MUSIC,
	});

	const [songPosition, setSongPosition] = useState<number | null>(null);
	const [songDuration, setSongDuration] = useState<number | null>(null);

	const [queue, setQueue] = useState([]);
	const [currentQueuePosition, setQueuePosition] = useState<number | null>(null);

	const [allSongs, setAllSongs] = useState<song[]>([]);

	async function getAllSongs() {
		let files: song[] = []
		if (await hasStoragePerms() == false) return files;

		const database = await getDB()

		try {
			const [{ rows: data }] = await database.executeSql("SELECT COUNT(*) AS count FROM songs")
			const { count } = data.item(0) as { count: number }

			if (count == 0) {
				files = await scanSongFolder(database);
			} else {
				const [{ rows: last_record }] = await database.executeSql("SELECT * FROM settings WHERE key == \"songs.lastchecked\"")
				const LastChecked = last_record.item(0) as setting

				if (LastChecked == undefined || Date.now() - new Date(LastChecked.value).getTime() > 86400000 * 2) {
					const createSetting = await database.executeSql(
						"INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)",
						["songs.lastchecked", new Date().toISOString()]
					)
					scanSongDB(database)
				}

				const allSongs = (await database.executeSql("SELECT * FROM songs"))[0].rows.raw() as DB_song[]
				allSongs.forEach(item => {
					files.push({ id: item.id, name: item.name, path: item.path })
				})
			}
			console.log("SONGFILES:", files)
			return files
		} catch (error) {
			console.error(error)
		}
		return files
	}

	async function playSong(songID: number) {
		const song = allSongs.find(item => item.id == songID);
		console.log("Found", song)

		if (song == undefined || song.id == undefined) {
			return;
		}

		try {
			console.log("filepath", `file://${song.path}`,)
			AudioPro.play({
				id: String(song.id),
				artwork: require("../assets/images/gradient.png"),
				// artwork: "https://angeldav.net/images/boxly.png",
				url: `file://${song.path}`,
				title: song.name,
			})
		} catch (error) {
			console.warn("err", error)
		}

		const database = await getDB()
		const result = await database.transaction(tx => {
			tx.executeSql(
				"INSERT OR REPLACE INTO recent_songs (song_id) VALUES (?)", [song.id],
				() => tx.executeSql(
					"SELECT COUNT(*) as count FROM recent_songs", [],
					(_, countResult) => {
						const totalRows = countResult.rows.item(0).count;
						if (totalRows > 6) {
							const toDelete = totalRows - 6;
							tx.executeSql(
								`DELETE FROM recent_songs WHERE id IN ( SELECT id FROM recent_songs ORDER BY id ASC LIMIT ? )`,
								[toDelete], () => {},
								(_, err) => {
									console.error("Error deleting old rows:", err);
									return false;
								}
							);
						}
					}
				),
				(tx, err) => {
					console.error("Error inserting recent song, message:", err)
					return false
				}
			)
		}, error => console.error("Error during recent_song database transaction, message:", error))
	}

	const exportUtils: ProviderUtils = {
		songPosition, songDuration, allSongs, playSong
	}

	async function init() {
		console.log("init")
		await databaseInit();
		setAllSongs(await getAllSongs());
	}

	useEffect(() => {
		init()

		const listener = AudioPro.addEventListener((event) => {
			if (event.type == "PROGRESS" && event.payload) {
				if (event.payload.position && songPosition != event.payload.position) {
					setSongPosition(event.payload.position)
				}

				if (event.payload.duration && songDuration != event.payload.duration) {
					setSongDuration(event.payload.duration)
				}
				return;
			}
			console.log("Sound event!!", event)
		})

		return () => {
			listener.remove()
		}
	}, [])

	return (
		<playerContext.Provider value={{ ...exportUtils }}>
			{children}
		</playerContext.Provider>
	)
}