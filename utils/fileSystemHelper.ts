import * as FileSystem from 'expo-file-system';

const fileSystemHelper = {
  // Save text or JSON to a file
  writeFile: async (fileName: string, content: string): Promise<void> => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (error) {
      console.error(`Error writing to file ${fileName}`, error);
    }
  },

  // Read file content as string
  readFile: async (fileName: string): Promise<string | null> => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return content;
    } catch (error) {
      console.error(`Error reading file ${fileName}`, error);
      return null;
    }
  },

  // Delete a file
  deleteFile: async (fileName: string): Promise<void> => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }
    } catch (error) {
      console.error(`Error deleting file ${fileName}`, error);
    }
  },

  // Check if a file exists
  fileExists: async (fileName: string): Promise<boolean> => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      return fileInfo.exists;
    } catch (error) {
      console.error(`Error checking existence of file ${fileName}`, error);
      return false;
    }
  },

  // List all files in the document directory
  listFiles: async (): Promise<string[]> => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
      return files;
    } catch (error) {
      console.error('Error listing files', error);
      return [];
    }
  },

  // Append text to a file (creates it if it doesn't exist)
  appendToFile: async (fileName: string, content: string): Promise<void> => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    try {
      const exists = await fileSystemHelper.fileExists(fileName);
      if (exists) {
        const oldContent = await fileSystemHelper.readFile(fileName);
        const newContent = (oldContent ?? '') + content;
        await fileSystemHelper.writeFile(fileName, newContent);
      } else {
        await fileSystemHelper.writeFile(fileName, content);
      }
    } catch (error) {
      console.error(`Error appending to file ${fileName}`, error);
    }
  },

  // Check if a file path exists
  filePathExists: async (filePath: string): Promise<boolean> => {
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      console.error(`Error checking existence of file ${filePath}`, error);
      return false;
    }
  },

  // Delete a file path
  deleteFilePath: async (filePath: string): Promise<void> => {
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error(`Error deleting file ${filePath}`, error);
    }
  },
};

export default fileSystemHelper;