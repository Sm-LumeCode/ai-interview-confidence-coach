This module handles speech-to-text conversion for the AI Interview Confidence Coach.
Accept an audio file as input
Preprocess audio using FFmpeg
Transcribe speech to plain text using OpenAI Whisper
Return raw transcript text (no scoring, no evaluation)

audio_utils.py
Purpose: Audio preprocessing and normalization
This module is responsible for cleaning and converting audio files into a format suitable for speech-to-text processing.


stt.py
Purpose: Speech-to-Text service using Whisper
This module provides the core speech-to-text functionality.

audiotest.py
Purpose: Local testing and validation script
This script is used only for development and debugging to verify that:
Audio preprocessing works correctly
Whisper transcription runs successfully
STT service integration is correct
