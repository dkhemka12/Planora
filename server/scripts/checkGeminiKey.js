import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates Google Gemini API Key by making a lightweight test request
 */
async function testGeminiKey() {
  const key = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LLM_MODEL || 'gemini-1.5-flash';

  console.log('\n===============================================================');
  console.log('       PLANORA — GOOGLE GEMINI API KEY CHECKER                 ');
  console.log('===============================================================\n');

  if (!key || key.trim() === '' || key.includes('mock_key') || key.includes('your_')) {
    console.log('⚠️ Status: PLACEHOLDER KEY DETECTED');
    console.log('---------------------------------------------------------------');
    console.log('Current value in server/.env:');
    console.log(`  LLM_API_KEY=${key || '(empty)'}`);
    console.log('\n👉 How to set your key:');
    console.log('  1. Open server/.env');
    console.log('  2. Replace "mock_key_or_set_your_gemini_key" with your Gemini API key (starts with AIza...)');
    console.log('  3. Run: npm run check:gemini');
    console.log('===============================================================\n');
    return false;
  }

  const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '****';
  console.log(`📡 Testing API Key: ${maskedKey}`);
  console.log(`🤖 Model Target:    ${model}`);
  console.log('---------------------------------------------------------------');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond with exactly: "Gemini API is working perfectly for Planora!"' }],
          },
        ],
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log('🎉 SUCCESS: Your Google Gemini API Key is ACTIVE and WORKING!');
      console.log(`💬 Model Response: "${responseText}"`);
      console.log('===============================================================\n');
      return true;
    } else {
      console.log(`❌ ERROR (HTTP ${res.status}): API request was rejected.`);
      console.log(`   Message: ${data.error?.message || JSON.stringify(data)}`);
      console.log('===============================================================\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ NETWORK ERROR: Failed to connect to Google Gemini endpoint.`);
    console.log(`   Details: ${error.message}`);
    console.log('===============================================================\n');
    return false;
  }
}

testGeminiKey().then((isWorking) => {
  process.exit(isWorking ? 0 : 1);
});
