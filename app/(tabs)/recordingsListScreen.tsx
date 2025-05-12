import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, AVPlaybackStatus } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type RecordingItem = {
  id: string;
  uri: string;
  date: string;
};

const RecordingsListScreen = () => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecordings();

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadRecordings = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem("@recordings");
      const parsed: RecordingItem[] = stored ? JSON.parse(stored) : [];
      setRecordings(parsed);
    } catch (err) {
      console.error("Failed to load recordings", err);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  };

  const playRecording = async (item: RecordingItem) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({
        uri: item.uri,
      });
      setSound(newSound);
      setPlayingId(item.id);
      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setPlayingId(null);
          newSound.unloadAsync();
        }
      });
    } catch (err) {
      console.error("Failed to play recording", err);
    }
  };

  const deleteRecording = async (id: string) => {
    const filtered = recordings.filter((r) => r.id !== id);
    await AsyncStorage.setItem("@recordings", JSON.stringify(filtered));
    setRecordings(filtered);
    Alert.alert("Deleted", "Recording has been deleted.");
  };

  const renderItem = ({ item }: { item: RecordingItem }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text>{new Date(item.date).toLocaleString()}</Text>
      </View>
      <View style={styles.iconGroup}>
        <TouchableOpacity
          onPress={() => playRecording(item)}
          disabled={playingId === item.id}
        >
          <Ionicons
            name={playingId === item.id ? "play-circle-outline" : "play-circle"}
            size={28}
            color={playingId === item.id ? "#aaa" : "#007AFF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Delete Recording?", "", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteRecording(item.id),
              },
            ])
          }
        >
          <Ionicons name="trash" size={28} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Recordings</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text>No recordings found.</Text>}
      />
    </View>
  );
};

export default RecordingsListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 30, marginTop: height * 0.1 },
  item: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconGroup: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
});
