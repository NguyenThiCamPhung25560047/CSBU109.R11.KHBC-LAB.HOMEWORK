CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(150) NOT NULL,
    nationality VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    publish_year INT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_name VARCHAR(150) NOT NULL,
    borrow_date DATE NOT NULL,
    return_date DATE NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

INSERT INTO authors (author_name, nationality) VALUES
('J.K. Rowling', 'British'),
('George Orwell', 'British'),
('Robert C. Martin', 'American');

INSERT INTO books (title, author_id, category, publish_year) VALUES
("Harry Potter and the Philosopher's Stone", 1, 'Fantasy', 1997),
('1984', 2, 'Dystopian', 1949),
('Clean Code', 3, 'Tech', 2008);

INSERT INTO borrow_records (book_id, borrower_name, borrow_date, return_date) VALUES
(1, 'Nha Phuong', '2026-09-01', '2026-09-15'),
(2, 'Truong Giang', '2026-09-05', NULL),
(3, 'Ly Ly', '2026-09-10', '2026-09-20');

SELECT 
    b.title AS `Book Title`,
    a.author_name AS `Author Name`,
    br.borrower_name AS `Borrower Name`,
    br.borrow_date AS `Borrow Date`
FROM borrow_records br
JOIN books b ON br.book_id = b.id
JOIN authors a ON b.author_id = a.id;