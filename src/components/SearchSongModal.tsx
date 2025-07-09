import React, { Fragment, useEffect, useState } from 'react'
import { Pressable, View, Image, Text, TextInput, ScrollView, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getComicNueueFont } from '../utilities/basic';
import { usePages } from '../App';
import { useDatabase } from '../contexts/useDatabase';
import { usePlayer } from '../contexts/usePlayer';
import { useTheme } from '../contexts/useTheme';
import { song } from '../types/song';

interface SearchSongModalProps {
	closingCallback: () => void
	searchCallback: () => void
}

export default function SearchSongModal({ closingCallback, searchCallback }: SearchSongModalProps) {
	const { getDB } = useDatabase();
	const { background, onBackground, surface, secondary, primary } = useTheme();
	const { viewSong } = usePlayer()

	const [searchInput, setSearchInput] = useState("");
	const [songs, setSongs] = useState<song[]>([]);

	async function searchSongs() {
		const db = await getDB();

		if (searchInput.trim() == "") {
			setSongs([])
			return
		}

		const [{ rows: results }] = await db.executeSql(
			"select * from songs where name like ?",
			[`%${searchInput}%`]
		)
		const songs = results.raw() as song[]
		setSongs(songs)
	}

	useEffect(() => {
		// select * from songs where name like '%foo%'
		searchSongs()
	}, [searchInput])

	return <Fragment>
		<Pressable
			style={{
				position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
				backgroundColor: "black", opacity: 0.4
			}}
			onPress={closingCallback}
		/>
		<View style={{
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
			<TextInput
				placeholder='Search here'
				style={{
					margin: 8, padding: 16, backgroundColor: surface,
					borderTopLeftRadius: 8, borderTopRightRadius: 8,
					color: onBackground, fontFamily: getComicNueueFont("bold"),
					fontSize: 20,
				}}

				placeholderTextColor={background}

				onChange={event => {
					const nativeEvent = event.nativeEvent;
					const input = nativeEvent ? nativeEvent.text : "";
					setSearchInput(input)
				}}
			/>

			{songs && songs.length > 0
				? <FlatList
					data={songs}
					style={{
						margin: 8, marginTop: 0,
						borderBottomLeftRadius: 8,
						borderBottomRightRadius: 8,
						overflow: "hidden"
					}}
					renderItem={({ index, item: song }) => {
						return <Pressable
							key={song.id}
							style={({ pressed }) => ({
								paddingVertical: 10, marginBottom: 5,
								flexDirection: "row", alignItems: "center", gap: 16,
								backgroundColor: pressed ? primary : secondary
							})}

							onPress={() => {
								if (song.id) viewSong(song.id)
							}}
						>
							<Image
								style={{ width: 40, height: undefined, aspectRatio: 1, marginLeft: 8 }}
								source={require("../assets/images/note_2.png")}
							/>
							<Text
								style={{ flexShrink: 1, color: "white", fontFamily: getComicNueueFont("bold"), fontSize: 17 }}
								children={`${String(song.name).slice(0, 200).trim()}${String(song.name).length > 200 ? "..." : ""}`}
								numberOfLines={2}
								ellipsizeMode='tail'
							/>
						</Pressable>
					}}
				/>
				: <View style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					opacity: 0.5,
					paddingBottom: 36
				}}>
					<Image
						style={{ width: 128, height: undefined, aspectRatio: 1, marginLeft: 8, tintColor: onBackground }}
						source={require("../assets/images/note_1.png")}
					/>
					<Text
						style={{
							flexShrink: 1, color: onBackground,
							fontFamily: getComicNueueFont("bold", true), fontSize: 24,
							maxWidth: 300, textAlign: "center"
						}}
						children="Search something to get started"
						numberOfLines={2}
						ellipsizeMode='tail'
					/>
				</View>
			}

		</View>
	</Fragment>
}