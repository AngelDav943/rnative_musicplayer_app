import React, { useEffect, useState } from 'react'
import { BackHandler, Image, Pressable, ScrollView, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../contexts/useTheme'
import { getComicNueueFont } from '../utilities/basic';
import ButtonFolder, { BaseButtonFolder } from '../components/ButtonFolder';
import { usePages } from '../App';
import SongTile from '../components/SongTile';
import { DB_song, song } from '../types/song';
import { useDatabase } from '../contexts/useDatabase';
import HomeHeader from '../components/HomeHeader';
import { usePlayer } from '../contexts/usePlayer';
import { Portal } from '../contexts/PortalProvider';
import { playlist } from '../types/playlist';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { listenPlayerEvents, PlayerEventType } from '../services/audioService';

function HomePage() {
	const { background, surface, secondary, onSecondary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();
	const { viewSong } = usePlayer();
	const { getDB } = useDatabase();

	const [recentlyPlayed, setRecently] = useState<song[]>();
	const [playlists, setPlaylists] = useState<playlist[]>();

	const [creatingPlaylist, setCreatingPlaylist] = useState<boolean>();

	async function getRecentlyPlayed() {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"SELECT DISTINCT songs.* FROM songs JOIN recent_songs ON songs.id = recent_songs.song_id ORDER BY recent_songs.id DESC LIMIT 6"
		)
		const recent = results.raw() as DB_song[]
		setRecently(recent.map(item => ({ ...item, duration: parseInt(item.duration || "0") })))
	}

	async function getPlaylists() {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"SELECT * FROM playlists ORDER BY updated_at DESC"
		)
		const playlists = results.raw() as playlist[]
		setPlaylists(playlists)
	}

	async function createPlaylist(data: { name: string; description: string; color: string; }) {
		const db = await getDB();

		console.log("playlist to create:", data)

		const createDate = new Date().toISOString()
		try {

			const [{ insertId: newID }] = await db.executeSql(
				"INSERT INTO playlists (name, description, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
				[data.name, data.description, data.color, createDate, createDate]
			)

			const addedPlaylist: playlist = {
				id: newID,
				name: data.name,
				description: data.description,
				color: data.color,
				created_at: createDate,
				updated_at: createDate
			}

			console.log("playlist added!!", addedPlaylist)
			setPlaylists(current => ([
				...(current || []), addedPlaylist
			]))
			setCreatingPlaylist(false)
		} catch (error) {
			console.error("Failed playlist creation, message:", error)
		}
	}

	useEffect(() => {
		const subscription = listenPlayerEvents(event => {
			if (event.type == PlayerEventType.ADDED) {
				getRecentlyPlayed()
				return;
			}
		})

		getRecentlyPlayed()
		getPlaylists()

		return () => {
			subscription.remove()
		}

	}, [])


	useEffect(() => {
		if (creatingPlaylist == true) {
			const backEvent = BackHandler.addEventListener('hardwareBackPress', () => {
				setCreatingPlaylist(false)
				backEvent.remove()
				return true
			})

			return () => {
				backEvent.remove()
			}
		}
	}, [creatingPlaylist])

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			{creatingPlaylist && <Portal
				name='createPlaylistModal'
				children={<CreatePlaylistModal
					closingCallback={() => setCreatingPlaylist(false)}
					createCallback={createPlaylist}
				/>}
			/>}
			<ScrollView>
				<View style={{ paddingVertical: 64 }}>
					<HomeHeader icon={require("../assets/images/note_queue.png")} label='Playlists' />
					<ScrollView horizontal={true} style={{ paddingBottom: 15 }}>
						<View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 10, alignItems: "center" }}>
							{playlists && playlists.length > 0 ? playlists.map((playlist, index) => {
								return <ButtonFolder
									key={playlist.id}
									color={playlist.color}
									variation={(index % 3) + 1}
									label={playlist.name}
									width={210}
									onPress={() => {
										setPage("playlist", playlist)
										setBackPressTarget("home")
									}}
								/>
							}) : <View style={{ height: 210, backgroundColor: "black" }} />}
							<View style={{ width: 10 }} />
							<BaseButtonFolder
								label=''
								color=" rgb(24, 192, 52)"
								iconSize={"70%"}
								iconTop={0}
								iconSource={require("../assets/images/new_queue.png")}
								width={160}
								iconOpacity={0.6}
								onPress={() => {
									setCreatingPlaylist(true)
									setBackPressTarget("home")
								}}
							/>
						</View>
					</ScrollView>
				</View>
				<View>
					<HomeHeader icon={require("../assets/images/note_1.png")} label='Recently played' />
					<View style={{
						paddingHorizontal: 20,
						flexDirection: "row", flexWrap: "wrap", gap: 9, rowGap: 8
					}}>
						{recentlyPlayed && recentlyPlayed.map((file, index) => {

							return <SongTile
								key={index}
								name={file.name}
								onPress={() => {
									if (file.id == undefined) return;
									viewSong(file.id)
									getRecentlyPlayed()
								}}
							/>
						})}
					</View>
					<Pressable
						onPress={() => {
							setBackPressTarget("home")
							setPage("songs")
						}}
						style={{
							marginTop: 10, marginHorizontal: 20,
							paddingVertical: 12, paddingHorizontal: 16,
							flexDirection: 'row', alignItems: "center", gap: 15,
							borderRadius: 16,
							backgroundColor: secondary,
						}}
					>
						<Image
							style={{ width: 40, objectFit: "contain", aspectRatio: 1, tintColor: onSecondary }}
							source={require("../assets/images/note_1.png")}
						/>
						<Text
							style={{
								fontSize: 30,
								fontFamily: getComicNueueFont("bold"),
								color: onSecondary
							}}
							children="Song library >"
						/>
					</Pressable>
				</View>
				<Pressable
					onPress={() => {
						setBackPressTarget("home")
						setPage("connect")
					}}
					style={{
						marginTop: 32, marginHorizontal: 20,
						paddingVertical: 12, paddingHorizontal: 16,
						flexDirection: 'row', alignItems: "center", gap: 15,
						borderRadius: 16,
						backgroundColor: secondary,
					}}
				>
					<Image
						style={{ width: 40, objectFit: "contain", aspectRatio: 1, tintColor: onSecondary }}
						source={require("../assets/images/add.png")}
					/>
					<Text
						style={{
							fontSize: 30,
							fontFamily: getComicNueueFont("bold"),
							color: onSecondary
						}}
						children="Connect webplayer"
					/>
				</Pressable>
			</ScrollView>
		</LinearGradient >
	)
}

export default HomePage