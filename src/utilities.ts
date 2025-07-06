import { PermissionsAndroid, Platform } from "react-native";

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