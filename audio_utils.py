#!/usr/bin/env python
# coding: utf-8

# In[1]:


import subprocess
import os

def preprocess_audio(input_path: str, output_path: str):
    if not os.path.exists(input_path):
        raise FileNotFoundError("Audio file does not exist")

    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ac", "1",        # mono
        "-ar", "16000",    # 16kHz
        output_path
    ]

    subprocess.run(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )


# In[ ]:




