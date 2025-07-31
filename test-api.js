// Test customer products API to verify data types
const testProductsAPI = async () => {
  try {
    // Test without authentication first to see if endpoint is working
    const response = await fetch('http://localhost:5000/api/customer/products', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response:', result);
    
    if (result.success && result.data.length > 0) {
      const firstProduct = result.data[0];
      console.log('\nFirst Product Data Types:');
      console.log('Price type:', typeof firstProduct.price, '- Value:', firstProduct.price);
      console.log('Stock quantity type:', typeof firstProduct.stock_quantity, '- Value:', firstProduct.stock_quantity);
      console.log('Minimum stock type:', typeof firstProduct.minimum_stock, '- Value:', firstProduct.minimum_stock);
      
      // Test if .toFixed() works
      try {
        const formattedPrice = firstProduct.price.toFixed(2);
        console.log('Price.toFixed(2) works! Result:', formattedPrice);
      } catch (error) {
        console.error('Price.toFixed(2) failed:', error.message);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testProductsAPI();
