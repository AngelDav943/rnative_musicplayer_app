import React, { useEffect, useState } from 'react'
import { Image, ImageSourcePropType, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { usePages } from '../App';
import { useTheme } from '../contexts/useTheme';
import LinearGradient from 'react-native-linear-gradient';
import { getComicNueueFont } from '../utilities/basic';
import { getPeerStatus, peerConnectionState, rtcEmitter, startCall } from '../services/rtcService';

function ConnectPage() {
	const { background, onBackground, inversePrimary, surface } = useTheme();
	const { setPage, setBackPressTarget, state } = usePages();

	const [targetPIN, setTargetPIN] = useState<string>("");

	const [connectionStatus, setConnectionStatus] = useState<peerConnectionState>(getPeerStatus());

	const monitorImages: Partial<Record<peerConnectionState, any>> = {
		closed: require("../assets/images/monitor/monitor_gray.png"),
		disconnected: require("../assets/images/monitor/monitor_gray.png"),
		connecting: require("../assets/images/spin_sitting.gif"),
		connected: require("../assets/images/monitor/monitor_blue.png"),
		new: require("../assets/images/monitor/monitor_blue.png"),
		failed: require("../assets/images/monitor/monitor_red.png")
	}

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
			style={{ backgroundColor: background, height: 64, flex: 1, paddingHorizontal: 16 }}
		>
			<View style={{ gap: 8, flex: 1, paddingBottom: 256 }}>
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

				<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
					<Image
						style={{ height: 256, objectFit: "contain", aspectRatio: 1 }}
						source={monitorImages[connectionStatus]}
					/>
				</View>

				<View>
					<TextInput
						value={targetPIN}
						placeholder='Web PIN'
						style={{
							margin: 8, padding: 16, backgroundColor: surface, borderRadius: 8,
							fontFamily: getComicNueueFont("bold"), color: onBackground, fontSize: 64, textAlign: "center"
						}}
						onChange={(event) => {
							const nativeEvent = event.nativeEvent;
							const input = nativeEvent ? nativeEvent.text : "";
							setTargetPIN(input.toUpperCase().replace(/ /g, ""));
						}}
					/>

					<Pressable style={{ padding: 16, backgroundColor: 'orange' }} onPress={() => startCall(targetPIN)}>
						<Text>Connect</Text>
					</Pressable>
				</View>

			</View>
		</View>
	)
}

export default ConnectPage