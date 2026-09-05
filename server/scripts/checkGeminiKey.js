import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates Google Gemini API Key by making a test request
 */
async function testGeminiKey() {
  const key = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const configuredModel = process.env.LLM_MODEL || 'gemini-3.6-flash';

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
    console.log('  2. Replace "mock_key_or_set_your_gemini_key" with your Gemini API key');
    console.log('  3. Save the file (Ctrl + S)');
    console.log('  4. Run: npm run check:gemini');
    console.log('===============================================================\n');
    return false;
  }

  const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '****';
  console.log(`📡 Testing API Key: ${maskedKey}`);
  console.log(`🤖 Model Target:    ${configuredModel}`);
  console.log('---------------------------------------------------------------');

  const modelsToTry = [
    configuredModel,
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
  ];
  // Deduplicate
  const uniqueModels = [...new Set(modelsToTry)];

  for (const model of uniqueModels) {
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
        console.log(`🎉 SUCCESS: Google Gemini API Key is ACTIVE and WORKING with [${model}]!`);
        console.log(`💬 Model Response: "${responseText}"`);
        console.log('===============================================================\n');
        return true;
      } else {
        if (model === configuredModel && uniqueModels.length > 1) {
          console.log(`⚠️ Notice: Model [${model}] reported: ${data.error?.message || 'Not available'}. Trying fallback models...`);
        }
      }
    } catch (error) {
      console.log(`❌ NETWORK ERROR with model [${model}]: ${error.message}`);
    }
  }

  console.log('❌ ERROR: All model attempts failed with the provided key.');
  console.log('===============================================================\n');
  return false;
}

testGeminiKey().then((isWorking) => {
  process.exit(isWorking ? 0 : 1);
});
