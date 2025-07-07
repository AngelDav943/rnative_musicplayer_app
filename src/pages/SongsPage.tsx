import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, Image } from 'react-native'
import { getComicNueueFont } from '../utilities/basic';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/useTheme';
import SongTile from '../components/SongTile';
import { usePages } from '../App';
import { usePlayer } from '../contexts/usePlayer';

function SongsPage() {
	const { allSongs, playSong } = usePlayer();
	const { background, onBackground, surface, secondary, onSecondary } = useTheme();
	const { setPage, setBackPressTarget } = usePages();

	// const [files, setFiles] = useState<song[]>([]);
	// async function readDirectory() {
	// 	const files: song[] = await getAllSongs()
	// 	setFiles(files)
	// }

	const [songPage, setSongPage] = useState<number>(1);

	const TextStyle = {
		fontSize: 32,
		fontFamily: getComicNueueFont("bold"),
		color: onBackground,
	}

	return (
		<LinearGradient
			start={{ x: 0.0, y: 0.25 }}
			end={{ x: 0, y: 0.75 }}
			colors={[surface, background]}
			style={{ height: 64, flex: 1 }}
		>
			<ScrollView style={{ paddingHorizontal: 16, flex: 1 }}>
				<View style={{ paddingTop: 64, paddingBottom: 128, gap: 8, flex: 1 }}>
					<View
						style={{
							marginBottom: 32,
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
							children="Song library"
						/>
					</View>
					{allSongs && allSongs.slice(
						(songPage - 1) * 10,
						(songPage) * 10
					).map(file => {
						if (file.id) return (
							<SongTile
								key={file.id}
								onPress={() => file.id && playSong(file.id)}
								name={file.name}
								maxNameLength={40}
							/>
						)
					})}
				</View>
			</ScrollView>
			<LinearGradient
				colors={["transparent", background]}
				style={{
					position: "absolute", bottom: 0, width: "100%",
					flexDirection: "row", justifyContent: "space-evenly", alignItems: "center",
					gap: 16, paddingVertical: 32
				}}
			>
				<Pressable
					onPress={() => setSongPage(current => current > 1 ? current - 1 : current)}
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
						backgroundColor: secondary,
						borderRadius: 16
					}}
					children={`${songPage} / ${Math.ceil(allSongs.length / 10)}`}
				/>
				<Pressable
					onPress={() => setSongPage(current => current < Math.ceil(allSongs.length / 10) ? current + 1 : current)}
					children={<Image
						style={{ height: 56, objectFit: "contain", aspectRatio: 1, tintColor: onBackground }}
						source={require("../assets/images/arrow_right.png")}
					/>}
				/>
			</LinearGradient>
		</LinearGradient>
	)
}



export default SongsPage