require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function setupDatabase(connection) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS store_transaction_db;`);
  await connection.query(`USE store_transaction_db;`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      balance DECIMAL(12, 2) NOT NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(150) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      stock INT NOT NULL
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);
  await connection.query(`TRUNCATE TABLE order_items;`);
  await connection.query(`TRUNCATE TABLE orders;`);
  await connection.query(`TRUNCATE TABLE products;`);
  await connection.query(`TRUNCATE TABLE customers;`);
  await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);

  await connection.query(`
    INSERT INTO customers (full_name, balance) VALUES
    ('Nguyen Van A', 5000000.00),
    ('Tran Thi B', 100000.00);
  `);

  await connection.query(`
    INSERT INTO products (product_name, price, stock) VALUES
    ('Wireless Mouse', 250000.00, 10),
    ('Mechanical Keyboard', 1200000.00, 2);
  `);
}

async function processOrder(customerId, productId, quantity) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [customers] = await connection.execute(
      'SELECT balance FROM customers WHERE id = ? FOR UPDATE',
      [customerId]
    );
    const [products] = await connection.execute(
      'SELECT price, stock FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );

    if (customers.length === 0 || products.length === 0) {
      throw new Error('Customer or product not found.');
    }

    const customer = customers[0];
    const product = products[0];
    const totalAmount = product.price * quantity;

    if (customer.balance < totalAmount) {
      throw new Error('Insufficient customer balance.');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient product stock.');
    }

    await connection.execute(
      'UPDATE customers SET balance = balance - ? WHERE id = ?',
      [totalAmount, customerId]
    );

    await connection.execute(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_id, total_amount, created_at) VALUES (?, ?, NOW())',
      [customerId, totalAmount]
    );

    const orderId = orderResult.insertId;

    await connection.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, productId, quantity, product.price]
    );

    await connection.commit();
    console.log(`Order processed successfully! Order ID: ${orderId}`);
  } catch (error) {
    await connection.rollback();
    console.error(`Transaction failed: ${error.message}`);
  } finally {
    connection.release();
  }
}

async function main() {
  const setupConnection = await pool.getConnection();
  try {
    await setupDatabase(setupConnection);
    setupConnection.release();

    console.log('--- Test 1: Successful Order ---');
    await processOrder(1, 1, 2);

    console.log('--- Test 2: Failed Order (Insufficient Balance) ---');
    await processOrder(2, 2, 1);

    console.log('--- Test 3: Failed Order (Out of Stock) ---');
    await processOrder(1, 2, 3);
  } catch (error) {
    console.error('Error in main flow:', error);
  } finally {
    await pool.end();
  }
}

main();