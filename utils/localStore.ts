import AsyncStorage from '@react-native-async-storage/async-storage';

const setItem = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error setting item [${key}]`, error);
  }
};

const getItem = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (error) {
    console.error(`Error getting item [${key}]`, error);
    return null;
  }
};

const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item [${key}]`, error);
  }
};

const clear = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove([...keys]);
  } catch (error) {
    console.error('Error clearing storage', error);
  }
};

const getAllKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  } catch (error) {
    console.error('Error getting all keys', error);
    return [];
  }
};

const storage = {
  setItem,
  getItem,
  removeItem,
  clear,
  getAllKeys,
};

export default storage;