import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AudioPro, useAudioPro } from "react-native-audio-pro";
import { hasStoragePerms } from "../utilities/basic";
import { DB_song, song } from "../types/song";
import { setting } from "../types/settings";
import { scanSongFolder, scanSongDB } from "../utilities/songDatabase";
import { useDatabase } from "./useDatabase";
import { Animated, BackHandler, Easing, useAnimatedValue, View } from "react-native";
import TabWindow from "../components/TabWindow";
import { useTheme } from "./useTheme";
import PlayerMinimized from "../components/PlayerMinimized";
import PlayerMaximized from "../components/PlayerMaximized";
import { usePages } from "../App";
import SongPreview from "../components/SongPreview";
import { AudioPlay, getCurrentlyPlaying, getLoopMode, getQueue, listenPlayerEvents, PlayerEventType, PlayerLoopMode, updateLoopMode } from "../services/audioService";

const playerContext = createContext<any>(null);

interface ProviderUtils {
	position: number | null
	duration: number | null
	allSongs: song[]
	playSong: (songID: number) => void
	viewSong: (songID: number) => void
	loopMode: PlayerLoopMode
	setLoopMode: React.Dispatch<React.SetStateAction<PlayerLoopMode>>
	queue: song[] | null
	currentSong: song | null
}

export const usePlayer: () => ProviderUtils = () => {
	return useContext(playerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
	const { primary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();
	const { getDB } = useDatabase();

	const { position, duration } = useAudioPro();

	const [currentSong, setCurrentSong] = useState<song | null>(getCurrentlyPlaying());
	const [loopMode, setLoopMode] = useState<PlayerLoopMode>(getLoopMode());

	const [previewSong, setPreviewSong] = useState<song | null>(null);

	const [queue, setQueue] = useState<song[] | null>(getQueue());

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

	async function viewSong(songID: number) {
		const song = allSongs.find(item => item.id == songID);
		if (song == undefined || song.id == undefined) return;
		setPreviewSong(song)
	}

	async function playSong(songID: number) {
		const song = allSongs.find(item => item.id == songID);
		if (song == undefined || song.id == undefined) return;

		try {
			console.log("filepath", `file://${song.path}`,)
			await AudioPlay(song)
			animatedProgress.setValue(0);
			setCurrentSong(song)
		} catch (error) {
			console.warn("err", error)
		}
	}

	const exportUtils: ProviderUtils = {
		position, duration, allSongs, playSong, viewSong,
		loopMode, setLoopMode, queue, currentSong
	}

	async function init() {
		console.log("init")
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
		if (minimizedPlayer == false) {
			const backEvent = BackHandler.addEventListener('hardwareBackPress', () => {
				setMinimizedPlayer(true)
				backEvent.remove()
				return true
			})

			return () => {
				backEvent.remove()
			}
		}
	}, [minimizedPlayer])

	useEffect(() => {
		const subscription = listenPlayerEvents(event => {
			if (event.type == PlayerEventType.STOP) {
				setCurrentSong(null)
				return;
			}

			if (event.type == PlayerEventType.ADDED && (currentSong == null || currentSong.id !== event.data.id)) {
				setCurrentSong(event.data)
			}

			if (event.type == PlayerEventType.SEEK_COMPLETE) {
				animatedProgress.setValue(event.data.position / event.data.duration)
				return;
			}

			if (event.type == PlayerEventType.PROGRESS) {
				Animated.timing(animatedProgress, {
					toValue: event.data.position / event.data.duration,
					duration: 1100,
					useNativeDriver: false,
					easing: Easing.linear
				}).start()
				return
			}

			if (event.type == PlayerEventType.ADDED_QUEUE) {
				setQueue(event.data)
			}

			console.log("PLAYER EVENT:", event)
		})

		return () => {
			subscription.remove()
		}

	}, [loading])

	useEffect(() => {
		updateLoopMode(loopMode)
	}, [loopMode])

	return (
		<playerContext.Provider value={{ ...exportUtils }}>
			{loading
				? <View>

				</View>
				: <>
					{children}
					{previewSong && <SongPreview
						song={previewSong}
						closingCallback={() => setPreviewSong(null)}
					/>}
					<TabWindow
						minimizedState={[minimizedPlayer, setMinimizedPlayer]}
						hiddenState={currentSong == null}
						minimizedChildren={<PlayerMinimized animatedProgress={animatedProgress} currentSong={currentSong} setMinimized={setMinimizedPlayer} />}
						children={<PlayerMaximized animatedProgress={animatedProgress} currentSong={currentSong} setMinimized={setMinimizedPlayer} />}
					/>
				</>}
		</playerContext.Provider>
	)
}