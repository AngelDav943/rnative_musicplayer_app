import React, { useEffect, useRef, useState } from 'react'
import { View, Image, Animated, Text, Easing, Pressable, StyleProp, TextStyle, GestureResponderEvent } from 'react-native'
import { useTheme } from '../contexts/useTheme';
import { song } from '../types/song';
import LinearGradient from 'react-native-linear-gradient';
import { formatTime, getComicNueueFont } from '../utilities/basic';
import { AudioPro, AudioProState } from 'react-native-audio-pro';
import { usePages } from '../App';

interface minimizedPlayerProps {
	currentSong: song | null
	animatedProgress: Animated.Value
	setMinimized?: React.Dispatch<React.SetStateAction<boolean>>
}

export default function PlayerMaximized({ currentSong, animatedProgress, setMinimized }: minimizedPlayerProps) {
	const { primary, onSurface, onBackground, secondary, surface, background } = useTheme();
	const { setBackPressTarget, setPage } = usePages();

	const [displayedSong, setDisplayedSong] = useState<song | null>(null)
	const spins = 5;

	const N = 20;
	const opacityInputRange = Array.from({ length: N + 1 }, (_, i) => i / N);
	const opacityOutputRange = opacityInputRange.map(x =>
		Math.abs(Math.sin(Math.PI + x * (spins * 3 * 2) * Math.PI)) * 2
	);

	const playIcon = require("../assets/images/play.png")
	const pauseIcon = require("../assets/images/pause.png")

	function touchStart(event: GestureResponderEvent) {
		event.currentTarget.measureInWindow((x, y, width) => {
			if (currentSong == null || currentSong.duration == undefined) return;
			const unboundPercentage = (event.nativeEvent.pageX - x) / width
			const percentage = Math.max(0, Math.min(1, unboundPercentage))
			AudioPro.seekTo(percentage * currentSong.duration)
			// setCounter(() => (percentage) * counterMax)
		})
	}

	useEffect(() => {
		console.log("display", currentSong)
		setDisplayedSong(currentSong)
	}, [])

	const baseTextStyle: StyleProp<TextStyle> = {
		fontFamily: getComicNueueFont("bold"),
		color: onBackground,
		verticalAlign: "middle",
		paddingHorizontal: 8
	}

	if (!displayedSong) return null
	return <LinearGradient
		start={{ x: 0.0, y: 0.25 }}
		end={{ x: 0, y: 0.75 }}
		colors={[surface, background]}
		style={{
			flex: 1,
			alignContent: "stretch",
			justifyContent: "center",
			flexWrap: "wrap"
		}}
	>

		<View
			style={{ alignItems: "flex-start" }}
			children={<Pressable
				style={{
					paddingHorizontal: 32,
					paddingVertical: 16
				}}
				onPress={() => {
					console.log("minimize")
					if (setMinimized) setMinimized(true)
				}}
				children={<Image
					style={{ height: 80, objectFit: "contain", aspectRatio: 1, tintColor: onBackground }}
					source={require("../assets/images/arrow_left.png")}
				/>}
			/>}
		/>


		<View style={{
			flex: 1, alignItems: "center", justifyContent: "center", flexBasis: 350, minHeight: 350,
			// backgroundColor: "orange"
		}}>
			<View
				style={{
					width: 350,
					padding: 30,
					borderRadius: 16, aspectRatio: 1,
					backgroundColor: primary, overflow: 'hidden',
					position: "relative", justifyContent: "center", alignItems: "center"
				}}
				children={<>
					<Animated.Image
						width={150}
						height={150}
						source={require("../assets/images/sound_waves_offset.png")}
						style={{
							position: "absolute",
							width: "190%", height: undefined, tintColor: "white",
							resizeMode: "cover", aspectRatio: 1,
							opacity: animatedProgress.interpolate({
								inputRange: opacityInputRange,
								outputRange: opacityOutputRange,
								easing: Easing.linear
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
							width: "70%", height: undefined, tintColor: "white",
							resizeMode: "cover", aspectRatio: 1
						}}
					/>
				</>}
			/>
		</View>

		<View
			style={{
				flex: 1, flexGrow: 1, flexBasis: 400, paddingHorizontal: 32,
				justifyContent: "center"
			}}
			children={<View style={{
				width: "100%", justifyContent: "center"
			}}>
				<View style={{}}>
					<Text
						style={{
							fontSize: 32,
							paddingVertical: 64,
							fontFamily: getComicNueueFont("bold"),
							textAlign: "center",
							color: onSurface
						}}
						children={`${displayedSong.name}`}
					/>

				</View>

				<View style={{ flexDirection: "row", backgroundColor: surface, borderRadius: 32 }}>
					<Text
						style={baseTextStyle}
						children={formatTime(AudioPro.getTimings().position)}
						onPress={() => AudioPro.seekTo(0)}
					/>
					<View
						onTouchMove={touchStart}
						style={{ flex: 1, position: 'relative', height: 32, overflow: "hidden" }}
						children={<Animated.View
							style={{
								height: 32,
								width: animatedProgress.interpolate({
									inputRange: [0, 1],
									outputRange: ['0%', `100%`] // 360 * 5
								}),
							}}
							children={<LinearGradient
								style={{ flex: 1 }}
								colors={[primary, secondary]}
							/>}
						/>}
					/>
					<Text
						style={baseTextStyle}
						children={formatTime(displayedSong.duration || 123)}
					/>
				</View>

				<View
					style={{
						flexDirection: "row", justifyContent: "space-evenly", alignItems: "center",
						paddingVertical: 32
					}}
				>
					<Pressable
						style={{ width: 92 }}
						onPress={() => { }}
						children={<Image
							source={require("../assets/images/note_queue.png")}
							style={{
								height: undefined, width: "100%", tintColor: surface,
								resizeMode: "cover", aspectRatio: 1
							}}
						/>}
					/>

					<Pressable
						style={{ width: 100 }}
						onPress={() => {
							console.log("state:", AudioPro.getState())
							if (AudioPro.getState() == AudioProState.PLAYING) {
								AudioPro.pause()
							} else {
								AudioPro.resume()
							}
						}}
						children={<Image
							source={AudioPro.getState() == AudioProState.PLAYING ? pauseIcon : playIcon}
							style={{
								height: undefined, width: "100%", tintColor: "white",
								resizeMode: "cover", aspectRatio: 1
							}}
						/>}
					/>

					<Pressable
						style={{ width: 92 }}
						onPress={() => { }}
						children={<Image
							source={require("../assets/images/repeat.png")}
							style={{
								height: undefined, width: "100%", tintColor: surface,
								resizeMode: "cover", aspectRatio: 1
							}}
						/>}
					/>
				</View>
			</View>}
		/>
	</LinearGradient >
}

