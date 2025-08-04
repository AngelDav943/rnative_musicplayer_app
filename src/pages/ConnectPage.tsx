import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { usePages } from '../App';
import { useTheme } from '../contexts/useTheme';
import LinearGradient from 'react-native-linear-gradient';
import { getComicNueueFont } from '../utilities/basic';
import { peerConnectionState, rtcEmitter, startCall } from '../services/rtcService';

function ConnectPage() {
	const { background, onBackground, inversePrimary, surface } = useTheme();
	const { setPage, setBackPressTarget, state } = usePages();

	const [targetPIN, setTargetPIN] = useState<string>("");

	const [connectionStatus, setConnectionStatus] = useState<peerConnectionState>("closed");

	useEffect(() => {
		const subscription = rtcEmitter.addListener("connectionState", state => {
			setConnectionStatus(state)
		})

		return () => {
			subscription.remove()
		}
	})

	return (
		<View
			style={{ backgroundColor: background, height: 64, flex: 1 }}
		>
			<ScrollView style={{ paddingHorizontal: 16, flex: 1 }}>
				<View style={{ paddingBottom: 128, gap: 8, flex: 1 }}>
					<View
						style={{
							flexDirection: 'row', alignItems: "center", gap: 15,
							justifyContent: "space-between",
							padding: 16, paddingTop: 68, paddingBottom: 32
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
					</View>

					<Text>Connect Page</Text>

					<TextInput
						value={targetPIN}
						placeholder='Web PIN'
						style={{
							margin: 8, padding: 16, backgroundColor: surface, borderRadius: 8,
							fontFamily: getComicNueueFont("bold"), color: onBackground, fontSize: 20
						}}
						onChange={(event) => {
							const nativeEvent = event.nativeEvent;
							const input = nativeEvent ? nativeEvent.text : "";
							setTargetPIN(input.toUpperCase().replace(/ /g, ""));
						}}
					/>

					<View style={{ padding: 16, backgroundColor: "#0f172a" }}>
						<Text style={{ color: "#4ade80" }}>Status: {connectionStatus}</Text>
					</View>

					<Pressable style={{ padding: 16, backgroundColor: 'orange' }} onPress={() => startCall(targetPIN)}>
						<Text>Connect</Text>
					</Pressable>
				</View>
			</ScrollView>
		</View>
	)
}

export default ConnectPage