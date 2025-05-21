import AnimatedTyping from "@/components/AnimatedTyping";
import { default as service } from "@/services/recordService";
import { RecordingItem } from "@/types/RecordingTypes";
import fileSystemHelper from "@/utils/fileSystemHelper";
import storage from "@/utils/localStore";
import { transcribeWithOpenAI } from "@/utils/transcribeWithOpenAI";
import { FontAwesome } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scale } from "react-native-size-matters";
import uuid from "react-native-uuid";

const { height } = Dimensions.get("window");

const RecordScreen = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [latestRecording, setLatestRecording] = useState<RecordingItem | null>(
    null
  );
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    loadLatestRecording();
  }, []);

  const getMicrophonePermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();

      if (!granted) {
        Alert.alert(
          "Permission",
          "Please grant permission to access microphone"
        );
        return false;
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const loadLatestRecording = async () => {
    try {
      let recording = await service.loadLatestRecording();
      if (recording) {
        setLatestRecording(recording);
      }
    } catch (error) {
      console.error("Error loading recordings", error);
    }
  };

  const startRecording = async () => {
    const hasPermission = await getMicrophonePermission();
    if (!hasPermission) return;

    try {
      setIsRecording(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        service.recordingOptions
      );

      setRecording(recording);
    } catch (error) {
      console.log("Failed to start Recording", error);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      if (!uri) return;

      const newRecord: RecordingItem = {
        id: uuid.v4().toString(),
        uri,
        date: new Date().toISOString(),
      };

      const recordings = await storage.getItem<[RecordingItem]>("@recordings");
      if (recordings) {
        recordings.push(newRecord);
        await storage.setItem<[RecordingItem]>("@recordings", recordings);
        setLatestRecording(newRecord);

        // transcribe
        setTranscription("");
        setIsTranscribing(true);
        const textTranscribe = await transcribeWithOpenAI(uri);
        // console.log("WILL SET TRANSCRIPTION::: " + textTranscribe);
        setTranscription(textTranscribe);
        console.log(`Recording saved at ${uri}`);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    } finally {
      setRecording(null);
      setIsTranscribing(false);
      setIsRecording(false);
    }
  };

  const playLatestRecording = async () => {
    if (!latestRecording) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      let isFileExist = await fileSystemHelper.filePathExists(
        latestRecording.uri
      );

      if (!isFileExist) {
        Alert.alert(
          "Error",
          "Latest recording doesn't exist. File might have been deleted"
        );
        setLatestRecording(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: latestRecording.uri,
      });
      setSound(newSound);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setSound(null);
        }
      });
    } catch (err) {
      console.error("Failed to play recording", err);
    }
  };

  return (
    <LinearGradient
      colors={["#207378", "#CCCCCC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 2 }}
      style={styles.container}
    >
      <View style={styles.appNameContainer}>
        <Text style={styles.appName}>Voice Notes Lite</Text>
      </View>

      {!isRecording
        ? !isTranscribing && (
            <TouchableOpacity
              style={styles.onMicStandBy}
              onPress={startRecording}
            >
              <FontAwesome name="microphone" size={scale(50)} color="#2b3356" />
            </TouchableOpacity>
          )
        : !isTranscribing && (
            <TouchableOpacity onPress={stopRecording}>
              <LottieView
                source={require("@/assets/animations/lottieMic.json")}
                autoPlay
                loop
                speed={1.3}
                style={{ width: scale(250), height: scale(250) }}
              />
            </TouchableOpacity>
          )}

      {isTranscribing && (
        <LottieView
          source={require("@/assets/animations/lottieTranscribing.json")}
          autoPlay
          loop
          speed={1.3}
          style={{ width: scale(250), height: scale(250) }}
        />
      )}

      {transcription && !isTranscribing && (
        <ScrollView style={styles.transcriptionContainer}>
          <AnimatedTyping message={transcription} speed={100} />
        </ScrollView>
      )}

      {latestRecording && !isTranscribing && !isRecording && (
        <TouchableOpacity
          style={styles.playButton}
          onPress={playLatestRecording}
        >
          <Text style={styles.playButtonText}>▶ Play Latest Recording</Text>
          <Text style={styles.timestamp}>
            {new Date(latestRecording.date).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

export default RecordScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  appNameContainer: {
    alignItems: "center",
    position: "absolute",
    top: height * 0.1,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    color: "white",
  },
  title: { fontSize: 24, marginBottom: 20 },
  spacer: { marginTop: 30, alignItems: "center" },
  timestamp: {
    marginTop: 10,
    fontStyle: "italic",
    fontWeight: "400",
    fontSize: 12,
    color: "white",
  },
  recordButtonContainer: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  playButton: {
    marginTop: 20,
    backgroundColor: "#20B2AA",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
    maxWidth: 300,
  },
  playButtonText: { color: "#fff", fontSize: 16 },
  textTranscrition: { marginTop: 20, fontSize: 16 },
  transcriptionContainer: {
    padding: 15,
    borderRadius: 10,
    maxHeight: 200,
    marginTop: 15,
  },
  transcriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#006666",
  },
  transcriptionText: {
    fontSize: 15,
    color: "#004d4d",
  },
  onMicStandBy: {
    width: scale(110),
    height: scale(110),
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(100),
  },
});
