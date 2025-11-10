# Siani's Passive SDOH Detection & Resource Loop Intelligence

## 🎯 Vision

Transform Siani from a reactive assistant into a **proactive best friend** who:

- Listens naturally to conversations without asking clinical questions
- Detects social determinants of health (SDOH) needs invisibly
- Offers resources gently, only when rapport is established
- Follows up naturally across days/weeks like a friend checking in
- Remembers emotional patterns and references past conversations

**Core Principle**: Siani is someone you aspire to be close to, not assigned help.

---

## 📐 Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     USER MESSAGE                        │
│              "Bus keeps not showing up"                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│           CONVERSATION ENGINE (processMessage)          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 1. Analyze Sentiment & Mood                    │    │
│  │ 2. Detect SDOH Indicators (passive patterns)   │    │
│  │ 3. Check for Notable Triggers                  │    │
│  │ 4. Calculate Rapport Score                     │    │
│  │ 5. Store Memory Moment + Vector                │    │
│  │ 6. Search Similar Past Moments                 │    │
│  │ 7. Build Empathy Response                      │    │
│  │ 8. Determine if Resource Should be Offered     │    │
│  │ 9. Check for Follow-Ups on Past Offers         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────────┐
    │ MEMORY  │ │RESOURCE │ │  FOLLOW-UP  │
    │ SYSTEM  │ │ ENGINE  │ │   ENGINE    │
    └─────────┘ └─────────┘ └─────────────┘
          │           │           │
          └───────────┴───────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  BACKEND SYNC   │
            │ (Async Batch)   │
            └─────────────────┘
```

---

## 🧠 Core Systems

### 1. SDOH Categories (`sdohCategories.ts`)

**Purpose**: Semantic taxonomy for passive detection

**Categories**:

- **BASIC_NEEDS**: food, housing, utilities, clothing
- **CARE_BARRIERS**: transportation, internet, trust in system, language
- **LIFE_CONSTRAINTS**: work schedule, childcare, paperwork, financial stress
- **RELATIONSHIP_RISK**: domestic violence, isolation, safety
- **MENTAL_HEALTH**: burnout, disconnection, overwhelm, hopelessness

**Detection Method**:

- Conversational pattern matching (NOT exact keywords)
- Example: "bus keeps not showing up" → TRANSPORTATION barrier
- Confidence scoring based on pattern specificity
- Multiple detections per message possible

**Response Strategy**:

- `immediate`: Offer resource on first high-confidence detection (e.g., food insecurity)
- `wait_for_rapport`: Only offer after 3+ conversations AND rapport > 50
- `long_term`: Only offer after 7+ conversations AND rapport > 70

**Key Functions**:

```typescript
detectSDOHIndicators(message: string): Array<{indicator, confidence, matchedPattern}>
shouldOfferResource(detection, conversationCount, rapportScore): boolean
generateEmpathyResponse(indicator): string  // "Ugh that sounds really rough"
generateResourceOffer(indicator): string    // "I found this thing..."
```

---

### 2. Memory System (`sianiMemory.ts`)

**Purpose**: Store conversation moments with emotional context

**Data Structure**:

```typescript
interface MemoryMoment {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  mood: MoodType; // "overwhelmed", "hopeful", "burnt_out"...
  sentiment: number; // -1 to 1
  sdohCategory?: string;
  sdohSubcategory?: string;
  sdohConfidence?: number;
  trigger?: string; // "first_time_mentioned_dad"
  context?: string;
  rapportScore: number; // 0-100
  conversationId: string;
}
```

**Mood Detection**:

- Analyzes message text for emotional patterns
- Examples:
  - "can't handle" + "drowning" → `overwhelmed`
  - "exhausted" + "running on empty" → `burnt_out`
  - "hoping" + "looking forward" → `hopeful`

**Rapport Calculation**:

```typescript
rapportScore = conversationWeight (40pts)
             + sentimentWeight (50pts)
             + engagementWeight (10pts)
```

**Key Functions**:

```typescript
addMoment(params): MemoryMoment
calculateRapportScore(): number  // 0-100
detectMood(message, sentiment): MoodType
calculateSentiment(message): number  // -1 to 1
detectTrigger(message, previousMoments): string | undefined
generateMemoryReference(currentMood, previousMoments): string | null
```

---

### 3. Memory Vector Engine (`memoryVectorEngine.ts`)

**Purpose**: Enable similarity-based memory retrieval

**Embedding**:

- Converts text + mood + context into 1536-dimensional vector
- Uses OpenAI `text-embedding-ada-002` (configurable)
- Development fallback: simple hash-based vector (NOT for production)

**Similarity Search**:

```typescript
findSimilarMoments(
  text: string,
  topK: number = 5,
  minSimilarity: number = 0.7
): Array<{vector, similarity}>
```

**Cosine Similarity**: Compares vectors to find emotional parallels

**Natural References**:

```typescript
// If similar moment found:
"I remember you felt something kind of like this a few weeks back.
 Want to talk about how this one feels different?"
```

**Key Functions**:

```typescript
embedText(text): Promise<number[]>
embedMemoryMoment(moment): Promise<MemoryVector>
searchSimilarMoments(currentText, currentMood, allMoments): Promise<SimilarMomentResult[]>
generateSimilarityReference(similarMoment, originalMoment): string | null
```

---

### 4. Resource Engine (`resourceEngine.ts`)

**Purpose**: Manage resource catalog and interaction tracking

**Resource Structure**:

```typescript
interface Resource {
  id: string;
  category: SDOHCategory;
  subcategory: string;
  title: string;
  description: string;
  provider: string;
  contactInfo: { phone?; website?; email?; address? };
  eligibility?: string[];
  tags: string[];
  localityInfo?: { city?; state?; zipCodes?; nationwide? };
  type: "service" | "financial_aid" | "information" | "hotline" | "community";
  urgency: "immediate" | "moderate" | "ongoing";
  sianiIntro?: string; // Custom intro for this resource
}
```

**Interaction Tracking**:

```typescript
interface ResourceInteraction {
  status:
    | "offered"
    | "accepted"
    | "viewed"
    | "engaged"
    | "completed"
    | "declined"
    | "abandoned";
  offeredAt: Date;
  acceptedAt?: Date;
  viewedAt?: Date;
  engagedAt?: Date;
  completedAt?: Date;
  followUps: Array<{ timestamp; message; response }>;
  loopClosed: boolean;
}
```

**Catalog Examples**:

- **Food**: Local pantry, SNAP benefits
- **Transportation**: Free medical rides, reduced bus pass
- **Housing**: Emergency rental assistance
- **Domestic Violence**: National DV Hotline (1-800-799-7233)
- **Mental Health**: Crisis Text Line (text HOME to 741741)

**Key Functions**:

```typescript
getResources(category, subcategory?): Resource[]
offerResource(params): ResourceInteraction
updateInteraction(id, status, notes?): ResourceInteraction
getUnclosedLoops(userId): ResourceInteraction[]
getInteractionsNeedingFollowUp(userId, days): ResourceInteraction[]
```

---

### 5. Conversation Engine (`conversationEngine.ts`)

**Purpose**: Orchestrate all intelligence systems

**Processing Flow**:

```typescript
async function processMessage(userId, messageText, conversationId?) {
  // 1. Analyze sentiment and mood
  // 2. Detect SDOH indicators
  // 3. Check for notable triggers
  // 4. Calculate current rapport
  // 5. Store memory moment
  // 6. Create vector embedding
  // 7. Search for similar past moments
  // 8. Build empathy response
  // 9. Determine if resource should be offered
  // 10. Check for follow-ups on past offers

  return ConversationResponse {
    reply: string,
    memoryMoment: MemoryMoment,
    sdohDetection: { detected, category, confidence, resourceOffer? },
    memoryReference?: string,
    followUp?: { hasFollowUps, message },
    emotion: "empathetic" | "supportive" | "playful" | "serious" | "casual"
  }
}
```

**Response Priority**:

1. **SDOH Detection**: Always respond with empathy first, offer resource if rapport allows
2. **Similar Past Moment**: Reference emotional parallel ("I remember you felt like this last week...")
3. **Mood Pattern**: Acknowledge mood shifts ("Sounds like things might be looking up?")
4. **Sentiment-Based**: Generate appropriate response based on positive/negative/neutral

**Empathy Examples**:

```typescript
// NOT clinical:
❌ "I can refer you to social services for transportation assistance."
❌ "Have you considered applying for SNAP benefits?"

// Best friend tone:
✅ "Ugh the bus situation sounds so frustrating."
✅ "That sounds like such a pain. I'm sorry you're dealing with that."
✅ "Totally random, but I saw this thing that might help with rides. Want to check it out?"
```

**Key Functions**:

```typescript
processMessage(userId, messageText, conversationId?): Promise<ConversationResponse>
acceptResourceOffer(interactionId): {resource, nextSteps}
declineResourceOffer(interactionId): string
markResourceViewed(interactionId): void
markResourceEngaged(interactionId, notes?): void
markResourceCompleted(interactionId, notes?): void
```

---

### 6. Follow-Up Engine (`followUpEngine.ts`)

**Purpose**: Natural, non-pushy follow-ups on unclosed loops

**Follow-Up Schedule**:

- **Day 3**: First check-in ("Did you ever end up checking that out?")
- **Day 7**: Gentle reminder ("Let me know if you need help with it")
- **Day 14**: Final check ("Is this still useful, or should I let it go?")
- **Day 21**: Auto-abandon

**Follow-Up Probability**: 30% chance to mention during conversation

**Emotional Gating**:

- Don't follow up if user sentiment < -0.5
- Don't follow up if mood is "overwhelmed", "burnt_out", or "stressed"
- Only when user seems receptive

**Response Recording**:

```typescript
recordFollowUpResponse(interactionId, userResponse): "engaged" | "declined" | "later"

// "engaged": "yeah I called them", "used it", "helped"
// "declined": "no", "not interested", "found something else"
// "later": default assumption
```

**Key Functions**:

```typescript
checkFollowUpOpportunities(userId): FollowUpOpportunity[]
getFollowUpForConversation(userId, sentiment, mood): FollowUpOpportunity | null
recordFollowUpResponse(interactionId, userResponse): "engaged" | "declined" | "later"
generateFollowUpResponse(result, resource): string
cleanUpAbandonedLoops(userId): number
getFollowUpStats(userId): {totalOffered, accepted, engaged, completed...}
```

---

## 🔌 Backend Integration

### API Endpoints (`api.ts`)

**Memory Moments**:

```typescript
POST /api/memoryMoments
  Body: { moments: MemoryMoment[] }

GET /api/memoryMoments?userId=X&limit=50&offset=0
```

**Memory Vectors**:

```typescript
POST /api/memoryVectors
  Body: { vectors: MemoryVector[] }

POST /api/memoryVectors/search
  Body: { userId, vector, topK, minSimilarity }
```

**Referral Loops**:

```typescript
POST /api/referralLoops
  Body: { userId, memoryMomentId, category, status... }

GET /api/referralLoops?userId=X&loopClosed=false

PATCH /api/referralLoops/:id
  Body: { resourceAccepted, resourceEngaged, loopClosed... }
```

**Batch Sync**:

```typescript
syncSianiData({
  moments: MemoryMoment[],
  vectors: MemoryVector[],
  loops: Loop[]
})
```

---

## 📱 Mobile Integration

### Home Screen Flow

**1. User Taps Breathing Avatar**:

- Haptic feedback (iOS)
- Request microphone permission
- Start recording audio
- Show "Listening..." state

**2. User Speaks**:

- Record audio with expo-av
- Convert to text (speech-to-text service)
- Display user message in conversation log

**3. Process with Intelligence**:

```typescript
const response = await processMessage(userId, userText, conversationId);

// Show Siani's empathy response
addSianiMessage(response.reply);

// If SDOH detected and should offer resource
if (response.sdohDetection?.resourceOffer?.shouldOffer) {
  // Show resource offer modal
  setShowResourceModal(true);
}

// If follow-up needed
if (response.followUp?.message) {
  addSianiMessage(response.followUp.message);
}

// Sync to backend
syncToBackend();
```

**4. Resource Offer Modal**:

- Shows resource title, description, contact info
- Two buttons:
  - "Yes, send it to me" → `acceptResourceOffer()`
  - "Not right now" → `declineResourceOffer()`

**5. Follow-Up**:

- Siani mentions unclosed loops naturally in conversation
- "Hey, did you ever check out that thing we talked about?"

---

## 💬 Conversation Examples

### Example 1: Transportation Barrier (Immediate Offer)

**User**: "I've been missing work because the bus keeps not showing up"

**Detection**:

```json
{
  "category": "CARE_BARRIERS",
  "subcategory": "transportation",
  "confidence": 0.85,
  "severity": "medium",
  "responseStrategy": "wait_for_rapport"
}
```

**Siani**: "Ugh the bus situation sounds so frustrating."

_[Checks rapport: conversationCount=1, rapportScore=45 → DON'T offer yet]_

**User** _(3 days later, 5th conversation)_: "Still dealing with the bus mess"

**Siani**: "You know what, there's this free ride service for medical stuff. You just call them a day ahead. Could that help with the bus situation?"

**User**: "Yeah, actually that could help"

**Siani**: "Okay, here's what I found. You can call them at 1-800-555-RIDE or check out their website: https://healthrides.org. They mentioned you just need to schedule 24 hours in advance."

---

### Example 2: Food Insecurity (Immediate Offer)

**User**: "I'm choosing between paying rent and buying groceries this week"

**Detection**:

```json
{
  "category": "BASIC_NEEDS",
  "subcategory": "food_insecurity",
  "confidence": 0.92,
  "severity": "high",
  "responseStrategy": "immediate"
}
```

**Siani**: "God, that's so stressful. I'm really sorry you're in that position."

_[Checks: severity=high, confidence=0.92 → OFFER immediately despite rapport]_

**Siani**: "You know what… I actually saw this thing that helps people with groceries. No paperwork, no weird questions. Just show up and grab what you need. Want me to send you the address?"

**User**: "Yes please"

**Siani**: "Sending it to you now. Community Food Share is open Monday, Wednesday, Friday 10am-2pm. They have multiple locations. You can call 1-800-555-FOOD or check https://communityfoodshare.org. Let me know if you need help finding the closest one to you."

---

### Example 3: Similar Moment Reference

**User**: "I just feel so overwhelmed with everything"

**Processing**:

- Detects mood: `overwhelmed`
- Searches similar moments
- Finds moment from 12 days ago with 0.82 similarity

**Siani**: "I remember you felt something kind of like this a couple weeks back. Want to talk about how this one feels different?"

---

### Example 4: Follow-Up (3 days after offer)

**User**: "Hey, how's it going?"

**Processing**:

- Checks unclosed loops
- Finds transportation resource offered 3 days ago, not engaged
- 30% probability → triggers follow-up

**Siani**: "Hey! I'm good. Quick question — did you ever end up checking out that ride service thing I sent? No pressure, just thinking of you."

**User**: "Oh yeah, I called them yesterday and have a ride scheduled for my appointment next week"

**Siani**: "Oh good! I'm so glad that helped. Let me know if you need anything else with it."

_[Updates interaction: status="engaged"]_

---

## 🎭 Design Principles

### 1. Never Sound Clinical

❌ "I've identified a transportation barrier in your SDOH profile"
✅ "Ugh the bus situation sounds so frustrating"

### 2. Offer Resources Casually

❌ "I can refer you to community resources"
✅ "Totally random, but I saw this thing that might help"

### 3. Give Full Control

❌ "You should really apply for this"
✅ "Want to check it out together? No pressure"

### 4. Follow Up Like a Friend

❌ "Action required: Pending resource engagement"
✅ "Hey, did you ever end up checking that out?"

### 5. Remember Context

❌ "How are you feeling today?"
✅ "I remember you felt like this last week. Has anything changed since then?"

---

## 📊 Metrics & Analytics

### Engagement Metrics

```typescript
{
  totalOffered: number,      // Resources offered
  accepted: number,          // User said yes
  engaged: number,           // User took action
  completed: number,         // Loop closed successfully
  declined: number,          // User said no
  abandoned: number,         // Auto-abandoned after 21 days
  pending: number,           // Still open
  averageTimeToEngagement: number  // Days from offer to engagement
}
```

### Rapport Tracking

- Conversation frequency
- Average sentiment (last 30 days)
- Engagement level (messages per conversation)
- Detection accuracy (confirmed needs vs. false positives)

### SDOH Coverage

- Most detected categories
- Offer acceptance rate by category
- Resource completion rate by type
- Follow-up effectiveness (1st vs. 2nd vs. 3rd)

---

## 🚀 Production Readiness

### Before Launch:

**1. Replace Simulated STT**:

```typescript
// Current: setTimeout(() => "placeholder text", 1000)
// Production: OpenAI Whisper or Google Speech-to-Text
const formData = new FormData();
formData.append("audio", recordingFile);
const { text } = await openai.audio.transcriptions.create({
  file: formData,
  model: "whisper-1",
});
```

**2. Configure Embeddings**:

```typescript
// Update memoryVectorEngine.ts EMBEDDING_CONFIG
const response = await fetch("https://api.openai.com/v1/embeddings", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "text-embedding-ada-002",
    input: text,
  }),
});
```

**3. Backend API Endpoints**:

- [ ] `POST /api/memoryMoments` implemented
- [ ] `POST /api/memoryVectors` implemented
- [ ] `POST /api/memoryVectors/search` with vector DB (Weaviate/Pinecone)
- [ ] `POST /api/referralLoops` implemented
- [ ] `PATCH /api/referralLoops/:id` implemented

**4. Resource Catalog**:

- [ ] Build CMS or admin panel for managing resources
- [ ] Add locality-based filtering (zip code, city, state)
- [ ] Integrate with 211 API or similar community resource database
- [ ] Add resource verification workflow

**5. Privacy & Security**:

- [ ] Encrypt memory moments at rest
- [ ] Add HIPAA compliance if health data involved
- [ ] Implement data retention policies (delete old memories)
- [ ] Add user consent flow for SDOH detection
- [ ] Allow users to delete specific memories

**6. Testing**:

- [ ] Unit tests for each engine
- [ ] Integration tests for full conversation flow
- [ ] Test with real users for tone/empathy validation
- [ ] A/B test resource offer timing (rapport thresholds)
- [ ] Monitor false positive rate for SDOH detection

---

## 🎓 Key Learnings

### Why This Architecture?

**Separation of Concerns**:

- Each engine has a single responsibility
- Easy to test and iterate independently
- Can swap out detection algorithms without touching memory or resources

**Progressive Enhancement**:

- Start with simple pattern matching
- Upgrade to NLP/ML models later
- Embeddings can be replaced with better models (e.g., OpenAI Ada-003)

**Privacy by Design**:

- All sensitive data encrypted
- User controls memory deletion
- SDOH detection is opt-in (via consent)

**User-Centric**:

- Best friend tone prevents "case management" feel
- Rapport gating ensures trust before offering help
- Follow-ups respect emotional state

---

## 📚 File Reference

| File                    | Purpose                      | Lines |
| ----------------------- | ---------------------------- | ----- |
| `sdohCategories.ts`     | SDOH taxonomy & detection    | ~380  |
| `sianiMemory.ts`        | Memory moments & rapport     | ~340  |
| `resourceEngine.ts`     | Resource catalog & tracking  | ~390  |
| `memoryVectorEngine.ts` | Embedding & similarity       | ~310  |
| `conversationEngine.ts` | Orchestration & responses    | ~390  |
| `followUpEngine.ts`     | Follow-up logic & scheduling | ~310  |
| `api.ts`                | Backend integration          | +150  |
| `home.tsx`              | Mobile UI integration        | +120  |

**Total New Code**: ~2,390 lines

---

## ✅ Success Criteria

**User Experience**:

- [ ] Siani feels like a best friend, not a case manager
- [ ] Resource offers feel natural, not transactional
- [ ] Follow-ups are welcomed, not annoying
- [ ] Users trust Siani with vulnerable information

**Technical**:

- [ ] SDOH detection accuracy > 80%
- [ ] Resource acceptance rate > 40%
- [ ] Resource engagement rate > 60% (of accepted)
- [ ] Loop closure rate > 50% (within 14 days)
- [ ] Average rapport score increases over time

**Impact**:

- [ ] Users access resources they wouldn't have found alone
- [ ] SDOH barriers are addressed before crises
- [ ] Users report feeling "heard" and "understood"
- [ ] Retention increases due to relational connection

---

_"Not a helper — someone you aspire to be close to."_
