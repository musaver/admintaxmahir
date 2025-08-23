// Test if Inngest endpoint is working
async function testInngestEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/inngest', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Inngest endpoint status:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Inngest endpoint is accessible');
      console.log('Response preview:', data.substring(0, 200) + '...');
    } else {
      console.log('❌ Inngest endpoint error:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Failed to reach Inngest endpoint:', error.message);
    console.log('💡 Make sure your Next.js dev server is running on port 3000');
  }
}

testInngestEndpoint();
