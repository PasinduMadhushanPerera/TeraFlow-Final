const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products?limit=8',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ API Response - Products with Images:');
      console.log('Total products:', result.data.products.length);
      console.log('');
      
      result.data.products.forEach((p, i) => {
        console.log(`${i+1}. ${p.name}`);
        console.log(`   Image: ${p.image_url ? '✅ ' + p.image_url.substring(0, 60) + '...' : '❌ Missing'}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error parsing response:', error);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();
