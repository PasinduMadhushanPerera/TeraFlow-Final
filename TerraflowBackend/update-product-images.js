const { pool } = require('./config/database');

// Script to update products with real image URLs from uploaded files
const updateProductImages = async () => {
  try {
    console.log('🔄 Starting product image update...');

    // Map of product categories to actual uploaded image filenames
    const categoryImageMap = {
      'raw_materials': [
        '/uploads/products/product-1751996152203-415241586.png',
        '/uploads/products/product-1752059935855-342658321.jpg',
        '/uploads/products/product-1752059935865-863683913.jpg'
      ],
      'finished_products': [
        '/uploads/products/product-1752059935871-29042072.webp',
        '/uploads/products/product-1752059935872-486951310.jpg',
        '/uploads/products/product-1752059935879-361276407.jpg',
        '/uploads/products/product-1753520500155-346325479.webp',
        '/uploads/products/product-1753520500156-668581329.jpg',
        '/uploads/products/product-1753520500165-100157489.jpg'
      ],
      'tools': [
        '/uploads/products/product-1752059935880-156882767.jpg',
        '/uploads/products/product-1753389463170-608121192.webp',
        '/uploads/products/product-1753389463212-880955216.jpg',
        '/uploads/products/product-1753522614821-996075903.jpg',
        '/uploads/products/product-1753522614835-10788241.webp'
      ],
      'packaging': [
        '/uploads/products/product-1753389463251-40647797.jpg',
        '/uploads/products/product-1753389463260-60626732.jpg',
        '/uploads/products/product-1753389668802-810427402.jpg',
        '/uploads/products/product-1753389668803-818926462.jpg'
      ],
      'chemicals': [
        '/uploads/products/product-1753520418983-431755433.jpg',
        '/uploads/products/product-1753520419009-562194273.webp',
        '/uploads/products/product-1753522646102-879295014.jpg'
      ]
    };

    // Get all products from database
    const [products] = await pool.execute('SELECT id, category, name FROM products WHERE image_url IS NULL OR image_url = ""');
    
    console.log(`📊 Found ${products.length} products without images`);

    let updateCount = 0;

    for (const product of products) {
      const categoryImages = categoryImageMap[product.category];
      
      if (categoryImages && categoryImages.length > 0) {
        // Assign images in round-robin fashion based on product ID
        const imageIndex = (product.id - 1) % categoryImages.length;
        const imageUrl = categoryImages[imageIndex];
        
        // Update the product with the real image URL
        await pool.execute(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [imageUrl, product.id]
        );
        
        console.log(`✅ Updated product ${product.id} (${product.name}) with image: ${imageUrl}`);
        updateCount++;
      } else {
        console.log(`⚠️  No images found for category: ${product.category}`);
      }
    }

    console.log(`🎉 Successfully updated ${updateCount} products with real database images!`);
    
    // Verify the updates
    const [updatedProducts] = await pool.execute('SELECT id, name, category, image_url FROM products WHERE image_url IS NOT NULL LIMIT 5');
    console.log('\n📋 Sample updated products:');
    updatedProducts.forEach(product => {
      console.log(`   ${product.id}: ${product.name} -> ${product.image_url}`);
    });

  } catch (error) {
    console.error('❌ Error updating product images:', error);
  } finally {
    process.exit(0);
  }
};

// Run the update
updateProductImages();
