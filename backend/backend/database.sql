CREATE DATABASE IF NOT EXISTS artesanias_wayuu;
USE artesanias_wayuu;

CREATE TABLE IF NOT EXISTS artesanias_wayuu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  artesana VARCHAR(150) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO artesanias_wayuu (nombre, artesana, precio, categoria)
VALUES
  ('Mochila tradicional', 'Iguaran Epieyu', 120000.00, 'Mochilas'),
  ('Pulsera tejida', 'Pushaina Uriana', 35000.00, 'Accesorios'),
  ('Chinchorro wayuu', 'Jusayu Ipuana', 280000.00, 'Hogar'),
  ('Mochila de hilo fino', 'Sapuana Ipuana', 140000.00, 'Mochilas'),
  ('Bolso wayuu bordado', 'Epinayu Jusayu', 170000.00, 'Mochilas'),
  ('Collar de mostacilla', 'Uriana Pushaina', 38000.00, 'Accesorios'),
  ('Pulsera multicolor', 'Iguaran Epinayu', 30000.00, 'Accesorios'),
  ('Hamaca sencilla', 'Jusayu Sapuana', 250000.00, 'Hogar'),
  ('Tapiz decorativo', 'Pushaina Ipuana', 85000.00, 'Hogar'),
  ('Sombrero tejido fino', 'Epieyu Uriana', 90000.00, 'Ropa'),
  ('Sandalias wayuu bordadas', 'Ipuana Jusayu', 75000.00, 'Calzado'),
  ('Faja tradicional', 'Sapuana Epieyu', 42000.00, 'Ropa'),
  ('Mochila mediana', 'Uriana Ipuana', 125000.00, 'Mochilas'),
  ('Cartera con diseño geométrico', 'Epinayu Pushaina', 115000.00, 'Accesorios'),
  ('Centro de mesa wayuu', 'Jusayu Epieyu', 65000.00, 'Hogar'),
  ('Aretes largos tejidos', 'Pushaina Uriana', 28000.00, 'Accesorios'),
  ('Bolso cruzado wayuu', 'Iguaran Sapuana', 155000.00, 'Mochilas'),
  ('Chinchorro decorativo', 'Epieyu Ipuana', 290000.00, 'Hogar');
