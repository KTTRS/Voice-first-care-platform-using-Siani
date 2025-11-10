#!/bin/bash

echo "🎭 Testing Emotion Classifier (Calm, Guarded, Lit)"
echo "==================================================="
echo ""

BASE_URL="http://localhost:3000"

echo "⚠️  Prerequisites:"
echo "   - Backend running on port 3000"
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 1: Calm emotion
echo "1️⃣  Testing CALM emotion..."
echo "   Transcript: 'Yeah, I took a walk earlier. It actually helped me clear my head.'"
echo ""

CALM_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/emotion/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Yeah, I took a walk earlier. It actually helped me clear my head.",
    "features": {
      "pitch_contour": [130, 135, 140, 145, 150, 155, 160, 155, 150],
      "energy_curve": [0.3, 0.32, 0.35, 0.33, 0.3, 0.28, 0.3],
      "speech_rate": 1.2
    }
  }')

echo "Response:"
echo ${CALM_RESPONSE} | jq '{emotion_category, confidence, modulation_params}'
echo ""
sleep 2

# Test 2: Guarded emotion
echo "2️⃣  Testing GUARDED emotion..."
echo "   Transcript: 'I mean... I guess I'\''m fine, just tired, I guess.'"
echo ""

GUARDED_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/emotion/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I mean... I guess I'\''m fine, just tired, I guess.",
    "features": {
      "pitch_contour": [180, 190, 210, 220, 230, 225, 215, 200, 195],
      "energy_curve": [0.2, 0.18, 0.22, 0.2, 0.19, 0.21],
      "speech_rate": 0.9,
      "pause_durations": [500, 800, 600, 450]
    }
  }')

echo "Response:"
echo ${GUARDED_RESPONSE} | jq '{emotion_category, confidence, modulation_params}'
echo ""
sleep 2

# Test 3: Lit emotion
echo "3️⃣  Testing LIT emotion..."
echo "   Transcript: 'Let'\''s do it. I'\''ve been waiting for this!'"
echo ""

LIT_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/emotion/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Let'\''s do it. I'\''ve been waiting for this!",
    "features": {
      "pitch_contour": [210, 230, 250, 270, 290, 285, 280, 260, 240],
      "energy_curve": [0.75, 0.8, 0.85, 0.82, 0.78, 0.8],
      "speech_rate": 2.1
    }
  }')

echo "Response:"
echo ${LIT_RESPONSE} | jq '{emotion_category, confidence, modulation_params}'
echo ""
sleep 2

# Test 4: Text-only classification (no prosody features)
echo "4️⃣  Testing text-only classification..."
echo "   Transcript: 'I don'\''t know, maybe I should just give up.'"
echo ""

TEXT_ONLY_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/emotion/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I don'\''t know, maybe I should just give up."
  }')

echo "Response:"
echo ${TEXT_ONLY_RESPONSE} | jq '{emotion_category, confidence, modulation_params}'
echo ""
sleep 2

# Test 5: Batch classification
echo "5️⃣  Testing batch classification..."
echo ""

BATCH_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/emotion/classify/batch \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "transcript": "I feel so peaceful right now",
        "features": {
          "pitch_contour": [140, 145, 150, 145, 140],
          "energy_curve": [0.35, 0.38, 0.36],
          "speech_rate": 1.1
        }
      },
      {
        "transcript": "This is amazing! I can'\''t believe it!",
        "features": {
          "pitch_contour": [220, 250, 270, 280, 260],
          "energy_curve": [0.8, 0.85, 0.82],
          "speech_rate": 2.0
        }
      },
      {
        "transcript": "I guess... I'\''m not sure what to think.",
        "features": {
          "pitch_contour": [190, 210, 220, 210, 200],
          "energy_curve": [0.25, 0.22, 0.24],
          "speech_rate": 0.85
        }
      }
    ]
  }')

echo "Batch results:"
echo ${BATCH_RESPONSE} | jq '.results[] | {transcript: .emotion_category, confidence}'
echo ""

echo "=========================================="
echo "✅ Emotion classifier tests complete!"
echo ""
echo "📊 Summary of Emotion Categories:"
echo ""
echo "   🟢 CALM: Grounded, steady, emotionally regulated"
echo "      - Modulation: pitch -0.02, speed 0.95, glow 0.4, curve sine"
echo ""
echo "   🟡 GUARDED: Cautious, tense, uncertain"
echo "      - Modulation: pitch +0.03, speed 0.85, glow 0.25, curve ease-in"
echo ""
echo "   🔴 LIT: Energetic, confident, passionate"
echo "      - Modulation: pitch +0.08, speed 1.15, glow 0.9, curve cubic"
echo ""
echo "🔗 Integration:"
echo "   - TTS pitch/speed synchronized with emotion"
echo "   - Avatar glow intensity/curve matched to emotion"
echo "   - Confidence scores guide response selection"
