# Siani Intelligence System - Quick Reference

## 🚀 Getting Started

### Run the Enhanced Mobile App

```bash
cd /workspaces/Voice-first-care-platform-using-Siani/packages/mobile
npm run dev
# Scan QR code with Expo Go app
```

### Test SDOH Detection

1. Tap breathing avatar
2. Say: **"I've been missing work because the bus keeps not showing up"**
3. Siani responds with empathy
4. Resource offer appears (if rapport is high enough)

---

## 📂 File Structure

```
packages/mobile/lib/
├── sdohCategories.ts        # SDOH taxonomy & passive detection
├── sianiMemory.ts          # Memory moments & rapport tracking
├── resourceEngine.ts       # Resource catalog & loop tracking
├── memoryVectorEngine.ts   # Embedding & similarity search
├── conversationEngine.ts   # Main orchestration logic
├── followUpEngine.ts       # Natural follow-up system
└── api.ts                  # Backend sync (updated)

packages/mobile/app/
└── home.tsx                # Voice-first UI with intelligence
```

---

## 🎯 Key Functions

### Detect SDOH from Message

```typescript
import { detectSDOHIndicators } from "./lib/sdohCategories";

const detections = detectSDOHIndicators(userMessage);
// Returns: [{indicator, confidence, matchedPattern}]
```

### Process Full Conversation

```typescript
import { processMessage } from "./lib/conversationEngine";

const response = await processMessage(userId, messageText, conversationId);
// Returns: {reply, memoryMoment, sdohDetection, resourceOffer, followUp}
```

### Check Follow-Ups

```typescript
import { checkFollowUpOpportunities } from "./lib/followUpEngine";

const opportunities = checkFollowUpOpportunities(userId);
// Returns: [{interaction, resource, shouldFollowUp, followUpMessage}]
```

### Sync to Backend

```typescript
import { syncSianiData } from "./lib/api";

await syncSianiData({
  moments: sianiMemory.getAllMoments(),
  vectors: memoryVectorStore.getAllVectors(),
});
```

---

## 🔍 SDOH Categories

| Category              | Subcategories                                   | Example Phrases                                                         |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| **BASIC_NEEDS**       | food, housing, utilities, clothing              | "can't afford groceries", "eviction notice", "electricity cut off"      |
| **CARE_BARRIERS**     | transportation, internet, trust, language       | "bus not showing", "wifi doesn't work", "doctors don't listen"          |
| **LIFE_CONSTRAINTS**  | work, childcare, paperwork, financial           | "boss won't let me leave", "no one to watch kids", "too much paperwork" |
| **RELATIONSHIP_RISK** | domestic violence, isolation, safety            | "afraid of going home", "no one to talk to", "not safe at night"        |
| **MENTAL_HEALTH**     | burnout, disconnection, overwhelm, hopelessness | "so tired all the time", "feel numb", "too much happening", "no hope"   |

---

## 💬 Response Examples

### Empathy Responses (NOT Clinical)

```typescript
// Transportation
"Ugh the bus situation sounds so frustrating.";

// Food Insecurity
"God, that's so stressful. I'm really sorry you're in that position.";

// Overwhelm
"That sounds like a lot all at once. Want to just talk it through?";

// Isolation
"I'm really glad you're talking to me. You're not alone.";
```

### Resource Offers (Casual, Not Transactional)

```typescript
// Immediate Offer
"You know what… I actually saw this thing that helps people with groceries.
 Want me to send you the address?"

// Wait for Rapport
"Totally random, but there's this free ride service.
 Could that help with the bus situation?"

// Long-term Build
"Have you thought about applying for SNAP?
 I know the process can feel annoying, but it's actually not that bad."
```

### Follow-Ups (Best Friend Check-In)

```typescript
// Day 3
"Hey, did you ever end up checking out that thing we talked about?
 No pressure, just thinking of you."

// Day 7
"No rush on this, but I wanted to make sure you still had the info.
 Let me know if you want me to resend it."

// Day 14
"I know I've mentioned this before, but is this still something you might use,
 or should I let it go?"
```

---

## 🧪 Testing Scenarios

### Scenario 1: Transportation (Wait for Rapport)

```
User (Conv 1): "I've been missing work because the bus keeps not showing up"
Siani: "Ugh the bus situation sounds so frustrating."
[DOES NOT offer resource - rapport too low]

User (Conv 5, 5 days later): "Still dealing with the bus mess"
Siani: "You know what, there's this free ride service..."
[OFFERS resource - rapport > 50, conv count >= 3]
```

### Scenario 2: Food Insecurity (Immediate)

```
User: "I'm choosing between paying rent and buying groceries"
Siani: "God, that's so stressful. I'm really sorry."
Siani: "You know what… I saw this thing that helps with groceries..."
[OFFERS immediately - high severity, high confidence]
```

### Scenario 3: Similar Moment Reference

```
User: "I just feel so overwhelmed with everything"
[System searches vectors, finds similar moment 12 days ago]
Siani: "I remember you felt something kind of like this a couple weeks back.
        Want to talk about how this one feels different?"
```

### Scenario 4: Follow-Up Loop

```
Day 0: Resource offered (transportation)
Day 3: "Hey, did you ever check out that ride service?"
User: "Oh yeah, I called them yesterday"
Siani: "Oh good! I'm so glad that helped."
[Loop closed: status="engaged"]
```

---

## 📊 Data Flow

### 1. User Speaks

```
User taps avatar → Records audio → Speech-to-text → User message displayed
```

### 2. Intelligence Processing

```
processMessage(userId, text) →
  ├─ detectMood(text, sentiment)
  ├─ detectSDOHIndicators(text)
  ├─ calculateRapportScore()
  ├─ addMoment(memory)
  ├─ embedMemoryMoment(moment)
  ├─ searchSimilarMoments(text, mood)
  └─ generateResponse()
```

### 3. Response Display

```
Siani's empathy response →
  (if SDOH detected + rapport high) →
    Resource offer modal →
      Accept → Show resource details →
      Decline → "No worries at all"
```

### 4. Backend Sync

```
syncSianiData({
  moments: [...],
  vectors: [...],
}) → Backend API → Database
```

---

## 🎨 UI Components

### Breathing Avatar

- **Scale Animation**: 1.0 → 1.08 over 3s (breathing)
- **Glow Pulse**: Opacity 0.3 → 0.6 over 2s
- **States**:
  - Idle: "Tap to speak"
  - Listening: "Listening…" + dark border
  - Speaking: Voice synthesis active

### Resource Offer Modal

- **Design**: Luxury modal on dark overlay
- **Content**: Title, description, contact info
- **Actions**:
  - "Yes, send it to me" (dark button)
  - "Not right now" (outline button)

### Message Bubbles

- **Siani**: White background, left-aligned
- **User**: Matte black, right-aligned
- **Animation**: Fade-in + slide-up (staggered 100ms)

---

## ⚙️ Configuration

### Rapport Thresholds

```typescript
// conversationEngine.ts
shouldOfferResource(detection, conversationCount, rapportScore) {
  if (severity === "high" && confidence > 0.8) return true;
  if (responseStrategy === "immediate" && confidence > 0.7) return true;
  if (responseStrategy === "wait_for_rapport")
    return conversationCount >= 3 && rapportScore > 50;
  if (responseStrategy === "long_term")
    return conversationCount >= 7 && rapportScore > 70;
}
```

### Follow-Up Schedule

```typescript
// followUpEngine.ts
const FOLLOW_UP_CONFIG = {
  firstFollowUp: 3, // Days
  secondFollowUp: 7,
  thirdFollowUp: 14,
  maxFollowUps: 3,
  autoAbandonAfter: 21,
  followUpMentionProbability: 0.3, // 30% chance in conversation
};
```

### Embedding Model

```typescript
// memoryVectorEngine.ts
const EMBEDDING_CONFIG = {
  provider: "openai",
  model: "text-embedding-ada-002",
  dimensions: 1536,
};
```

---

## 🔧 Customization

### Add New SDOH Category

```typescript
// sdohCategories.ts
{
  category: "BASIC_NEEDS",
  subcategory: "medication_access",
  patterns: [
    "can't afford my meds",
    "prescription too expensive",
    "ran out of medicine"
  ],
  severity: "high",
  responseStrategy: "immediate"
}
```

### Add New Resource

```typescript
// resourceEngine.ts
{
  id: "res_med_001",
  category: "BASIC_NEEDS",
  subcategory: "medication_access",
  title: "Prescription Assistance Program",
  description: "Help paying for medications",
  contactInfo: { phone: "1-800-555-MEDS" },
  type: "financial_aid",
  urgency: "immediate",
  sianiIntro: "There's this program that helps with prescription costs..."
}
```

### Customize Empathy Tone

```typescript
// conversationEngine.ts
function generateNegativeSentimentResponse(mood: string): string {
  const responses = {
    overwhelmed: [
      "That sounds like a lot to carry right now.",
      // Add more variations
    ],
  };
}
```

---

## 🐛 Troubleshooting

### SDOH Not Detected

- Check pattern matching in `sdohCategories.ts`
- Verify message includes trigger phrases
- Test with `detectSDOHIndicators(message)` directly

### Resource Not Offered

- Check rapport score: `sianiMemory.calculateRapportScore()`
- Verify conversation count >= threshold
- Check `shouldOfferResource()` logic

### Follow-Up Not Triggered

- Check unclosed loops: `resourceEngine.getUnclosedLoops(userId)`
- Verify days since offer >= threshold
- Check emotional gating (sentiment > -0.5)

### Backend Sync Failing

- Verify API endpoints are implemented
- Check Bearer token in request headers
- Review error logs from `syncSianiData()`

---

## 📈 Monitoring

### Key Metrics to Track

```typescript
// Follow-up stats
const stats = getFollowUpStats(userId);
console.log(stats.averageTimeToEngagement); // Days to action

// Rapport over time
const rapportScore = sianiMemory.calculateRapportScore();
console.log(rapportScore); // 0-100

// SDOH detection accuracy
const detections = detectSDOHIndicators(message);
const confirmed = user.confirmedNeeds; // Manual validation
const accuracy = (confirmed / detections.length) * 100;
```

---

## ✅ Pre-Launch Checklist

**Intelligence Systems**:

- [x] SDOH categories defined
- [x] Memory system storing moments
- [x] Resource catalog populated
- [x] Vector embeddings configured
- [x] Conversation engine orchestrating
- [x] Follow-up engine scheduling
- [x] API sync wired up
- [x] Mobile UI integrated

**Production Readiness**:

- [ ] Replace simulated STT with real service
- [ ] Configure OpenAI embeddings API
- [ ] Implement backend endpoints
- [ ] Add resource CMS/admin
- [ ] Test with real users
- [ ] Monitor SDOH detection accuracy
- [ ] A/B test rapport thresholds

---

## 🎓 Philosophy Reminders

1. **Best Friend, Not Case Manager**

   - Never use clinical language
   - Offer resources casually
   - Give full control to user

2. **Passive Detection, Not Interrogation**

   - Listen for patterns naturally
   - Don't ask screening questions
   - Wait for user to share

3. **Rapport Before Resources**

   - Build trust over multiple conversations
   - Don't offer too soon
   - Respect emotional state

4. **Follow-Up Like You Care**

   - Natural check-ins
   - Give user an out
   - Auto-abandon if ignored

5. **Remember Context**
   - Reference past moments
   - Acknowledge emotional patterns
   - Show you're paying attention

---

**"Not a helper — someone you aspire to be close to."**
