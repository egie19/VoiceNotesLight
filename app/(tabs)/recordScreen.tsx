import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, AVPlaybackStatus } from "expo-av";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";

const { width, height } = Dimensions.get("window");

type RecordingItem = {
  id: string;
  uri: string;
  date: string;
};

const RecordScreen = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [latestRecording, setLatestRecording] = useState<RecordingItem | null>(
    null
  );
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    loadLatestRecording();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadLatestRecording = async () => {
    try {
      const stored = await AsyncStorage.getItem("@recordings");
      const recordings: RecordingItem[] = stored ? JSON.parse(stored) : [];
      if (recordings.length > 0) {
        setLatestRecording(recordings[recordings.length - 1]);
      }
    } catch (error) {
      console.error("Error loading recordings", error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Microphone access is needed.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      const newRecord: RecordingItem = {
        id: uuid.v4().toString(),
        uri,
        date: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem("@recordings");
      const recordings: RecordingItem[] = stored ? JSON.parse(stored) : [];
      recordings.push(newRecord);
      await AsyncStorage.setItem("@recordings", JSON.stringify(recordings));

      setRecording(null);
      setLatestRecording(newRecord);
      console.log(`Recording saved at ${uri}`);

      Alert.alert("Voice Notes has been saved");
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const playLatestRecording = async (): Promise<void> => {
    if (!latestRecording) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
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
    <View style={styles.container}>
      <View style={styles.appNameContainer}>
        <Text style={styles.appName}>Voice Notes Lite</Text>
      </View>

      <TouchableOpacity
        style={styles.recordButtonContainer}
        onPress={recording ? stopRecording : startRecording}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={recording ? "stop" : "play"}
            size={20}
            color={recording ? "red" : "blue"}
          />
        </View>
        <Text style={styles.recordButtonText}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>

      {latestRecording && (
        <View style={styles.spacer}>
          <Button title="Play Latest Recording" onPress={playLatestRecording} />
          <Text style={styles.timestamp}>
            Last: {new Date(latestRecording.date).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default RecordScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  appNameContainer: { alignItems: "center", marginTop: height * 0.1 },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: { fontSize: 24, marginBottom: 20 },
  spacer: { marginTop: 30, alignItems: "center" },
  timestamp: { marginTop: 10, fontStyle: "italic" },
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
});
