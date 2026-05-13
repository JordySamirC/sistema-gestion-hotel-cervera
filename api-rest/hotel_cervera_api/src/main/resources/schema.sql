DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grupos' AND column_name='creado_por') THEN
    ALTER TABLE grupos ADD COLUMN creado_por UUID REFERENCES usuarios(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reservas' AND column_name='creado_por') THEN
    ALTER TABLE reservas ADD COLUMN creado_por UUID REFERENCES usuarios(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gastos' AND column_name='creado_por') THEN
    ALTER TABLE gastos ADD COLUMN creado_por UUID REFERENCES usuarios(id);
  END IF;
END $$;
