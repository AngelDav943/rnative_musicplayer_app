import { readFile } from "react-native-fs";
import { lookup } from "react-native-mime-types";
import { RTCPeerConnection } from "react-native-webrtc";
import RTCDataChannel from "react-native-webrtc/lib/typescript/RTCDataChannel";
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";
import { song } from "../types/song";
import { hashFile, parseJSON } from "../utilities/basic";

const socketURL = "wss://api.andec.org/websockets/music"

const configurationPeerConnection = {
	iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
	iceCandidatePoolSize: 10,
}

let peerConnection: RTCPeerConnection | null = new RTCPeerConnection(configurationPeerConnection)
let websocket: WebSocket | null = null
let fileDataChannel: RTCDataChannel | null = null

let sendingFile = false

export type peerConnectionState = "closed" | "connecting" | "connected" | "disconnected" | "failed" | "new"
let peerStatus: peerConnectionState = "closed";

export const rtcEmitter = new EventEmitter()

export function getPeerStatus() {
	return peerStatus
}

export async function sendSong(song: song) {
	if (!fileDataChannel || sendingFile) return
	// TODO: send file through the data channel by chunks

	const base64 = await readFile(song.path, 'base64');
	const binaryString = atob(base64)
	const binaryLength = binaryString.length
	const bytes = new Uint8Array(binaryLength);
	for (let i = 0; i < binaryLength; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	const mimeType = lookup(song.path)
	const file = new Blob([binaryString], { type: mimeType != false ? mimeType : "application/unknown", lastModified: 0 })

	console.log("file size", file.size, ". bytes length", bytes.length)

	const chunkSize = 32 * 1024; // 32KB per data chunk

	sendingFile = true

	const fileHash = await hashFile(song.path);

	console.log("sending _start_of_file_")

	fileDataChannel.send(`__START__OF__FILE__${JSON.stringify({
		type: file.type,
		total: file.size,
		hash: fileHash
	})}`)
	// readSlice(0)

	const fileBuffer = bytes.buffer
	function processChunk(part: number) {
		if (!sendingFile) {
			console.log("file transfer cancelled.")
			return;
		}

		if (part >= fileBuffer.byteLength) {
			console.log("end of file.")
			if (fileDataChannel) fileDataChannel.send(`__END__OF__FILE__${JSON.stringify({
				type: file.type
			})}`)
			sendingFile = false
			return;
		}

		if (fileDataChannel) {
			const chunk = fileBuffer.slice(part, part + chunkSize)
			console.log("sending chunk.", chunk)
			fileDataChannel.send(chunk)

			setTimeout(() => processChunk(part + chunkSize), 0)
		}
	}

	processChunk(0)
}

async function handleWebsocket(data: any) {
	const message = parseJSON(String(data))
	if (message == null || message["type"] == null) return

	switch (message.type) {
		case "link":
			// setSuccessConnection(true)
			break;

		case "accept-link":
			setTimeout(startWebRTC, 100)
			break;

		case "link-signal":
			handleLinkSignal(message)
			break;
	}
}

async function startWebRTC() {
	if (!peerConnection) return

	//@ts-ignore
	peerConnection.onicecandidate = (event) => {
		if (event.candidate !== null) {
			console.log("sending ice-candidate", event.candidate)
			if (websocket) websocket.send(JSON.stringify({
				type: "link-signal",
				data: {
					"signal-type": "ice-candidate",
					"candidate": event.candidate
				}
			}))
		}
	}

	//@ts-ignore
	peerConnection.onnegotiationneeded = async () => {
		if (peerConnection == null) return
		console.log("negotiation needed!! (caller)")

		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer)
		if (websocket) websocket.send(JSON.stringify({
			type: "link-signal",
			data: {
				"signal-type": "offer",
				"sdp": offer.sdp
			}
		}))
	}

	//@ts-ignore
	peerConnection.onconnectionstatechange = () => {
		if (peerConnection == null) return
		console.log("connection state:", peerConnection.connectionState)
		peerStatus = peerConnection.connectionState
		rtcEmitter.emit("connectionState", peerConnection.connectionState)
		// setConnectionStatus(peerConnection.connectionState)
	}

	fileDataChannel = peerConnection.createDataChannel("filetransfer")
	await handleDataChannelEvents(fileDataChannel, true)

	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer)

	if (websocket) websocket.send(JSON.stringify({
		type: "link-signal",
		data: {
			"signal-type": "offer",
			"sdp": offer.sdp
		}
	}))
}

export async function setupService() {

	websocket = new WebSocket(socketURL)

	websocket.onmessage = async (event) => {
		console.log("websocket", parseJSON(event.data))
		handleWebsocket(event.data)
	}

	// console.log(peerConnection)
}

export async function startCall(targetPIN: string) {
	if (!websocket) return;
	console.log("sent to websocket", {
		type: "link",
		target: targetPIN
	})

	websocket.send(JSON.stringify({
		type: "link",
		target: targetPIN
	}))
}

function handleDataChannelEvents(channel: RTCDataChannel, arg1: boolean) {
	channel.binaryType = "arraybuffer"

	//@ts-ignore
	channel.onopen = () => console.log("Data channel open");
	//@ts-ignore
	channel.onclose = () => {
		console.log("Data channel closed");
	}

	//@ts-ignore
	channel.onmessage = async (event) => {
		console.log("Data channel message received (caller):", event.data);

		if (String(event.data).includes("__CANCEL_TRANSFER_CACHE_EXISING__")) {
			sendingFile = false
		}

	};
}
async function handleLinkSignal(message: Record<string, any>) {
	if (!websocket) return
	if (!peerConnection) peerConnection = new RTCPeerConnection(configurationPeerConnection);

	if (message.data["signal-type"]) switch (message.data["signal-type"]) {
		case "offer":
			await ensurePeerConnection()
			await peerConnection!.setRemoteDescription({ type: "offer", sdp: message.data["sdp"] })
			const answer = await peerConnection.createAnswer();
			await peerConnection.setLocalDescription(answer)
			websocket.send(JSON.stringify({
				type: "link-signal",
				data: {
					"signal-type": "answer",
					"sdp": answer.sdp
				}
			}))
			break;
		case "answer":
			await peerConnection.setRemoteDescription({ type: "answer", sdp: message.data["sdp"] })
			break;
		case "ice-candidate":
			console.log("recieved ice-candidate", message.data)
			if (message.data["candidate"]) {
				try {
					await peerConnection.addIceCandidate(message.data["candidate"])
				} catch (error) {
					console.error("Error adding ICE-candidate", error)
				}
			}
			break;
		default:
			break;
	}
}

async function ensurePeerConnection() {
	if (!peerConnection) {
		peerConnection = new RTCPeerConnection(configurationPeerConnection)
	}

	//@ts-ignore
	peerConnection.onicecandidate = (event) => {
		if (event.candidate && websocket) websocket.send(JSON.stringify({
			type: "link-signal",
			data: {
				"signal-type": "ice-candidate",
				"candidate": event.candidate
			}
		}))
	};

	//@ts-ignore
	peerConnection.ondatachannel = async (event) => {
		fileDataChannel = event.channel
		await handleDataChannelEvents(event.channel, false)
	}

	//@ts-ignore
	peerConnection.onconnectionstatechange = () => {
		if (peerConnection == null) return
		console.log("ensurePeerConnection() connection state:", peerConnection.connectionState)
		peerStatus = peerConnection.connectionState
		rtcEmitter.emit("connectionState", peerConnection.connectionState)
	}
}