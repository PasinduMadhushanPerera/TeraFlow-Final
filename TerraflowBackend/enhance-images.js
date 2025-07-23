const { pool } = require('./config/database');

async function checkAndEnhanceDatabase() {
  try {
    console.log('🔄 Checking current database structure...');
    
    // Check current products table structure
    const [tableDesc] = await pool.execute('DESCRIBE products');
    console.log('\nCurrent products table columns:');
    tableDesc.forEach(row => {
      console.log(`- ${row.Field}: ${row.Type}`);
    });
    
    // Check if product_images table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'product_images'");
    
    if (tables.length === 0) {
      console.log('\n🆕 Creating product_images table for multiple images...');
      
      await pool.execute(`
        CREATE TABLE product_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          image_url VARCHAR(500) NOT NULL,
          image_alt TEXT,
          display_order INT DEFAULT 1,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          INDEX idx_product_id (product_id),
          INDEX idx_display_order (display_order)
        )
      `);
      
      console.log('✅ product_images table created successfully!');
      
      // Migrate existing images from products table
      console.log('\n🔄 Migrating existing images...');
      const [products] = await pool.execute('SELECT id, image_url FROM products WHERE image_url IS NOT NULL');
      
      for (const product of products) {
        await pool.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, TRUE, 1)',
          [product.id, product.image_url]
        );
      }
      
      console.log(`✅ Migrated ${products.length} existing images to product_images table`);
      
      // Add sample additional images for demonstration
      console.log('\n🎨 Adding sample additional images for demo...');
      
      const sampleImages = [
        // Red Clay - ID 1
        { product_id: 1, image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', order: 1, primary: true },
        { product_id: 1, image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', order: 2, primary: false },
        { product_id: 1, image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', order: 3, primary: false },
        
        // White Clay - ID 2
        { product_id: 2, image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop', order: 1, primary: true },
        { product_id: 2, image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop', order: 2, primary: false },
        
        // Ceramic Bowls - ID 4
        { product_id: 4, image_url: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&h=300&fit=crop', order: 1, primary: true },
        { product_id: 4, image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop', order: 2, primary: false },
        { product_id: 4, image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop', order: 3, primary: false },
        { product_id: 4, image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop', order: 4, primary: false }
      ];
      
      // Clear existing and add new sample images
      await pool.execute('DELETE FROM product_images');
      
      for (const img of sampleImages) {
        await pool.execute(
          'INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)',
          [img.product_id, img.image_url, img.order, img.primary]
        );
      }
      
      console.log('✅ Added sample multiple images for demonstration');
      
    } else {
      console.log('\n✅ product_images table already exists');
    }
    
    // Show final structure
    const [finalImages] = await pool.execute(`
      SELECT p.name, pi.image_url, pi.display_order, pi.is_primary 
      FROM products p 
      LEFT JOIN product_images pi ON p.id = pi.product_id 
      ORDER BY p.id, pi.display_order
    `);
    
    console.log('\n📋 Final image configuration:');
    let currentProduct = '';
    finalImages.forEach(row => {
      if (row.name !== currentProduct) {
        console.log(`\n${row.name}:`);
        currentProduct = row.name;
      }
      if (row.image_url) {
        console.log(`  ${row.display_order}. ${row.image_url.substring(0, 60)}... ${row.is_primary ? '(PRIMARY)' : ''}`);
      } else {
        console.log('  No images');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkAndEnhanceDatabase();
