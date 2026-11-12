import { db } from "../src/lib/db";
import { generateEmbeddings, cosineSimilarity, searchKnowledgeHybrid, getEmbeddingStatus } from "../src/lib/brandshield/server/vector-rag";

async function run() {
  console.log("==================================================");
  console.log("TESTING VECTOR RAG & CHATBOT BACKEND SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Embedding Status & Provider Verification
  const status = getEmbeddingStatus();
  console.log("Embedding status:", status);
  assert(status.configured === true, "Embedding provider is configured");
  assert(status.dimensions === 1536, "Embedding dimensionality is 1536");
  assert(status.provider === "gemini" || status.provider === "openai", "Provider is gemini or openai");

  // 2. Real Vector Embedding Generation
  const testTexts = [
    "NimbusPay official logo must maintain at least 32px clear space on all edges.",
    "Prohibited claim: Never guarantee 100% returns or zero risk investment.",
    "Primary brand color is Shield Teal (#0F766E), compliant with WCAG 2.1 AA on white.",
  ];

  const embRes = await generateEmbeddings(testTexts);
  assert(embRes !== null, "generateEmbeddings returned non-null result");
  assert(embRes?.embeddings?.length === 3, "Generated embeddings for all 3 sample texts");
  assert(embRes?.embeddings?.[0]?.length === 1536, "Embedding dimension is exactly 1536");
  assert(embRes?.embeddings?.[1]?.length === 1536, "Second embedding dimension is 1536");

  // 3. Semantic Similarity vs Unrelated Text
  const queryEmb = await generateEmbeddings(["logo margin padding and clear space requirements"]);
  assert(queryEmb?.embeddings?.[0] !== null, "Query vector generated");
  const simLogo = cosineSimilarity(queryEmb.embeddings[0], embRes.embeddings[0]);
  const simFinancial = cosineSimilarity(queryEmb.embeddings[0], embRes.embeddings[1]);
  console.log(`Cosine sim (Logo match): ${simLogo.toFixed(4)}, (Financial mismatch): ${simFinancial.toFixed(4)}`);
  assert(simLogo > 0.65, "Semantic similarity for related concept > 0.65");
  assert(simLogo > simFinancial + 0.15, "Related concept scores significantly higher than unrelated");

  // 4. Ingestion & Multi-Tenant Isolated Hybrid Search
  const testOrgId = "test-rag-org-" + Date.now();
  const otherOrgId = "other-rag-org-" + Date.now();

  try {
    // Seed test org
    await db.organization.create({
      data: { id: testOrgId, name: "Test RAG Org", slug: testOrgId },
    });
    await db.organization.create({
      data: { id: otherOrgId, name: "Other Org", slug: otherOrgId },
    });

    const testDoc = await db.guidelineDocument.create({
      data: {
        orgId: testOrgId,
        title: "Test Brand Guidelines v1",
        docType: "guideline",
        content: "Guidelines for testing",
        sourceName: "test-guidelines.pdf",
      },
    });

    await db.knowledgeChunk.create({
      data: {
        orgId: testOrgId,
        documentId: testDoc.id,
        chunkIndex: 0,
        pageNumber: 1,
        ruleTag: "LOGO-01",
        text: "The master logo requires a protective perimeter of 32px on all digital surfaces.",
        keywords: "master logo protective perimeter 32px digital surfaces",
        embedding: JSON.stringify(embRes.embeddings[0]),
        embeddingModel: embRes.model,
        embeddingDim: embRes.dimensions,
      },
    });

    await db.knowledgeChunk.create({
      data: {
        orgId: testOrgId,
        documentId: testDoc.id,
        chunkIndex: 1,
        pageNumber: 2,
        ruleTag: "CLAIM-01",
        text: "Never state that any financial transaction is 100% safe or guaranteed zero risk.",
        keywords: "never state financial transaction 100% safe guaranteed zero risk",
        embedding: JSON.stringify(embRes.embeddings[1]),
        embeddingModel: embRes.model,
        embeddingDim: embRes.dimensions,
      },
    });

    // Test Search within Tenant
    const hits = await searchKnowledgeHybrid({
      orgId: testOrgId,
      query: "logo clearance boundaries",
      limit: 3,
    });

    assert(hits.length > 0, "Found search results in tenant");
    assert(hits[0].ruleTag === "LOGO-01", "Top match is LOGO-01");
    assert(hits[0].matchType === "vector" || hits[0].matchType === "hybrid", "Match type is vector or hybrid (not purely lexical)");
    assert(hits[0].pageNumber === 1, "Cites correct page number 1");
    assert(hits[0].documentTitle === "Test Brand Guidelines v1", "Cites correct document title");

    // Test Tenant Isolation (otherOrgId should get 0 results)
    const crossHits = await searchKnowledgeHybrid({
      orgId: otherOrgId,
      query: "logo clearance boundaries",
      limit: 3,
    });
    assert(crossHits.length === 0, "Tenant isolation enforced: other tenant retrieves 0 chunks");

  } finally {
    // Cleanup test data
    await db.knowledgeChunk.deleteMany({ where: { orgId: { in: [testOrgId, otherOrgId] } } }).catch(() => {});
    await db.guidelineDocument.deleteMany({ where: { orgId: { in: [testOrgId, otherOrgId] } } }).catch(() => {});
    await db.organization.deleteMany({ where: { id: { in: [testOrgId, otherOrgId] } } }).catch(() => {});
  }

  // 5. Test Chat Route Handler End-to-End
  const { POST, GET, DELETE, PATCH } = await import("../src/app/api/chat/route.ts");

  // A. Unauthenticated request
  const unauthReq = new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello" }),
  });
  const unauthRes = await POST(unauthReq);
  assert(unauthRes.status === 401, "Unauthenticated POST /api/chat returns HTTP 401");

  // B. Authenticated Request using test user
  const chatOrgId = "chat-test-org-" + Date.now();
  let chatUser;
  try {
    const org = await db.organization.create({
      data: { id: chatOrgId, name: "Chat Org", slug: chatOrgId },
    });
    chatUser = await db.user.create({
      data: {
        email: `chat-${Date.now()}@example.com`,
        name: "Chat Tester",
        role: "admin",
        orgId: org.id,
      },
    });

    // Create session token for test user
    const { createSessionToken } = await import("../src/lib/brandshield/server/auth.ts");
    const token = createSessionToken(chatUser.id);

    // Empty message validation
    const emptyReq = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: "" }),
    });
    const emptyRes = await POST(emptyReq);
    assert(emptyRes.status === 400, "Empty message returns HTTP 400");

    // Valid Chat Message -> Creates Session + Returns AI Response
    const validReq = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: "What claims are strictly prohibited in marketing?" }),
    });
    const validRes = await POST(validReq);
    assert(validRes.status === 200, "Valid message returns HTTP 200");
    const validData = await validRes.json();
    console.log("Chat response summary:", {
      sessionId: validData.sessionId,
      provider: validData.provider,
      replyLength: validData.reply?.length,
    });
    assert(typeof validData.sessionId === "string" && validData.sessionId.length > 0, "Returned valid sessionId");
    assert(typeof validData.reply === "string" && validData.reply.length > 20, "Returned informative AI reply");
    assert(
      ["gemini", "openai", "deterministic_synthesis", "deterministic_fallback"].includes(validData.provider),
      `Used valid AI provider (actual: ${validData.provider})`
    );

    const createdSessionId = validData.sessionId;

    // Follow-up message in same session
    const followUpReq = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: createdSessionId,
        message: "Can we say 100% safe if we add a footnote?",
      }),
    });
    const followUpRes = await POST(followUpReq);
    assert(followUpRes.status === 200, "Follow-up message returns HTTP 200");
    const followUpData = await followUpRes.json();
    assert(followUpData.sessionId === createdSessionId, "Follow-up message preserved sessionId");

    // GET /api/chat list sessions
    const listReq = new Request("http://localhost:3000/api/chat", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listRes = await GET(listReq);
    assert(listRes.status === 200, "GET /api/chat returns HTTP 200");
    const listData = await listRes.json();
    assert(Array.isArray(listData.sessions) && listData.sessions.length >= 1, "Listed user chat sessions");

    // GET /api/chat?sessionId=... retrieves full history
    const historyReq = new Request(`http://localhost:3000/api/chat?sessionId=${createdSessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const historyRes = await GET(historyReq);
    assert(historyRes.status === 200, "GET /api/chat?sessionId=... returns HTTP 200");
    const historyData = await historyRes.json();
    assert(historyData.messages.length === 4, "Session has 4 messages (2 user + 2 assistant)");

    // PATCH /api/chat rename session
    const renameReq = new Request("http://localhost:3000/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId: createdSessionId, title: "Prohibited Claims Discussion" }),
    });
    const renameRes = await PATCH(renameReq);
    assert(renameRes.status === 200, "PATCH /api/chat renames session");

    // DELETE /api/chat delete session
    const deleteReq = new Request(`http://localhost:3000/api/chat?sessionId=${createdSessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const deleteRes = await DELETE(deleteReq);
    assert(deleteRes.status === 200, "DELETE /api/chat deletes session");

  } finally {
    // Cleanup
    if (chatUser) {
      await db.governanceChatMessage.deleteMany({ where: { orgId: chatOrgId } }).catch(() => {});
      await db.governanceChatSession.deleteMany({ where: { orgId: chatOrgId } }).catch(() => {});
      await db.user.deleteMany({ where: { orgId: chatOrgId } }).catch(() => {});
      await db.organization.deleteMany({ where: { id: chatOrgId } }).catch(() => {});
    }
  }

  console.log("==================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
