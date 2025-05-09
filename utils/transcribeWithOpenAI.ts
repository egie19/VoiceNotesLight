import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPEN_AI_KEY;


export const transcribeWithOpenAI = async (uri: string) => {
  try {
    const filename = uri.split('/').pop() || 'audio.m4a' 

    const formData = new FormData();

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    formData.append('file', {
      uri,
      name: filename,
      type: `${filename}`, // or audio/mp3 depending on your format
    } as any);
    formData.append('model', 'whisper-1');

    const file = formData.get('file') as File;

    const response = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1'
    });

    // const data = await response.text;

    // if (!response.ok) {
    //   console.error('OpenAI Whisper error:', data);
    //   return 'Transcription failed';
    // }

    return Response.json({ text: response.text });
  } catch (err) {
    console.error('OpenAI Whisper fetch error:', err);
    return 'Transcription failed';
  }
};