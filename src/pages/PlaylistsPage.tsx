import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { song } from '../types/song';
import { useDatabase } from '../contexts/useDatabase';
import { usePlayer } from '../contexts/usePlayer';
import { useTheme } from '../contexts/useTheme';
import LinearGradient from 'react-native-linear-gradient';
import SongTile from '../components/SongTile';
import { getComicNueueFont } from '../utilities/basic';
import { usePages } from '../App';
import { playlist } from '../types/playlist';
import { InsertQueue } from '../services/audioService';
import { Portal } from '../contexts/PortalProvider';
import CreatePlaylistModal from '../components/CreatePlaylistModal';

function PlaylistsPage() {
	const { background, onBackground, inversePrimary, surface } = useTheme();
	const { getDB } = useDatabase();
	const { setPage, setBackPressTarget, state } = usePages();
	const { currentSong, setLoopMode } = usePlayer();

	if (
		state["name"] == undefined || state["id"] == undefined ||
		state["description"] == undefined || state["color"] == undefined
	) return null

	const [playlist, setPlaylist] = useState<playlist>(state)

	const [editingPlaylist, setEditingPlaylist] = useState<boolean>(false);
	const [songPage, setSongPage] = useState<number>(1);
	const pageSize = 6

	const [allSongs, setSongs] = useState<song[]>([])
	async function getPlaylists() {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"SELECT songs.* FROM songs JOIN playlist_song ON songs.id = song_id AND playlist_id = ?",
			[playlist.id]
		)
		const songs = results.raw() as song[]
		setSongs(songs)
	}

	async function editPlaylist(data: { color: string; name: string; description: string; }) {
		const db = await getDB();
		const updateDate = new Date().toISOString()

		try {

			const [{ rows }] = await db.executeSql(
				"UPDATE playlists SET name = ?, description = ?, color = ?, updated_at = ? WHERE id = ?",
				[data.name, data.description, data.color, updateDate, playlist.id]
			)

			setPlaylist(current => ({
				...current,
				...data
			}))
			setEditingPlaylist(false)
		} catch (error) {
			console.error("Failed playlist creation, message:", error)
		}
	}

	const TextStyle = {
		fontSize: 32,
		fontFamily: getComicNueueFont("bold"),
		color: onBackground,
	}

	useEffect(() => {
		getPlaylists()
	}, [])

	return (
		<View
			style={{ backgroundColor: background, height: 64, flex: 1 }}
		>
			{editingPlaylist && <Portal
				name='editPlaylistModal'
				children={<CreatePlaylistModal
					title='Edit playlist'
					action='Edit'
					initialValue={{
						name: playlist.name, color: playlist.color, description: playlist.description
					}}
					closingCallback={() => setEditingPlaylist(false)}
					createCallback={editPlaylist}
				/>}
			/>}
			<ScrollView style={{ paddingHorizontal: 16, flex: 1 }}>
				<View style={{ paddingBottom: 128, gap: 8, flex: 1 }}>
					<LinearGradient colors={[playlist.color, "transparent"]} style={{ margin: -16, padding: 16, paddingTop: 68, paddingBottom: 64 }}>
						<View
							style={{
								flexDirection: 'row', alignItems: "center", gap: 15,
								justifyContent: "space-between",
								paddingRight: 16
							}}
						>
							<Pressable
								onPress={() => {
									setBackPressTarget(null)
									setPage("home")
								}}
								children={<Image
									style={{ height: 64, objectFit: "contain", aspectRatio: 1, tintColor: onBackground }}
									source={require("../assets/images/arrow_left.png")}
								/>}
							/>

							<Text
								style={{
									fontSize: 35,
									fontFamily: getComicNueueFont("bold"),
									color: onBackground
								}}
								children={playlist.name}
							/>
						</View>
						<View style={{
							marginBottom: 32,
							padding: 8
						}}>
							<Text style={{ ...TextStyle, fontSize: 26, marginBottom: 8, opacity: 0.7 }} children={`${allSongs.length} song${allSongs.length != 1 ? "s" : ""}`} />
							<Text style={{ ...TextStyle, fontSize: 18 }} children={playlist.description} />
						</View>


						<View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 0 }}>
							<Pressable
								style={{ padding: 16 }}
								onPress={() => setEditingPlaylist(true)}
								children={<Image
									source={require("../assets/images/gear.png")}
									style={{ height: 58, width: undefined, aspectRatio: 1 }}
								/>}
							/>
							<View style={{ flex: 1 }} />
							<Pressable
								style={{ padding: 16 }}
								onPress={() => {
									setLoopMode("shuffle")
									InsertQueue(playlist.id, true)
								}}
								children={<Image
									source={require("../assets/images/shuffle.png")}
									style={{ height: 64, width: undefined, aspectRatio: 1, transform: [{ scale: 1.5 }] }}
								/>}
							/>
							<Pressable
								style={{ padding: 16 }}
								onPress={() => {
									setLoopMode("queue")
									InsertQueue(playlist.id)
								}}
								children={<Image
									source={require("../assets/images/play.png")}
									style={{ height: 64, width: undefined, aspectRatio: 1 }}
								/>}
							/>

						</View>
					</LinearGradient>

					<Text
						style={{
							padding: 8,
							fontSize: 35,
							fontFamily: getComicNueueFont("bold"),
							color: onBackground
						}}
						children="Songs"
					/>
					{allSongs && allSongs.slice(
						(songPage - 1) * pageSize,
						(songPage) * pageSize
					).map((file, index) => {
						if (file.id) return (
							<SongTile
								key={file.id}
								onPress={() => {
									const position = index + ((songPage - 1) * pageSize)
									InsertQueue(playlist.id, true, position)
								}}
								background={currentSong && currentSong.id == file.id ? inversePrimary : undefined}
								variant={(file.id + (songPage % 3)) % 2}
								name={file.name}
								maxNameLength={40}
							/>
						)
					})}
				</View>
			</ScrollView>
			{(Math.ceil(allSongs.length / pageSize) > 1) && <LinearGradient
				colors={["transparent", background]}
				style={{
					position: "absolute", bottom: 0, width: "100%",
					flexDirection: "row", justifyContent: "space-evenly", alignItems: "center",
					gap: 16, paddingVertical: 16
				}}
			>
				<Pressable
					onPress={() => setSongPage(current => current > 1 ? current - 1 : current)}
					style={{ padding: 16, flex: 1, alignItems: "center" }}
					children={<Image
						style={{ height: 56, objectFit: "contain", aspectRatio: 1, tintColor: onBackground }}
						source={require("../assets/images/arrow_left.png")}
					/>}
				/>
				<Text
					style={{
						...TextStyle,
						paddingHorizontal: 16,
						paddingVertical: 8,
						backgroundColor: surface,
						borderRadius: 16
					}}
					children={`${songPage} / ${Math.ceil(allSongs.length / pageSize)}`}
				/>
				<Pressable
					onPress={() => setSongPage(current => current < Math.ceil(allSongs.length / pageSize) ? current + 1 : current)}
					style={{ padding: 16, flex: 1, alignItems: "center" }}
					children={<Image
						style={{ height: 56, objectFit: "contain", aspectRatio: 1, tintColor: onBackground }}
						source={require("../assets/images/arrow_right.png")}
					/>}
				/>
			</LinearGradient>}

		</View>
	)
}

export default PlaylistsPage