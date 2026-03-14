/**
 * One-time setup script to create OpenAI vector store and upload regulatory documents.
 * Run: npm run setup-vector-store
 * This will write OPENAI_VECTOR_STORE_ID to .env.local
 */

import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("❌ OPENAI_API_KEY not found. Set it in .env.local first.");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

const DOCS_DIR = path.join(__dirname, "regulatory-docs");
const ENV_FILE = path.join(__dirname, "..", ".env.local");

async function main() {
  console.log("🔧 Setting up OpenAI vector store for TLH Platform...\n");

  // Check if docs exist
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Regulatory docs directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  const docFiles = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".txt"));
  console.log(`📄 Found ${docFiles.length} regulatory documents to upload:\n`);
  docFiles.forEach((f) => console.log(`  • ${f}`));
  console.log("");

  // Step 1: Create vector store
  console.log("📦 Creating vector store...");
  const vectorStore = await openai.vectorStores.create({
    name: "TLH Platform — Indian Tax Regulations",
    expires_after: {
      anchor: "last_active_at",
      days: 365,
    },
  });
  console.log(`✅ Vector store created: ${vectorStore.id}\n`);

  // Step 2: Upload all documents
  console.log("⬆️  Uploading regulatory documents...\n");

  const fileIds: string[] = [];
  for (const fileName of docFiles) {
    const filePath = path.join(DOCS_DIR, fileName);
    const fileStream = fs.createReadStream(filePath);

    process.stdout.write(`  Uploading ${fileName}... `);
    const uploadedFile = await openai.files.create({
      file: fileStream,
      purpose: "assistants",
    });
    fileIds.push(uploadedFile.id);
    console.log(`✅ (${uploadedFile.id})`);
  }

  console.log(`\n📎 Attaching ${fileIds.length} files to vector store...`);

  // Step 3: Add files to vector store and wait for processing
  const batch = await openai.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
    file_ids: fileIds,
  });

  console.log(`\n✅ Vector store ready!`);
  console.log(`   Status: ${batch.status}`);
  console.log(`   Files: ${batch.file_counts.completed} completed, ${batch.file_counts.failed} failed`);

  if (batch.file_counts.failed > 0) {
    console.warn(`\n⚠️  ${batch.file_counts.failed} file(s) failed to process. Check the OpenAI dashboard.`);
  }

  // Step 4: Test search
  console.log("\n🔍 Testing semantic search...");
  const testQuery = "What is the TCS rate on LRS investment remittances above Rs 10 lakh?";
  const results = await openai.vectorStores.search(vectorStore.id, {
    query: testQuery,
    max_num_results: 2,
  });

  if (results.data.length > 0) {
    console.log(`\n✅ Search test passed (${results.data.length} results for "${testQuery}")`);
    console.log(`   Top result from: ${results.data[0].filename} (score: ${results.data[0].score.toFixed(3)})`);
  } else {
    console.warn("\n⚠️  Search test returned no results — check document upload");
  }

  // Step 5: Write to .env.local
  console.log(`\n💾 Writing OPENAI_VECTOR_STORE_ID to .env.local...`);

  let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf-8") : "";

  if (envContent.includes("OPENAI_VECTOR_STORE_ID=")) {
    envContent = envContent.replace(
      /OPENAI_VECTOR_STORE_ID=.*/,
      `OPENAI_VECTOR_STORE_ID=${vectorStore.id}`
    );
  } else {
    envContent += `\nOPENAI_VECTOR_STORE_ID=${vectorStore.id}\n`;
  }

  fs.writeFileSync(ENV_FILE, envContent);

  console.log("\n🎉 Setup complete!\n");
  console.log("━".repeat(60));
  console.log(`Vector Store ID: ${vectorStore.id}`);
  console.log("━".repeat(60));
  console.log("\nNext steps:");
  console.log("  1. Restart your Next.js dev server: npm run dev");
  console.log("  2. Open http://localhost:3000/chat");
  console.log("  3. Ask a tax question to test the RAG pipeline!\n");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
