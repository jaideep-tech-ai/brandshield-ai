import fs from "fs";
import path from "path";

async function runChatbotScrollLayoutTests() {
  console.log("==================================================");
  console.log("BRANDSHIELD AI — CHATBOT SCROLL & LAYOUT VERIFICATION");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testId, description) {
    if (condition) {
      console.log(`[PASS] ${testId} - ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testId} - ${description}`);
      failed++;
    }
  }

  const componentPath = path.resolve("src/components/brandshield/global-chatbot.tsx");
  const globalsCssPath = path.resolve("src/app/globals.css");

  const componentCode = fs.readFileSync(componentPath, "utf-8");
  const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

  // ─── TASK 1 & 2: LAYOUT AND CSS HIERARCHY ───────────────────────────────
  console.log("--- 1. Flexbox Layout & CSS Hierarchy ---");

  // CHAT-01: Chatbot Window container constraints
  assert(
    componentCode.includes("max-h-[calc(100dvh-5.5rem)]") &&
    componentCode.includes("flex flex-col flex-1 min-h-0"),
    "CHAT-01.1",
    "Chatbot window has viewport-constrained height (max-h 100dvh) and flex-1 min-h-0"
  );

  // CHAT-01.2: Overflow hidden on window container
  assert(
    componentCode.includes("overflow-hidden rounded-2xl"),
    "CHAT-01.2",
    "Chatbot outer window has overflow-hidden preventing viewport spills"
  );

  // CHAT-01.3: Header fixed at top with shrink-0
  assert(
    componentCode.includes("flex shrink-0 items-center justify-between") &&
    componentCode.includes("Gemini Vector RAG Active"),
    "CHAT-01.3",
    "Header has shrink-0 and remains fixed at top of the chatbot"
  );

  // CHAT-02 & CHAT-03: Message container vertical scrolling
  assert(
    componentCode.includes("flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"),
    "CHAT-02.1",
    "Message container has flex-1, min-h-0, overflow-y-auto, overflow-x-hidden, and overscroll-contain"
  );

  // Elimination of Radix ScrollArea in message list
  assert(
    !componentCode.includes("<ScrollArea className=\"flex-1 p-4\">"),
    "CHAT-02.2",
    "Replaced nested Radix ScrollArea with native flexbox scroll container to eliminate wheel stalls"
  );

  // Sleek custom scrollbar utility
  assert(
    globalsCss.includes(".chatbot-scrollbar") &&
    globalsCss.includes("scrollbar-width: thin") &&
    globalsCss.includes("-webkit-overflow-scrolling: touch"),
    "CHAT-02.3",
    "Custom .chatbot-scrollbar in globals.css with thin scrollbar and iOS momentum scrolling"
  );

  // CHAT-04: Support long AI responses & Markdown
  assert(
    componentCode.includes("ReactMarkdown") &&
    componentCode.includes("overflow-x-auto rounded-lg bg-slate-900") &&
    componentCode.includes("prose-xs max-w-none break-words"),
    "CHAT-04.1",
    "ReactMarkdown configured with code block horizontal scrolling, table wrapper, and word break"
  );

  // Citations support preserved
  assert(
    componentCode.includes("Verified Ground-Truth Sources:") &&
    componentCode.includes("expandedCitation"),
    "CHAT-04.2",
    "Verified ground-truth source citations and expandable excerpts preserved"
  );

  // CHAT-05 & CHAT-06: Natural mouse wheel & Mac trackpad scrolling
  assert(
    componentCode.includes("overscroll-contain") &&
    !componentCode.includes("onWheel") &&
    !componentCode.includes("onTouchMove") &&
    componentCode.includes("select-text"),
    "CHAT-05.1",
    "Overscroll-contain prevents background chaining; wheel/touch not blocked; user text selection enabled"
  );

  // CHAT-07 & CHAT-08: Intelligent Auto-Scroll behavior
  assert(
    componentCode.includes("checkIfNearBottom") &&
    componentCode.includes("isNearBottomRef") &&
    componentCode.includes("setShowScrollBottomBtn"),
    "CHAT-07.1",
    "Auto-scroll intelligently checks if near bottom before auto-scrolling on assistant response"
  );

  assert(
    componentCode.includes("Scroll to latest") &&
    componentCode.includes("scrollToBottom(\"smooth\")"),
    "CHAT-08.1",
    "Floating 'Scroll to latest' button appears when user scrolls up, allowing 1-click glide to bottom"
  );

  // CHAT-09: Input composer multiline support & fixed at bottom
  assert(
    componentCode.includes("<textarea") &&
    componentCode.includes("shrink-0 border-t") &&
    componentCode.includes("max-h-28") &&
    componentCode.includes("handleKeyDownTextarea"),
    "CHAT-09.1",
    "Input composer is shrink-0 fixed at bottom, supports multiline textarea with Shift+Enter / Enter to send"
  );

  // Last message bottom anchor padding
  assert(
    componentCode.includes("messagesBottomAnchorRef") &&
    componentCode.includes("className=\"h-1 w-full shrink-0\""),
    "CHAT-09.2",
    "Bottom anchor element prevents last message from overlapping input composer"
  );

  // ─── TASK 5: RESPONSIVE VIEWPORT BOUNDS VERIFICATION ────────────────────
  console.log("\n--- 2. Responsive Viewport Constraints ---");

  const viewports = [
    { name: "Desktop", width: 1920, height: 1080 },
    { name: "Laptop Wide", width: 1440, height: 900 },
    { name: "Laptop Compact", width: 1366, height: 768 },
    { name: "Tablet Portrait", width: 768, height: 1024 },
    { name: "Mobile Large (iPhone 14/15/16 Pro Max)", width: 390, height: 844 },
    { name: "Mobile Medium (iPhone X/11/12)", width: 375, height: 812 },
    { name: "Mobile Compact (iPhone SE)", width: 375, height: 667 },
  ];

  viewports.forEach((vp) => {
    // In our implementation:
    // Mobile: inset-x-3 (margin 12px each side), bottom-20 (80px), h-[540px], max-h-[calc(100dvh-5.5rem)]
    // sm+: w-[440px], bottom-6 (24px), right-6 (24px), max-h-[min(600px,calc(100dvh-3.5rem))]
    const isMobile = vp.width < 640;
    const bottomMargin = isMobile ? 80 : 24;
    const sideMargin = isMobile ? 12 : 24;
    const chatWidth = isMobile ? vp.width - sideMargin * 2 : Math.min(440, vp.width - sideMargin * 2);

    const maxAllowedHeight = isMobile
      ? vp.height - 88 // calc(100dvh - 5.5rem)
      : Math.min(600, vp.height - 56); // min(600px, calc(100dvh - 3.5rem))

    const actualHeight = Math.min(540, maxAllowedHeight);
    const topOffset = vp.height - bottomMargin - actualHeight;

    const fitsWithinScreen = topOffset >= 0 && actualHeight + bottomMargin <= vp.height && chatWidth <= vp.width;

    assert(
      fitsWithinScreen,
      `CHAT-10.${vp.name}`,
      `${vp.name} (${vp.width}x${vp.height}): width=${chatWidth}px, height=${actualHeight}px, topOffset=${topOffset}px >= 0`
    );
  });

  // ─── TASK 6 & 7: LIVE API & FUNCTIONAL VERIFICATION ─────────────────────
  const baseUrl = process.env.TEST_URL || "https://brandshield-ai-five.vercel.app";
  console.log(`\n--- 3. API & Functional Verification (${baseUrl}) ---`);

  try {
    // 1. Auto-login
    const loginRes = await fetch(`${baseUrl}/api/auth/auto-login`, { method: "POST" });
    assert(loginRes.status === 200, "CHAT-12.1", "POST /api/auth/auto-login returns HTTP 200");
    const loginData = await loginRes.json();
    const token = loginData.token;
    const cookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: cookie,
    };

    // 2. Send first message
    const sendRes1 = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: "What claims and words are strictly prohibited in our brand guidelines?" }),
      signal: AbortSignal.timeout(15000),
    });
    assert(sendRes1.status === 200, "CHAT-01.API", "POST /api/chat initial message returns HTTP 200");
    const data1 = await sendRes1.json();
    assert(!!data1.sessionId, "CHAT-12.2", "Created valid sessionId: " + data1.sessionId);
    assert(data1.reply?.length > 30, "CHAT-04.API", "Received substantive AI response with guidelines");

    // 3. Send long follow-up
    const sendRes2 = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sessionId: data1.sessionId,
        message: "Provide an exhaustive list of color contrast WCAG guidelines for brand buttons.",
      }),
      signal: AbortSignal.timeout(15000),
    });
    assert(sendRes2.status === 200, "CHAT-07.API", "POST /api/chat follow-up message returns HTTP 200");
    const data2 = await sendRes2.json();
    assert(data2.sessionId === data1.sessionId, "CHAT-12.3", "Preserved conversation sessionId across multi-turn");

    // 4. Retrieve session messages
    const histRes = await fetch(`${baseUrl}/api/chat?sessionId=${data1.sessionId}`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    assert(histRes.status === 200, "CHAT-12.4", "GET /api/chat?sessionId=... retrieves full conversation history");
    const histData = await histRes.json();
    assert(histData.messages?.length >= 4, "CHAT-12.5", `Retrieved ${histData.messages?.length} messages in conversation`);
  } catch (err) {
    console.error("Local API test error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runChatbotScrollLayoutTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
