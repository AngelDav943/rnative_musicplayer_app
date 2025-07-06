import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AudioPro, AudioProContentType } from "react-native-audio-pro";
import { ReadDirItem } from "react-native-fs";

const playerContext = createContext<any>(null);

interface ProviderUtils {
	songPosition: number | null
	songDuration: number | null
}

export const usePlayer: () => ProviderUtils = () => {
	return useContext(playerContext);
}

export function PlayerProvider({ children }: { children: ReactNode }) {

	AudioPro.configure({
		contentType: AudioProContentType.MUSIC,
	});

	const [songPosition, setSongPosition] = useState<number | null>(null);
	const [songDuration, setSongDuration] = useState<number | null>(null);

	const [queue, setQueue] = useState([]);
	const [currentQueuePosition, setQueuePosition] = useState<number | null>(null);

	function addSong(songFile: ReadDirItem): boolean {

		return true
	}

	const exportUtils: ProviderUtils = {
		songPosition, songDuration
	}

	useEffect(() => {

		const listener = AudioPro.addEventListener((event) => {
			if (event.type == "PROGRESS" && event.payload) {
				if (event.payload.position && songPosition != event.payload.position) {
					setSongPosition(event.payload.position)
				}

				if (event.payload.duration && songDuration != event.payload.duration) {
					setSongDuration(event.payload.duration)
				}
				return;
			}
			console.log("Sound event!!", event)
		})

		return () => {
			listener.remove()
		}
	}, [])

	return (
		<playerContext.Provider value={{ ...exportUtils }}>
			{children}
		</playerContext.Provider>
	)
}