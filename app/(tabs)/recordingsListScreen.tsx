import { RecordingItem } from "@/types/RecordingTypes";
import fileSystemHelper from "@/utils/fileSystemHelper";
import storage from "@/utils/localStore";
import { Ionicons } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
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

const { height } = Dimensions.get("window");

const RecordingsListScreen = () => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async (): Promise<void> => {
    try {
      const storedRecords = await storage.getItem<[RecordingItem]>(
        "@recordings"
      );
      if (storedRecords) {
        setRecordings(storedRecords);
      }
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

  const deleteRecording = async (id: string, filePath: string) => {
    try {
      const filtered = recordings.filter((r) => r.id !== id);
      await fileSystemHelper.deleteFilePath(filePath);
      await storage.setItem<RecordingItem[]>("@recordings", filtered);
      setRecordings(filtered);
      Alert.alert("Deleted", "Recording has been deleted.");
    } catch (error) {
      console.log(error);
    }
  };

  const renderItem = ({ item }: { item: RecordingItem }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemText}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>
      <View style={styles.iconGroup}>
        <TouchableOpacity
          onPress={() => playRecording(item)}
          disabled={playingId === item.id}
        >
          <Ionicons
            name={playingId === item.id ? "play-circle-outline" : "play-circle"}
            size={28}
            color={playingId === item.id ? "#aaa" : "#b1e022"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Delete Recording?", "", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteRecording(item.id, item.uri),
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
    <LinearGradient
      colors={["#207378", "#CCCCCC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 2 }}
      style={styles.container}
    >
      <Text style={styles.title}>Saved Recordings</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.noItemText}>No recordings found.</Text>
        }
      />
    </LinearGradient>
  );
};

export default RecordingsListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 30, marginTop: height * 0.1, color: "white" },
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
  itemText: {
    color: "white",
    fontSize: 14,
  },
  noItemText: {
    color: "white",
    fontSize: 18,
  },
});
