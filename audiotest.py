#!/usr/bin/env python
# coding: utf-8

# In[1]:


from stt import SpeechToTextService

stt = SpeechToTextService(model_size="base")

text = stt.transcribe("Test.m4a")
print("Transcript:", text)


# In[ ]:




