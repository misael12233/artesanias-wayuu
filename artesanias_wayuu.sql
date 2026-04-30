CREATE DATABASE IF NOT EXISTS artesanias_wayuu;
USE artesanias_wayuu;

CREATE TABLE IF NOT EXISTS artesanias_wayuu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  artesana VARCHAR(150) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  imagen_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO artesanias_wayuu (nombre, artesana, precio, categoria, imagen_url)
VALUES
  ('Mochila de hilo fino', 'Sapuana Ipuana', 140000.00, 'Mochilas', NULL),
  ('Bolso wayuu bordado', 'Epinayu Jusayu', 170000.00, 'Mochilas', NULL),
  ('Collar de mostacilla', 'Uriana Pushaina', 38000.00, 'Accesorios', NULL),
  ('Pulsera multicolor', 'Iguaran Epinayu', 30000.00, 'Accesorios', NULL),
  ('Hamaca sencilla', 'Jusayu Sapuana', 250000.00, 'Hogar', NULL),
  ('Tapiz decorativo', 'Pushaina Ipuana', 85000.00, 'Hogar', NULL),
  ('Sombrero tejido fino', 'Epieyu Uriana', 90000.00, 'Ropa', NULL),
  ('Sandalias wayuu bordadas', 'Ipuana Jusayu', 75000.00, 'Calzado', NULL),
  ('Faja tradicional', 'Sapuana Epieyu', 42000.00, 'Ropa', NULL),
  ('Mochila mediana', 'Uriana Ipuana', 125000.00, 'Mochilas', NULL),
  ('Cartera con diseno geometrico', 'Epinayu Pushaina', 115000.00, 'Accesorios', NULL),
  ('Centro de mesa wayuu', 'Jusayu Epieyu', 65000.00, 'Hogar', NULL),
  ('Aretes largos tejidos', 'Pushaina Uriana', 28000.00, 'Accesorios', NULL),
  ('Bolso cruzado wayuu', 'Iguaran Sapuana', 155000.00, 'Mochilas', NULL),
  ('Chinchorro decorativo', 'Epieyu Ipuana', 290000.00, 'Hogar', NULL);
