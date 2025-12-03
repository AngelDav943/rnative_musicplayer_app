import { PermissionsAndroid, Platform } from "react-native";
import { hash } from "react-native-fs";
import AudioMetadata from "../types/NativeModules";

export function getNameAndExtension(fileName: string) {
	const separation = fileName.split(/(.+)\.(.+)/g)

	return [separation[1], separation[2]]
}

export function mergeGroupsIntersection(groups: Record<string, any[]>, words: string[]): any[] {
	if (words.length === 0) return [];

	// Start with the first word's group
	let intersection = new Set(groups[words[0]] || []);

	// Intersect with the rest
	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		const groupSet = new Set(groups[word] || []);
		intersection = new Set([...intersection].filter(file => groupSet.has(file)));
	}

	return Array.from(intersection);
}

export async function hasStoragePerms() {
	if (Platform.OS != "android") return false;

	let permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
	if (Number(Platform.Version) >= 33) {
		permission = "android.permission.READ_MEDIA_AUDIO"
	}

	const hasPermission = await PermissionsAndroid.check(permission);
	if (hasPermission) {
		return true;
	}

	const status = await PermissionsAndroid.request(permission);
	return status === 'granted';
}

const ComicNeueFonts = {
	normal: "ComicNeueRegular",
	light: "ComicNeueLight",
	bold: "ComicNeueBold",
} as const

export function getComicNueueFont(type: keyof typeof ComicNeueFonts, italic: boolean | undefined = false) {
	if (type == "normal" && italic) {
		return "ComicNeueItalic"
	}

	return `${ComicNeueFonts[type]}${italic ? "Italic" : ""}`
}

export function formatTime(milliseconds: number | string) {
	const date = new Date(parseInt(String(milliseconds)))

	const time = `${date.getMinutes().toString().padStart(2, "0")
		}:${date.getSeconds().toString().padStart(2, "0")
		}`

	return time;
}

export async function getSongDuration(path: string) {
	try {
		const duration = await AudioMetadata.getDuration(path)
		return duration
	} catch (error) {
		console.log("Error while reading metadata, message:", error)
	}
	return 0
}

export function parseJSON(input: string): Record<string, any> | null {
	try {
		return JSON.parse(input)
	} catch (error) {
		return null
	}
}

export async function hashFile(filePath:string) {
	return await hash(filePath, "sha256")
}