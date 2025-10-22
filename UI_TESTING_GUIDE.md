# FAQ RAG System - UI Testing Guide

## 🚀 Complete Testing Steps

### Prerequisites Checklist

Before testing, ensure you have:
- ✅ PostgreSQL with pgvector running
- ✅ Dependencies installed (`npm install`)
- ✅ Environment variables configured (`.env`)
- ✅ FAQ data seeded (`npm run seed:faq`)

---

## Step-by-Step UI Testing

### 1. Start the Backend Server

```bash
# From CarMarket-master directory
cd packages/server
npm run start:dev
```

**Look for these logs** to confirm it's working:
```
🚀 Server running on http://localhost:3000
🔌 Socket.IO server running on /chat namespace
[EmbeddingService] EmbeddingService initialized (model will load on first use)
[Nest] Application successfully started
```

### 2. Start the Frontend Client

Open a **NEW terminal** (keep the server running):

```bash
# From CarMarket-master directory
cd packages/client
npm run dev
```

**Expected output**:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 3. Open the Application

1. Open your browser
2. Go to: **http://localhost:5173**
3. You should see the CarMarket homepage

### 4. Login or Register

**Option A - Register New Account:**
1. Click **"Register"** button (top-right)
2. Fill in:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@carmarket.com`
   - Password: `Password123`
3. Click **"Register"**

**Option B - Login with Existing Account:**
1. Click **"Login"** button
2. Enter your credentials
3. Click **"Login"**

### 5. Open the Virtual Assistant

Look for the **blue chat bubble** icon in the bottom-right corner of the screen.

```
                                    ┌────────┐
                                    │   💬   │ ← Click this!
                                    └────────┘
```

Click it to open the virtual assistant chat interface.

### 6. Test FAQ Questions

Try these questions one by one:

#### Test 1: Basic Search Question
**Ask**: `How do I search for cars?`

**Expected Response**:
- Natural language answer about searching
- Mentions search bar and filters
- Includes suggestion chips
- May have "Browse Cars" action button

#### Test 2: Selling Question
**Ask**: `How do I sell my car?`

**Expected Response**:
- Step-by-step selling process
- Mentions "Sell Car" or "Create Listing"
- May have "List Your Car" action button

#### Test 3: Filters Question
**Ask**: `What filters are available?`

**Expected Response**:
- Lists available filters
- Mentions price, year, make, model, etc.

#### Test 4: Account Question
**Ask**: `How do I create an account?`

**Expected Response**:
- Registration process
- May have suggestion about logging in

#### Test 5: Favorites Question
**Ask**: `Can I save cars to favorites?`

**Expected Response**:
- Explains favorites feature
- How to add/remove favorites

#### Test 6: Messaging Question
**Ask**: `How do I contact a seller?`

**Expected Response**:
- Explains messaging system
- Chat feature information

### 7. Check the Response Quality

For each answer, verify:

✅ **Response Time**: Should appear within 1-3 seconds  
✅ **Natural Language**: Sounds conversational, not robotic  
✅ **Accuracy**: Information matches the FAQ content  
✅ **Suggestions**: Shows 3-4 related question chips  
✅ **Actions**: May show relevant action buttons  

### 8. Test Related Suggestions

After getting a response:
1. Click on one of the **suggestion chips** below the answer
2. It should automatically send that question
3. Verify you get a relevant response

### 9. Test Action Buttons

If you see action buttons like "Browse Cars" or "List Your Car":
1. Click the button
2. It should navigate you to the relevant page

---

## 🔍 What to Look For

### In the UI (Frontend)

**Virtual Assistant Panel**:
```
┌─────────────────────────────────┐
│ CarMarket Assistant        [✕]  │
├─────────────────────────────────┤
│                                 │
│ 👋 Hi! I'm your assistant...    │
│                                 │
│ [Suggestion] [Suggestion]       │
│ [Suggestion] [Suggestion]       │
│                                 │
├─────────────────────────────────┤
│ You:                            │
│ How do I search for cars?       │
│                                 │
│ Assistant:                      │
│ Searching for cars on...        │
│                                 │
│ [Browse Cars] [Action Button]   │
│                                 │
│ [Related ?] [Related ?]         │
├─────────────────────────────────┤
│ Type your message... [Send]     │
└─────────────────────────────────┘
```

### In the Server Logs

Watch the terminal where the server is running:

**Good Signs** ✅:
```
[IntentClassificationService] Intent classified as: faq (confidence: 0.95)
[ResponseHandlerService] Processing FAQ query with RAG: "How do I search for cars?"
[EmbeddingService] Generated embedding for text (27 chars) in 125ms
[FAQRAGService] Found 4 relevant FAQs in 45ms (avg similarity: 0.823)
[ResponseHandlerService] Retrieved 4 relevant FAQs (avg similarity: 0.823)
```

**First Query** (slower due to model loading):
```
[EmbeddingService] Loading embedding model: Xenova/paraphrase-multilingual-mpnet-base-v2...
[EmbeddingService] Embedding model loaded successfully in 2000ms
```

**Bad Signs** ❌:
```
Error: Extension vector does not exist
Error: Cannot find module '@xenova/transformers'
Error: OPENAI_API_KEY not found
```

---

## 📊 Performance Testing

### Measure Response Times

1. **First Query** (Cold Start):
   - Expected: 2-4 seconds (model loads)
   - Breakdown:
     - Intent classification: ~1s
     - Model loading: ~2s
     - Vector search: ~50ms
     - LLM generation: ~1s

2. **Subsequent Queries** (Warm):
   - Expected: 1-2 seconds
   - Breakdown:
     - Intent classification: ~1s
     - Embedding: ~100ms
     - Vector search: ~50ms
     - LLM generation: ~1s

### Test Multiple Questions

Ask 5-10 different FAQ questions rapidly to test:
- Cache performance
- Consistency
- Different FAQ categories

---

## 🎯 Advanced Testing

### Test Similarity Matching

Try variations of the same question:

**Original FAQ**: "How do I search for cars?"

**Variations to test**:
- ❓ "How can I find cars?"
- ❓ "What's the process to search vehicles?"
- ❓ "I want to look for a car"
- ❓ "Car search feature?"

All should return similar answers!

### Test Multilingual (if you have Vietnamese FAQs)

If you've added Vietnamese FAQs to the CSV:
- ❓ "Làm thế nào để tìm xe?"
- ❓ "Tôi muốn bán xe của mình"

### Test Edge Cases

**Very Short Query**:
- ❓ "Search?"
- ❓ "Help"

**Very Long Query**:
- ❓ "I'm interested in finding a reliable used car that has good fuel economy and doesn't cost too much and I'm wondering how your search system works and what filters are available?"

**Misspellings**:
- ❓ "How do I serch for cars?" (should still work!)
- ❓ "How do I contct a seler?"

**Out of Scope**:
- ❓ "What's the weather today?" (should gracefully handle)

---

## 🐛 Troubleshooting

### Virtual Assistant Not Appearing

**Problem**: No chat bubble in bottom-right

**Solutions**:
1. Check if VirtualAssistant component is in Layout
2. Clear browser cache
3. Check browser console for errors (F12)

### "Intent classification failed" Error

**Problem**: Can't classify intent

**Solutions**:
1. Check OPENAI_API_KEY in `.env`
2. Verify OpenAI API key is valid
3. Check internet connection

### "FAQ search failed" Error

**Problem**: Vector search not working

**Solutions**:
1. Check pgvector extension: `SELECT * FROM pg_extension WHERE extname='vector';`
2. Verify FAQ table exists: `SELECT COUNT(*) FROM faqs;`
3. Check embeddings: `SELECT COUNT(*) FROM faqs WHERE embedding IS NOT NULL;`
4. Re-run seeder: `npm run seed:faq`

### Slow First Response

**Expected**: First query takes 2-4 seconds (model loading)

This is normal! Subsequent queries will be much faster (1-2s).

**To verify**:
1. Check server logs for "Loading embedding model..."
2. Wait for "Embedding model loaded successfully"
3. Try another question - should be faster

### No Relevant FAQs Found

**Problem**: `Retrieved 0 relevant FAQs`

**Solutions**:
1. Check if FAQs were seeded: `SELECT COUNT(*) FROM faqs;`
2. Lower similarity threshold in `faq-rag.service.ts`
3. Verify embeddings exist
4. Try a different question

---

## ✅ Success Criteria

You know it's working when:

✅ Virtual assistant opens smoothly  
✅ Questions get answered within 1-3 seconds  
✅ Answers are accurate and natural  
✅ Suggestion chips appear  
✅ Action buttons work (if present)  
✅ Server logs show RAG pipeline steps  
✅ Multiple questions work consistently  

---

## 📹 Video Demo Flow

Record or follow this flow for a complete demo:

1. **Start**: Homepage → Click chat bubble
2. **Welcome**: See welcome message
3. **Question 1**: "How do I search for cars?"
4. **Show**: Natural response with suggestions
5. **Click**: Suggestion chip for related question
6. **Question 2**: Auto-filled, get new response
7. **Action**: Click action button (e.g., "Browse Cars")
8. **Navigate**: Verify navigation works
9. **Return**: Go back, ask another question
10. **Question 3**: "How do I sell my car?"
11. **Complete**: Show working end-to-end flow

---

## 🎓 Tips for Best Results

1. **Be Patient**: First query is slow (model loading)
2. **Ask Clear Questions**: Better than vague queries
3. **Try Variations**: Test semantic understanding
4. **Check Logs**: Server logs show what's happening
5. **Test Edge Cases**: Unusual questions reveal robustness

---

## 📝 Testing Checklist

Use this checklist when testing:

### Setup
- [ ] Server running on :3000
- [ ] Client running on :5173
- [ ] Logged into an account
- [ ] Virtual assistant opens

### Basic Tests
- [ ] "How do I search for cars?" - Works
- [ ] "How do I sell my car?" - Works
- [ ] "What filters are available?" - Works
- [ ] "How do I create an account?" - Works
- [ ] "Can I save favorites?" - Works

### Features
- [ ] Response time < 3 seconds
- [ ] Answers are accurate
- [ ] Suggestions appear
- [ ] Clicking suggestions works
- [ ] Action buttons work
- [ ] Multiple questions in row work

### Edge Cases
- [ ] Misspelled question - Still works
- [ ] Very short query - Handles gracefully
- [ ] Very long query - Handles gracefully
- [ ] Out of scope - Appropriate response

### Performance
- [ ] First query: 2-4 seconds (acceptable)
- [ ] Next queries: 1-2 seconds (good)
- [ ] Server logs show RAG steps
- [ ] No errors in console

---

## 🎉 You're Ready!

Once you complete these tests, your FAQ RAG system is fully functional and ready for production use!

**Questions during testing?** Check the server logs - they're very detailed and will show you exactly what's happening at each step.


