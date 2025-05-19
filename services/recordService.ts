import { RecordingItem } from "@/types/RecordingTypes";
import storage from "@/utils/localStore";
import { Audio } from "expo-av";

const recordingOptions: any = {
    android: {
        extension: ".wav",
        outPutFormat: Audio.AndroidOutputFormat.MPEG_4,
        androidEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
    },
    ios: {
        extension: ".wav",
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
    },
};

const getMicrophonePermission = async () => {
    try {
        const { granted } = await Audio.requestPermissionsAsync();

        if (!granted) {
            return false;
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const loadLatestRecording = async (): Promise<RecordingItem | undefined> => {
    try {
        const recordings = await storage.getItem<[RecordingItem]>("@recordings");
        if (recordings && recordings.length > 0) {
            return recordings[recordings.length - 1]
        }
        return undefined
        
    } catch (error) {
        console.error("Error loading recordings", error);
    }
};


const RecordService = {
    getMicrophonePermission, recordingOptions, loadLatestRecording
}

export default RecordService;