import axios from "axios";

const EXPO_OPEN_AI_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY!;
const EXPO_PUBLIC_URL_OPENAI = process.env.EXPO_PUBLIC_URL_OPENAI

if (!EXPO_OPEN_AI_KEY) {
  throw new Error('Missing OpenAI API Key. Please set EXPO_OPEN_AI_KEY in your .env');
}


export const transcribeWithOpenAI = async (uri: string) => {
  try {

      const formData: any = new FormData();
      const filename = uri.split(/[/\\]/).pop();

      console.log("FILENAME::" + filename);
      
      formData.append("file", {
        uri,
        type: "audio/wav",
        name: filename,
      });
      formData.append("model", "whisper-1");

      const response = await axios.post(
        `${EXPO_PUBLIC_URL_OPENAI}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${EXPO_OPEN_AI_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.text;
    } catch (error) {
      console.log(error);
    }
  };

  