INSERT INTO canales_venta (nombre, icono, activo, orden) VALUES ('Facebook', '📱', true, 1) ON CONFLICT (nombre) DO NOTHING;
INSERT INTO canales_venta (nombre, icono, activo, orden) VALUES ('Teléfono', '📞', true, 2) ON CONFLICT (nombre) DO NOTHING;
INSERT INTO canales_venta (nombre, icono, activo, orden) VALUES ('WhatsApp', '💬', true, 3) ON CONFLICT (nombre) DO NOTHING;
INSERT INTO canales_venta (nombre, icono, activo, orden) VALUES ('Boca a boca', '🗣️', true, 4) ON CONFLICT (nombre) DO NOTHING;
INSERT INTO canales_venta (nombre, icono, activo, orden) VALUES ('Otro', '📌', true, 5) ON CONFLICT (nombre) DO NOTHING;
