async function testProduction() {
  const prodUrl = "https://brandshield-ai-five.vercel.app";
  console.log(`Testing Live Production: ${prodUrl}\n`);

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`[PROD-PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[PROD-FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Unauthenticated /api/chat returns 401
  const unauthRes = await fetch(`${prodUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello" }),
  });
  assert(unauthRes.status === 401, "Unauthenticated POST /api/chat returns HTTP 401");

  // 2. Perform Auto-Login to obtain Session Token and Cookies
  const loginRes = await fetch(`${prodUrl}/api/auth/auto-login`, { method: "POST" });
  assert(loginRes.status === 200, "POST /api/auth/auto-login returns HTTP 200");
  const loginData = await loginRes.json();
  const token = loginData.token;
  const setCookie = loginRes.headers.get("set-cookie") || "";
  assert(!!token, "Received bearer session token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Cookie: setCookie.split(";")[0],
  };

  // 3. Test Vector RAG Search (/api/guidelines/search)
  const searchRes = await fetch(`${prodUrl}/api/guidelines/search`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ query: "brand logo clear space and contrast" }),
  });
  assert(searchRes.status === 200, "POST /api/guidelines/search returns HTTP 200");
  const searchData = await searchRes.json();
  console.log("Search metadata:", {
    total: searchData.total,
    searchMode: searchData.searchMode,
    vectorActive: searchData.vectorActive,
    embeddingProvider: searchData.embeddingProvider,
  });
  assert(typeof searchData.searchMode === "string", "searchMode is exposed in search API");
  assert(typeof searchData.vectorActive === "boolean", "vectorActive boolean flag is exposed");
  assert(searchData.embeddingProvider === "gemini" || searchData.embeddingProvider === "openai", "Active embedding provider identified");

  // 4. Test Dedicated RAG Query (/api/rag/query)
  const ragRes = await fetch(`${prodUrl}/api/rag/query`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ query: "WCAG contrast" }),
  });
  assert(ragRes.status === 200, "POST /api/rag/query returns HTTP 200");
  const ragData = await ragRes.json();
  assert(typeof ragData.searchMode === "string", "RAG query reports searchMode");

  // 5. Test Live Conversational Chatbot (POST /api/chat)
  const chatRes = await fetch(`${prodUrl}/api/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ message: "What are our official brand colors and WCAG rules?" }),
  });
  assert(chatRes.status === 200, "POST /api/chat returns HTTP 200");
  const chatData = await chatRes.json();
  console.log("Live Chatbot Response:", {
    sessionId: chatData.sessionId,
    provider: chatData.provider,
    replySnippet: chatData.reply?.slice(0, 80) + "...",
  });
  assert(typeof chatData.sessionId === "string" && chatData.sessionId.length > 0, "Chatbot returned valid sessionId");
  assert(typeof chatData.reply === "string" && chatData.reply.length > 30, "Chatbot returned substantive reply");

  const liveSessionId = chatData.sessionId;

  // 6. Test Multi-Turn Chat (POST /api/chat with existing sessionId)
  const followUpRes = await fetch(`${prodUrl}/api/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      sessionId: liveSessionId,
      message: "Can we use 100% safe in marketing materials?",
    }),
  });
  assert(followUpRes.status === 200, "Follow-up message in session returns HTTP 200");
  const followUpData = await followUpRes.json();
  assert(followUpData.sessionId === liveSessionId, "Preserved sessionId on follow-up");

  // 7. Test Conversation History Retrieval (GET /api/chat)
  const listRes = await fetch(`${prodUrl}/api/chat`, {
    headers: authHeaders,
  });
  assert(listRes.status === 200, "GET /api/chat list sessions returns HTTP 200");
  const listData = await listRes.json();
  assert(Array.isArray(listData.sessions) && listData.sessions.length > 0, "User sessions list populated");

  // 8. Test Session Messages Detail (GET /api/chat?sessionId=...)
  const historyRes = await fetch(`${prodUrl}/api/chat?sessionId=${liveSessionId}`, {
    headers: authHeaders,
  });
  assert(historyRes.status === 200, "GET /api/chat?sessionId=... returns HTTP 200");
  const historyData = await historyRes.json();
  assert(historyData.messages?.length >= 4, "Retrieved 4+ messages in conversation");

  // 9. Test PDF Ingestion endpoint (GET /api/guidelines/upload)
  const uploadOptionsRes = await fetch(`${prodUrl}/api/guidelines/upload`, {
    headers: authHeaders,
  });
  assert(uploadOptionsRes.status === 200, "GET /api/guidelines/upload returns HTTP 200");

  console.log("\n==================================================");
  console.log(`PRODUCTION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

testProduction().catch((err) => {
  console.error("Production test error:", err);
  process.exit(1);
});

