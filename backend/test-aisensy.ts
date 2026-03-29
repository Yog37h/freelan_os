import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/AISENSY_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function runTest() {
    console.log('[Test] AiSensy API Key Present:', !!apiKey);
    if (!apiKey) return console.error('No API Key found in .env.local');

    const apiUrl = 'https://backend.aisensy.com/campaign/t1/api/v2';
    
    // Test parameters
    const body = {
        apiKey,
        campaignName: 'project_welcome', // The campaign the backend tries to use
        destination: '+919876543210', 
        userName: 'Test Client',
        source: 'FreelanceOS Test',
        templateParams: ['Test Client', 'Test Project', 'Test Freelancer'],
    };

    console.log('[Test] Sending request to:', apiUrl);
    console.log('[Test] Requesting Campaign Name:', body.campaignName);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.text();
        console.log('[Test] Status Code:', response.status);
        
        let parsed;
        try {
            parsed = JSON.parse(data);
            console.log('[Test] Response JSON:', JSON.stringify(parsed, null, 2));
        } catch {
            console.log('[Test] Response Text:', data);
        }

        if (response.ok) {
            console.log('\n✅ SUCCESS: API Key is valid and campaign exists!');
        } else {
            console.log('\n❌ FAILED. Analyzing error...');
            if (data.toLowerCase().includes('campaign') || data.toLowerCase().includes('not found')) {
                console.log('👉 ACTION REQUIRED: You need to create an API Campaign named "project_welcome" in your AiSensy Dashboard.');
            } else if (response.status === 401 || data.toLowerCase().includes('api key') || data.toLowerCase().includes('unauthorized')) {
                console.log('👉 ACTION REQUIRED: Your API Key is invalid. Check AiSensy Dashboard -> Manage -> API Key.');
            } else if (data.toLowerCase().includes('template') || data.toLowerCase().includes('parameter')) {
                console.log('👉 ACTION REQUIRED: Your WhatsApp Template parameters do not match the code. Make sure your approved template has 3 parameters: {{1}}, {{2}}, {{3}}.');
            }
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

runTest();
