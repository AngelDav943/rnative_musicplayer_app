import React, { Fragment, useEffect, useState } from 'react'
import { BackHandler, ColorValue, Image, ImageSourcePropType, Pressable, PressableStateCallbackType, ScrollView, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native'
import { song } from '../types/song'
import { useTheme } from '../contexts/useTheme'
import LinearGradient from 'react-native-linear-gradient'
import { formatTime, getComicNueueFont } from '../utilities/basic'
import { usePlayer } from '../contexts/usePlayer'
import { playlist } from '../types/playlist'
import { useDatabase } from '../contexts/useDatabase'

interface SongPreviewProps {
	closingCallback: () => void
	song: song
}

export default function SongPreview({ song, closingCallback }: SongPreviewProps) {
	const { getDB } = useDatabase();

	const { background, onBackground, primary, secondary, surface, onPrimary } = useTheme();
	const { playSong } = usePlayer();

	function buttonStyle(
		state: PressableStateCallbackType,
		backgrounds: { normal: ColorValue, pressed: ColorValue } = { normal: primary, pressed: secondary }
	): StyleProp<ViewStyle> {
		return {
			backgroundColor: state.pressed ? backgrounds.pressed : backgrounds.normal,
			paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8,
			flexDirection: "row", alignItems: "center", gap: 8
		}
	}

	const textStyle: StyleProp<TextStyle> = {
		fontFamily: getComicNueueFont("bold"),
		color: onPrimary,
		fontSize: 24
	}

	const [playlists, setPlaylists] = useState<playlist[]>();

	async function getPlaylists() {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"SELECT DISTINCT playlists.* FROM playlists LEFT JOIN playlist_song ON playlists.id = playlist_id AND song_id = ? WHERE song_id IS NULL",
			[song.id]
		)
		const playlists = results.raw() as playlist[]
		setPlaylists(playlists)
	}

	async function addSongToPlaylist(songID: number, playlistID: number) {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"INSERT OR IGNORE INTO playlist_song (song_id, playlist_id) VALUES (?, ?)",
			[songID, playlistID]
		)

		setPlaylists(current => {
			if (!current) return current
			const newList = [...current]
			const idToRemove = newList.findIndex(item => item.id == playlistID)
			newList.splice(idToRemove, 1)
			return newList
		})
	}

	function Button(
		{ label, onPress, icon, backgrounds = { normal: primary, pressed: secondary } }: {
			label: string, onPress?: () => void, icon: ImageSourcePropType, backgrounds?: { normal: ColorValue, pressed: ColorValue }
		}
	) {
		return <Pressable style={(state) => buttonStyle(state, backgrounds)} onPress={onPress}>
			<Image source={icon} style={{ width: 42, aspectRatio: 1 }} />
			<Text children={label} style={textStyle} />
		</Pressable>
	}

	const [currentPage, setCurrentPage] = useState<keyof typeof editPages>("home")
	const editPages = {
		"home": <Fragment>
			<Button label='Play song' icon={require("../assets/images/play.png")} onPress={() => {
				if (!song.id) return;
				playSong(song.id)
				closingCallback()
			}} />
			<Button label='Add to playlist' icon={require("../assets/images/folder.png")} onPress={() => {
				if (!song.id) return
				setCurrentPage("playlist")
			}} />
			<Button label='Edit song info' icon={require("../assets/images/gear.png")} onPress={() => {
				if (!song.id) return

			}} />
		</Fragment>,
		"playlist": <Fragment>
			<Button label='Go back' icon={require("../assets/images/arrow_left.png")} onPress={() => {
				if (!song.id) return
				setCurrentPage("home")
			}} />
			<View style={{ height: 8 }} />
			{playlists && playlists.map(playlist => {
				return <Button
					key={playlist.id}
					icon={require("../assets/images/note_queue.png")}
					label={playlist.name}
					backgrounds={{
						normal: playlist.color,
						pressed: background
					}}
					onPress={() => {
						if (song.id) addSongToPlaylist(song.id, playlist.id)
					}}
				/>
			})}
		</Fragment>
	} as const

	useEffect(() => {
		getPlaylists()
	}, [])

	useEffect(() => {
		const backEvent = BackHandler.addEventListener('hardwareBackPress', () => {
			if (currentPage == "home") {
				closingCallback()
			} else {
				setCurrentPage("home")
			}
			backEvent.remove()
			return true
		})

		return () => {
			backEvent.remove()
		}
	}, [currentPage])

	return <Fragment>
		<Pressable
			style={{
				position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
				backgroundColor: "black", opacity: 0.4
			}}
			onPress={closingCallback}
		/>

		<LinearGradient
			colors={[background, surface]}
			style={{
				zIndex: 3,
				position: "absolute", top: "50%", left: "50%",
				width: "100%", height: "100%",
				maxWidth: 400, maxHeight: 500,
				borderRadius: 16,
				transform: [
					{ translateX: "-50%" },
					{ translateY: "-50%" }
				]
			}}
		>
			<LinearGradient
				colors={[secondary, "transparent"]}
				style={{
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
					padding: 24,
					paddingBottom: 46,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 16
				}}
			>
				<Image
					source={require("../assets/images/note_1.png")}
					style={{
						width: 64, objectFit: "contain", aspectRatio: 1, tintColor: "white"
					}}
				/>
				<Text
					numberOfLines={2}
					ellipsizeMode='tail'
					style={{
						fontFamily: getComicNueueFont("bold"), color: "white",
						fontSize: 30, textAlign: "right", flexShrink: 1
					}}
					children={song.name}
				/>
			</LinearGradient>
			<ScrollView
				style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, gap: 8 }}
				children={<View style={{ gap: 8 }} children={editPages[currentPage]} />}
			/>
			<View style={{ marginBottom: 8, marginHorizontal: 8, alignItems: "flex-end" }}>
				<Text
					style={{
						fontFamily: getComicNueueFont("bold", true),
						color: onBackground, backgroundColor: background,
						fontSize: 20, paddingHorizontal: 16,
						borderTopLeftRadius: 16, borderBottomRightRadius: 8,
						paddingVertical: 4
					}}
					children={formatTime(song.duration || 0)}
				/>
			</View>
		</LinearGradient>
	</Fragment>
}