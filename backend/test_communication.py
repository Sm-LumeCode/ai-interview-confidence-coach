from services.communication import analyze_communication

if __name__ == "__main__":
    transcript = "Uh I think normalization uh basically removes redundancy uh"
    audio_duration = 20  # seconds

    result = analyze_communication(transcript, audio_duration)
    print(result)

#sample output {'filler_count': 4, 'wpm': 27, 'pace_label': 'slow', 'fluency_score': 4}