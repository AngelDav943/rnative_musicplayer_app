import React from 'react'
import { Pressable, Image, Text, GestureResponderEvent, View, ColorValue } from 'react-native'
import { useTheme } from '../contexts/useTheme';
import LinearGradient from 'react-native-linear-gradient';

function SongTile({
	name,
	onPress,
	maxNameLength = 12,
	variant = -1, //Math.round(Math.random() * 1)
	background: bgColor
}: {
	name: string
	onPress?: ((event: GestureResponderEvent) => void)
	maxNameLength?: number
	variant?: number
	background?: ColorValue
}) {
	const { background, onBackground, surface, onSurface, secondary } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			style={{
				position: "relative",
				flexGrow: 1,
				minWidth: 200,
				flexBasis: 200,
				backgroundColor: bgColor ? bgColor : secondary,
				height: 64,
				borderRadius: 16, overflow: "hidden",
				alignItems: "center", justifyContent: "center"
				// position: "relative", overflow: "hidden",
			}}
		>
			{(variant >= 0) && <Image
				width={150}
				height={150}
				source={[
					require("../assets/images/note_1.png"),
					require("../assets/images/note_2.png"),
				][variant]}
				style={{
					position: "absolute",
					width: 100, height: undefined, tintColor: "white",
					top: [-35, -20][variant], right: 0,
					resizeMode: "cover", aspectRatio: 1, opacity: 0.6
				}}
			/>}
			<LinearGradient
				style={{ position: "absolute", width: "100%", height: "100%" }}
				colors={["transparent", secondary]}
				start={{ x: 0.3, y: 0 }}
				end={{ x: 1, y: 0 }}
			/>
			<View style={{
				position: "absolute",
				paddingVertical: 10, paddingHorizontal: 14, marginBottom: 5,
				width: "100%", height: "100%",
				flexDirection: "row", alignItems: "center", gap: 16
			}}>
				<Image
					style={{ width: 40, height: undefined, aspectRatio: 1 }}
					source={require("../assets/images/note_2.png")}
				/>
				<Text
					style={{ color: "white", fontWeight: "bold", flexWrap: 'wrap' }}
					children={`${String(name).slice(0, maxNameLength).trim()}${String(name).length > maxNameLength ? "..." : ""}`}
				/>
			</View>
		</Pressable>
	)
}

export default SongTile