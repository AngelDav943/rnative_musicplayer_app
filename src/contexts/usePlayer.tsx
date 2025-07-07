import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AudioPro, AudioProContentType, AudioProEventType, useAudioPro } from "react-native-audio-pro";
import { databaseInit } from "../utilities/database";
import { hasStoragePerms } from "../utilities/basic";
import { DB_song, song } from "../types/song";
import { setting } from "../types/settings";
import { scanSongFolder, scanSongDB } from "../utilities/songDatabase";
import { useDatabase } from "./useDatabase";
import { Animated, Easing, useAnimatedValue, View } from "react-native";
import TabWindow from "../components/TabWindow";
import { useTheme } from "./useTheme";
import PlayerMinimized from "../components/PlayerMinimized";
import PlayerMaximized from "../components/PlayerMaximized";

const playerContext = createContext<any>(null);

interface ProviderUtils {
	position: number | null
	duration: number | null
	allSongs: song[]
	playSong: (songID: number) => void
}

export const usePlayer: () => ProviderUtils = () => {
	return useContext(playerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
	const { primary } = useTheme();
	const { getDB } = useDatabase();

	const { position, duration } = useAudioPro();

	const [currentSong, setCurrentSong] = useState<song | null>(null);
	const [queue, setQueue] = useState([]);
	const [currentQueuePosition, setQueuePosition] = useState<number | null>(null);

	const [allSongs, setAllSongs] = useState<song[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const [minimizedPlayer, setMinimizedPlayer] = useState<boolean>(true);

	const animatedProgress = useAnimatedValue(0);

	async function getAllSongs() {
		let files: song[] = []
		if (await hasStoragePerms() == false) return files;

		const database = await getDB()

		try {
			setLoading(true)
			const [{ rows: data }] = await database.executeSql("SELECT COUNT(*) AS count FROM songs")
			const { count } = data.item(0) as { count: number }

			if (count == 0) {
				files = await scanSongFolder(database);
			} else {
				const [{ rows: last_record }] = await database.executeSql("SELECT * FROM settings WHERE key == \"songs.lastchecked\"")
				const LastChecked = last_record.item(0) as setting

				if (LastChecked == undefined || Date.now() - new Date(LastChecked.value).getTime() > 86400000 * 2) {
					scanSongDB(database)
				}

				const allSongs = (await database.executeSql("SELECT * FROM songs"))[0].rows.raw() as DB_song[]
				allSongs.forEach(item => {
					files.push({ id: item.id, name: item.name, path: item.path, duration: parseInt(item.duration || "0") })
				})
			}
			console.log("SONGFILES:", files)
			setLoading(false)
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
			animatedProgress.setValue(0);
			setCurrentSong(song)
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
								[toDelete], () => { },
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
		position, duration, allSongs, playSong
	}

	async function init() {
		console.log("init")

		AudioPro.configure({
			contentType: AudioProContentType.MUSIC,
		});

		await databaseInit();
		const allFetchedSongs = await getAllSongs()
		setAllSongs(allFetchedSongs);

		// Check for already playing songs
		const playingTrack = AudioPro.getPlayingTrack()
		if (playingTrack) {
			const song = allFetchedSongs.find(item => item.id == parseInt(playingTrack.id));
			if (song) {
				setCurrentSong(song)
			}
		}
	}
	useEffect(() => {
		init()
	}, [])

	useEffect(() => {
		const listener = AudioPro.addEventListener(async (event) => {
			console.log("Sound event!!", event)
			if (event.track !== null && currentSong == null) {
				const song = allSongs.find(item => item.id == parseInt(event.track!.id));
				if (song) {
					setCurrentSong(song)
				}
			}

			if (event.payload && event.payload.position && event.payload.duration) {
				if (event.type == AudioProEventType.SEEK_COMPLETE) {
					animatedProgress.setValue(event.payload.position / event.payload.duration)
					return;
				}

				if (event.type == AudioProEventType.PROGRESS) {
					Animated.timing(animatedProgress, {
						toValue: event.payload.position / event.payload.duration,
						duration: 1100,
						useNativeDriver: false,
						easing: Easing.linear
					}).start()
					return;
				}
			}

			if (event.type == AudioProEventType.TRACK_ENDED) {
				setCurrentSong(null)
			}

		})

		return () => {
			listener.remove()
		}
	}, [loading])

	return (
		<playerContext.Provider value={{ ...exportUtils }}>
			{loading
				? <View>

				</View>
				: <>
					{children}
					<TabWindow
						minimizedState={[minimizedPlayer, setMinimizedPlayer]}
						hiddenState={currentSong == null}
						minimizedChildren={<PlayerMinimized animatedProgress={animatedProgress} currentSong={currentSong} />}
						children={<PlayerMaximized animatedProgress={animatedProgress} currentSong={currentSong} setMinimized={setMinimizedPlayer} />}
					/>
				</>}
		</playerContext.Provider>
	)
}