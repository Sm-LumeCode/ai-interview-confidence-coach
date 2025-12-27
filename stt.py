#!/usr/bin/env python
# coding: utf-8

# In[1]:


import whisper
import tempfile
import os
from audio_utils import preprocess_audio

class SpeechToTextService:
    def __init__(self, model_size="base"):
        self.model = whisper.load_model(model_size)

    def transcribe(self, audio_path: str) -> str:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wav_path = tmp.name

        try:
            preprocess_audio(audio_path, wav_path)
            result = self.model.transcribe(wav_path)
            return result["text"].strip()
        finally:
            os.remove(wav_path)


# In[ ]:




