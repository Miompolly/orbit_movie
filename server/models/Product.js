import { query } from '../db.js';

const rowToProduct = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price) || 0,
    category: row.category,
    imageUrl: row.image_url,
    stock: row.stock || 0,
    rating: Number(row.rating) || 0,
    onSale: row.on_sale || false,
    brand: row.brand || '',
  };
};

export const ProductModel = {
  async all() {
    const { rows } = await query('SELECT * FROM products');
    return rows.map(rowToProduct);
  },
  async findById(id) {
    const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
    return rowToProduct(rows[0]) || null;
  },
  async save(product) {
    const exists = await this.findById(product.id);
    if (exists) {
      const { rows } = await query(
        `UPDATE products SET name=$1, description=$2, price=$3, category=$4, image_url=$5, stock=$6, rating=$7, on_sale=$8, brand=$9 WHERE id=$10 RETURNING *`,
        [product.name, product.description, product.price, product.category, product.imageUrl, product.stock, product.rating || 0, product.onSale || false, product.brand || '', product.id]
      );
      return rowToProduct(rows[0]);
    } else {
      const { rows } = await query(
        `INSERT INTO products (id, name, description, price, category, image_url, stock, rating, on_sale, brand) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [product.id, product.name, product.description, product.price, product.category, product.imageUrl, product.stock, product.rating || 0, product.onSale || false, product.brand || '']
      );
      return rowToProduct(rows[0]);
    }
  },
  async remove(id) {
    const { rowCount } = await query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
  }
};
