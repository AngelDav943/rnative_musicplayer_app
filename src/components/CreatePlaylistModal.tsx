import React, { Fragment, useState } from 'react'
import { Pressable, View, Image, Text, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getComicNueueFont } from '../utilities/basic';
import { usePages } from '../App';
import { useDatabase } from '../contexts/useDatabase';
import { usePlayer } from '../contexts/usePlayer';
import { useTheme } from '../contexts/useTheme';

interface playlistData {
	color: string;
	name: string;
	description: string;
}

interface CreatePlaylistModalProps {
	title?: string
	action?: string
	initialValue?: playlistData
	closingCallback: () => void
	createCallback: (data: playlistData) => void
}

const playlistColors: Record<string, string> = {
	"gray": "#999aa2",
	"orange": "#ff7800",
	"green": "#168042",
	"cyan": "#4aceff",
	"blue": "#318fff",
	"purple": "#8462ff",
	"red": "#ff4631"
}

function CreatePlaylistModal({
	title = "Create playlist",
	action = "Create",
	initialValue = { name: "", description: "", color: playlistColors["blue"] },
	closingCallback, createCallback
}: CreatePlaylistModalProps) {
	const { background, onBackground, surface, secondary, primary } = useTheme();

	const [playlistMetadata, setPlaylistMetadata] = useState<playlistData>(initialValue)
	function updatePlaylistData(data?: Partial<playlistData>) {
		setPlaylistMetadata(current => ({
			name: data && data.name != undefined ? data.name : current.name,
			description: data && data.description != undefined ? data.description : current.description,
			color: data && data.color != undefined ? data.color : current.color,
		}))
	}

	return <Fragment>
		<Pressable
			style={{
				position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
				backgroundColor: "black", opacity: 0.4
			}}
			onPress={closingCallback}
		/>
		<View style={{
			zIndex: 3,
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
					children={title}
					style={{
						fontFamily: getComicNueueFont("bold"), color: onBackground,
						fontSize: 32, verticalAlign: "middle"
					}}
				/>
			</View>
			<TextInput
				value={playlistMetadata.name}
				placeholder='Playlist name'
				style={{
					margin: 8, padding: 16, backgroundColor: surface, borderRadius: 8,
					fontFamily: getComicNueueFont("bold"), color: onBackground, fontSize: 20
				}}
				onChange={(event) => {
					const nativeEvent = event.nativeEvent;
					const input = nativeEvent ? nativeEvent.text : "";
					updatePlaylistData({ name: input });
				}}
			/>

			<TextInput
				value={playlistMetadata.description}
				onChange={(event) => {
					const nativeEvent = event.nativeEvent;
					const input = nativeEvent ? nativeEvent.text : "";
					updatePlaylistData({ description: input });
				}}
				multiline
				placeholder='Playlist description'
				maxLength={512}
				style={{
					verticalAlign: "top", flex: 1,
					marginHorizontal: 8, padding: 16, backgroundColor: surface, borderRadius: 8,
					fontFamily: getComicNueueFont("bold"), color: onBackground, fontSize: 20
				}}
			/>

			<View style={{ marginHorizontal: 8, marginTop: 8, borderRadius: 8, overflow: "hidden", backgroundColor: playlistMetadata.color }}>
				<Text
					style={{
						fontFamily: getComicNueueFont("bold"), color: onBackground,
						padding: 8
					}}
					children="Select playlist color"
				/>
				<View
					style={{ flexDirection: "row", height: 48 }}
					children={Object.keys(playlistColors).map((key, index) => {
						const color = playlistColors[key]
						const colorKeys = Object.keys(playlistColors)
						return <Pressable
							onPress={() => updatePlaylistData({ color })}
							key={key}
							style={{
								flex: 1,
								backgroundColor: color,
								borderTopLeftRadius: playlistColors[colorKeys[index - 1]] == playlistMetadata.color ? 8 : 0,
								borderTopRightRadius: playlistColors[colorKeys[index + 1]] == playlistMetadata.color ? 8 : 0
							}}
						/>
					})}
				/>
			</View>

			<Pressable
				disabled={playlistMetadata.name.trim() == ""}
				onPress={() => {
					setPlaylistMetadata(current => {
						createCallback(playlistMetadata)
						return { description: "", name: "", color: current.color }
					})
				}}
				style={btn => ({
					opacity: btn.pressed ? 0.5 : 1
				})}
				children={<LinearGradient
					style={{
						margin: 8, padding: 16, borderRadius: 8
					}}
					colors={playlistMetadata.name.trim() !== "" ? [primary, secondary] : [surface, surface]}
				>
					<Text
						style={{
							fontFamily: getComicNueueFont("bold"), color: onBackground,
							fontSize: 24, verticalAlign: "middle"
						}}
						children={action}
					/>
				</LinearGradient>
				}
			/>
		</View>
	</Fragment>
}

export default CreatePlaylistModal