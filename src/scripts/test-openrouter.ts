import { config } from "dotenv";
import { OpenRouterService } from "../lib/services/openrouter.service";

// Load environment variables from .env.local
config({ path: ".env.local" });

/**
 * Test script for OpenRouter Service
 * Run with: npm run test:openrouter
 */
async function testOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in environment");
    console.error("   Please set it in .env.local file");
    process.exit(1);
  }

  const service = new OpenRouterService(apiKey);

  console.log("🧪 Testing OpenRouter Service...\n");
  console.log("⚠️  Free tier has strict rate limits - running minimal tests\n");

  // Test 1: Simple chat (podstawowy test)
  console.log("Test 1: Simple chat");
  try {
    const response = await service.chat({
      messages: [
        {
          role: "user",
          content: "Say hello",
        },
      ],
      maxTokens: 20, // Ograniczenie tokenów dla free tier
    });

    console.log("✅ Response:", response.content);
    console.log("📊 Tokens used:", response.usage.totalTokens);
    console.log("🤖 Model:", response.model);
  } catch (error) {
    const err = error as Error;
    console.error("❌ Error:", err.message);
  }

  console.log("\n🎉 Basic test completed!");
  console.log("\n💡 Tip: For more advanced tests (JSON Schema), consider:");
  console.log("   - Adding credits at https://openrouter.ai/settings/credits");
  console.log("   - Or wait a few minutes between requests on free tier");
}

// Run tests
testOpenRouter().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
