const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products?limit=20',
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
      console.log('Total products returned:', result.data.products.length);
      console.log('Total items (pagination):', result.data.pagination.total_items);
      console.log('\nProducts:');
      result.data.products.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (Stock: ${p.stock_quantity}, Active: ${p.is_active})`);
      });
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
