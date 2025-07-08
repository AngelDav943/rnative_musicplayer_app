import React, { useEffect, useRef, useState } from 'react'
import { DimensionValue, Image, ImageSourcePropType, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useTheme } from '../contexts/useTheme'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getComicNueueFont, getNameAndExtension } from '../utilities/basic';
import ButtonFolder, { BaseButtonFolder } from '../components/ButtonFolder';
import { usePages } from '../App';
import SongTile from '../components/SongTile';
import { DB_song, song } from '../types/song';
import { useDatabase } from '../contexts/useDatabase';
import HomeHeader from '../components/HomeHeader';
import { usePlayer } from '../contexts/usePlayer';
import { Portal } from '../contexts/PortalProvider';

function HomePage() {
	const { background, onBackground, surface, onSurface, secondary, onSecondary, primary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();
	const { playSong } = usePlayer();
	const { getDB } = useDatabase();

	const [recentlyPlayed, setRecently] = useState<song[]>();
	const [creatingPlaylist, setCreatingPlaylist] = useState<boolean>();

	const playlistNameInput = useRef<TextInput>(null);
	const playlistDescInput = useRef<TextInput>(null);

	async function getRecentlyPlayed() {
		const db = await getDB();

		const [{ rows: results }] = await db.executeSql(
			"SELECT DISTINCT songs.* FROM songs JOIN recent_songs ON songs.id = recent_songs.song_id ORDER BY recent_songs.id DESC LIMIT 6"
		)
		const recent = results.raw() as DB_song[]
		setRecently(recent.map(item => ({ ...item, duration: parseInt(item.duration || "0") })))
	}

	useEffect(() => {
		getRecentlyPlayed()
	}, [])

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			{creatingPlaylist && <Portal name='searchModal'>
				<Pressable
					style={{
						position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
						backgroundColor: "black", opacity: 0.2
					}}
					onPress={() => setCreatingPlaylist(false)}
				/>
				<View style={{
					zIndex: 2,
					position: "absolute", top: "50%", left: "50%",
					width: "100%", height: "100%",
					maxWidth: 400, maxHeight: 500,
					borderRadius: 16,
					backgroundColor: background,
					transform: [
						{ translateX: "-50%" },
						{ translateY: "-50%" }
					]
				}}>
					<View style={{ margin: 8, flexDirection: "row", gap: 8 }}>
						<Image
							source={require("../assets/images/folder.png")}
							style={{ height: 64 }}
						/>
						<Text
							children="Create playlist"
							style={{
								fontFamily: getComicNueueFont("bold"), color: onBackground,
								fontSize: 32, verticalAlign: "middle"
							}}
						/>
					</View>
					<TextInput
						ref={playlistNameInput}
						placeholder='Playlist name'
						style={{
							margin: 8, padding: 16, backgroundColor: surface, borderRadius: 8
						}}
					/>

					<TextInput
						ref={playlistDescInput}
						multiline
						placeholder='Playlist description'
						maxLength={512}
						style={{
							verticalAlign: "top", flex: 1,
							marginHorizontal: 8, padding: 16, backgroundColor: surface, borderRadius: 8
						}}
					/>

					<Pressable children={<LinearGradient
						style={{
							margin: 8, padding: 16, borderRadius: 8
						}}
						colors={[primary, secondary]}
					>
						<Text
							style={{
								fontFamily: getComicNueueFont("bold"), color: onBackground,
								fontSize: 24, verticalAlign: "middle"
							}}
							children="Create"
						/>
					</LinearGradient>
					} />
				</View>
			</Portal>}
			<ScrollView>
				<SafeAreaView style={{ flex: 1 }}>
					<View>
						<HomeHeader icon={require("../assets/images/note_queue.png")} label='Playlists' />
						<ScrollView horizontal={true} style={{ paddingBottom: 15 }}>
							<View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 10, alignItems: "center" }}>
								<ButtonFolder width={210} color='#094813' />
								<ButtonFolder width={210} variation={3} color='#318fff' />
								<ButtonFolder width={210} variation={2} color='#ff7800' />
								<View style={{ width: 10 }} />
								<BaseButtonFolder
									label=''
									color=" rgb(24, 192, 52)"
									iconSize={"70%"}
									iconTop={0}
									iconSource={require("../assets/images/new_queue.png")}
									width={160}
									iconOpacity={0.6}
									onPress={() => setCreatingPlaylist(true)}
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
										playSong(file.id)
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
				</SafeAreaView>
			</ScrollView>
		</LinearGradient>
	)
}

export default HomePage