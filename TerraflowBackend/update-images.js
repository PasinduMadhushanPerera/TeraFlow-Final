const { pool } = require('./config/database');

const images = {
  1: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', // Red clay
  2: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop', // White clay
  3: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400&h=300&fit=crop', // Glazing materials
  4: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&h=300&fit=crop', // Ceramic bowls
  5: 'https://images.unsplash.com/photo-1578750331706-b8b3c5e0b19e?w=400&h=300&fit=crop', // Pottery tools
  6: 'https://images.unsplash.com/photo-1605883705077-8d3b72824453?w=400&h=300&fit=crop', // Kiln fire bricks
  7: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop', // Flower vase
  8: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'  // Clay spoon
};

async function updateImages() {
  try {
    console.log('🔄 Updating product images...');
    
    for (const [id, url] of Object.entries(images)) {
      await pool.execute('UPDATE products SET image_url = ? WHERE id = ?', [url, id]);
      console.log(`✅ Updated product ${id}`);
    }
    
    console.log('✅ All product images updated successfully!');
    
    // Verify updates
    const [rows] = await pool.execute('SELECT id, name, image_url FROM products ORDER BY id');
    console.log('\n📋 Verification:');
    rows.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name.substring(0,20)}, Image: ${p.image_url ? '✅ Set' : '❌ Missing'}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating images:', error);
  } finally {
    process.exit();
  }
}

updateImages();
