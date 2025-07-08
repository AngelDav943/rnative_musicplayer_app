import React from 'react'
import { View, Image, Animated, Text, Easing, Pressable } from 'react-native'
import { useTheme } from '../contexts/useTheme';
import { song } from '../types/song';
import LinearGradient from 'react-native-linear-gradient';
import { getComicNueueFont } from '../utilities/basic';
import { AudioPro, AudioProState } from 'react-native-audio-pro';

interface minimizedPlayerProps {
	currentSong: song | null
	animatedProgress: Animated.Value
	setMinimized?: React.Dispatch<React.SetStateAction<boolean>>
}

export default function PlayerMinimized({ currentSong, animatedProgress, setMinimized }: minimizedPlayerProps) {
	const { primary, onSurface, onBackground, secondary } = useTheme();

	if (!currentSong) return null

	const spins = 5;

	const N = 20;
	const opacityInputRange = Array.from({ length: N + 1 }, (_, i) => i / N);
	const opacityOutputRange = opacityInputRange.map(x =>
		Math.abs(Math.sin(Math.PI + x * (spins * 3 * 2) * Math.PI)) * 2
	);

	const playIcon = require("../assets/images/play.png")
	const pauseIcon = require("../assets/images/pause.png")

	return <View
		style={{
			height: 134,
			paddingBottom: 15
		}}
	>
		<View style={{ flexDirection: "row", paddingHorizontal: 14, alignItems: "center", zIndex: 2 }}>
			<View
				onTouchEnd={() => setMinimized && setMinimized(false)}
				style={{
					height: 115,
					padding: 30,
					borderRadius: 16, aspectRatio: 1,
					backgroundColor: primary, overflow: 'hidden',
					position: "relative", justifyContent: "center", alignItems: "center"
				}}
				children={<>
					<Animated.Image
						width={140}
						height={140}
						source={require("../assets/images/sound_waves_offset.png")}
						style={{
							position: "absolute",
							width: "190%", height: undefined, tintColor: "white",
							resizeMode: "cover", aspectRatio: 1,
							opacity: animatedProgress.interpolate({
								inputRange: opacityInputRange,
								outputRange: opacityOutputRange,
								easing: Easing.inOut(Easing.circle)
							}),
							transform: [
								{ perspective: 75 },
								{
									rotateY: animatedProgress.interpolate({
										inputRange: [0, 1],
										outputRange: ['90deg', `${(360 * spins) + 90}deg`] // 360 * 5
									})
								}
							],
						}}
					/>
					<LinearGradient
						colors={[primary, "transparent", secondary]}
						style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
					/>
					<Image
						width={150}
						height={150}
						source={require("../assets/images/note_1.png")}
						style={{
							width: undefined, height: "100%", tintColor: "white",
							resizeMode: "cover", aspectRatio: 1
						}}
					/>
				</>}
			/>
			<View style={{ flex: 1, paddingLeft: 16 }} onTouchEnd={() => setMinimized && setMinimized(false)}>
				<Text
					style={{
						fontSize: 25,
						fontFamily: getComicNueueFont("bold"),
						color: onSurface
					}}
					children={currentSong.name}
				/>

			</View>
			<Pressable
				style={{
					width: 80,
					height: "100%",
					justifyContent: "center",
					padding: 16
				}}
				onPress={() => {
					const audioState = AudioPro.getState()
					console.log("state:", AudioPro.getState())
					// if (audioState == AudioProState.IDLE) AudioPro.pause()

					if (audioState == AudioProState.PLAYING) {
						AudioPro.pause()
					} else {
						AudioPro.resume()
					}
				}}
				children={<Image
					width={150}
					height={150}
					source={
						AudioPro.getState() == AudioProState.PLAYING ? pauseIcon : playIcon}
					style={{
						height: undefined, width: "100%", tintColor: "white",
						resizeMode: "cover", aspectRatio: 1
					}}
				/>}
			/>
		</View>
		<View style={{ position: 'relative', height: 8, marginTop: 10 }}>
			<Animated.View style={{
				height: "100%",
				width: animatedProgress.interpolate({
					inputRange: [0, 1],
					outputRange: ['0%', `100%`] // 360 * 5
				}),
			}}
				children={<LinearGradient
					style={{ flex: 1 }}
					colors={[primary, secondary]}
				/>} />
		</View>
	</View>
}