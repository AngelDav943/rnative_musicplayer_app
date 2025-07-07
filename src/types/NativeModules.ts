import { NativeModules } from 'react-native';


interface AudioMetadataInterface {
	getDuration(filePath: string): Promise<number>;
}

const { AudioMetadata } = NativeModules;

export default AudioMetadata as AudioMetadataInterface