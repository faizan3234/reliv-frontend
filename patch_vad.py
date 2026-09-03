import os

path = r"C:\Users\khanf\Downloads\backend-main\voice-service\config.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('RELIV_VAD_END_MS", "650"', 'RELIV_VAD_END_MS", "1200"')
content = content.replace('RELIV_VAD_MAX_MS", "8500"', 'RELIV_VAD_MAX_MS", "12000"')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("VAD configuration patched successfully!")
