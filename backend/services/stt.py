#!/usr/bin/env python
# coding: utf-8

# In[1]:


import os
from dotenv import load_dotenv
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)
import tempfile
from utils.audio_utils import preprocess_audio

# Load environment variables
load_dotenv()

class SpeechToTextService:
    def __init__(self):
        # Initialize Deepgram SDK with API key from environment variable
        api_key = os.getenv("DEEPGRAM_API_KEY")
        if not api_key:
            raise ValueError("DEEPGRAM_API_KEY is not set in the environment")
        self.deepgram = DeepgramClient(api_key)

    def transcribe(self, audio_path: str) -> str:
        """
        Transcribes the given audio file using Deepgram.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        try:
            # Read the incoming audio file directly
            with open(audio_path, "rb") as file:
                buffer_data = file.read()

            payload: FileSource = {
                "buffer": buffer_data,
            }

            options = PrerecordedOptions(
                model="nova-2",
                smart_format=True,
                utterances=True,
                punctuate=True,
                diarize=False,
                filler_words=True,
            )

            # Call the Deepgram API
            response = self.deepgram.listen.rest.v("1").transcribe_file(payload, options)
            
            # Extract transcript from the JSON response
            transcript = response.results.channels[0].alternatives[0].transcript
            return transcript.strip()

        except Exception as e:
            print(f"Error during Deepgram transcription: {e}")
            raise e


# In[ ]:


