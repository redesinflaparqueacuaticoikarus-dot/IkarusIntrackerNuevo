-- ==========================================
-- IKARUS MANUAL ORDERS & QR VALIDATION MODULE
-- SUPABASE MIGRATION SCRIPT
-- ==========================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.productos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    descripcion text,
    precio numeric NOT NULL DEFAULT 0,
    tipo text NOT NULL CHECK (tipo IN ('paquete', 'consumible')),
    lugar_validacion text CHECK (lugar_validacion IN ('puerta', 'restaurante', 'otro')),
    componentes jsonb DEFAULT '{"items": []}'::jsonb, -- Used for 'paquete': {"items": [{"producto_id": "uuid", "cantidad": 2}]}
    requiere_proteina boolean DEFAULT false,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ordenes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL, -- Format: IK-YYYYMMDD-XXXX
    tipo_orden text NOT NULL CHECK (tipo_orden IN ('combo', 'grupo')),
    cliente_nombre text NOT NULL,
    cliente_cc text NOT NULL,
    cliente_telefono text,
    cliente_email text NOT NULL,
    fecha_visita date NOT NULL,
    cantidad_personas int NOT NULL,
    total numeric NOT NULL DEFAULT 0,
    estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'usada_parcial', 'usada_total', 'cancelada')),
    email_enviado boolean DEFAULT false,
    email_enviado_at timestamp with time zone,
    observaciones text,
    creada_por text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orden_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id uuid NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    producto_id uuid NOT NULL REFERENCES public.productos(id),
    producto_nombre text NOT NULL, -- snapshot
    lugar_validacion text,
    proteina text CHECK (proteina IN ('pollo', 'cerdo', null)),
    estado text NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending', 'used')),
    usado_at timestamp with time zone,
    usado_por text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.escaneo_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id uuid REFERENCES public.ordenes(id),
    orden_codigo text,
    resultado text NOT NULL CHECK (resultado IN ('allowed', 'blocked_used', 'blocked_invalid', 'date_warning')),
    items_usados_ids uuid[],
    escaneado_por text,
    notas text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Trigger Function for Order State
CREATE OR REPLACE FUNCTION update_orden_estado()
RETURNS TRIGGER AS $$
DECLARE
    total_items int;
    used_items int;
    current_estado text;
BEGIN
    -- Determine the order ID based on the operation
    DECLARE ord_id uuid;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            ord_id := OLD.orden_id;
        ELSE
            ord_id := NEW.orden_id;
        END IF;

        -- Check the current state of the order
        SELECT estado INTO current_estado FROM public.ordenes WHERE id = ord_id;

        -- If the order is cancelled, do not recalculate
        IF current_estado = 'cancelada' THEN
            RETURN NULL;
        END IF;

        -- Count totals
        SELECT COUNT(*), COUNT(*) FILTER (WHERE estado = 'used')
        INTO total_items, used_items
        FROM public.orden_items
        WHERE orden_id = ord_id;

        -- Update the order's state
        IF total_items = 0 THEN
            -- Edge case: no items
            UPDATE public.ordenes SET estado = 'activa' WHERE id = ord_id;
        ELSIF used_items = 0 THEN
            UPDATE public.ordenes SET estado = 'activa' WHERE id = ord_id;
        ELSIF used_items = total_items THEN
            UPDATE public.ordenes SET estado = 'usada_total' WHERE id = ord_id;
        ELSE
            UPDATE public.ordenes SET estado = 'usada_parcial' WHERE id = ord_id;
        END IF;
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_orden_estado
AFTER INSERT OR UPDATE OF estado OR DELETE ON public.orden_items
FOR EACH ROW EXECUTE FUNCTION update_orden_estado();

-- 3. Seed Data
-- 3.1 Insert Consumibles
INSERT INTO public.productos (id, nombre, descripcion, precio, tipo, lugar_validacion, requiere_proteina, activo)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'Atracción acuática', 'Entrada a la atracción acuática', 55000, 'consumible', 'puerta', false, true),
    ('10000000-0000-0000-0000-000000000002', 'Almuerzo divino', 'Sopa del día, arroz, pechuga o cerdo grille 120gr, papa francesa, ensalada y vaso de limonada 7oz', 35000, 'consumible', 'restaurante', true, true),
    ('10000000-0000-0000-0000-000000000003', 'Desayuno celestial', 'Desayuno especial del restaurante', 18400, 'consumible', 'restaurante', false, true)
ON CONFLICT (id) DO NOTHING;

-- 3.2 Insert Paquetes
INSERT INTO public.productos (id, nombre, descripcion, precio, tipo, componentes, requiere_proteina, activo)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Brazalete Fauno', 'Solo atracción', 55000, 'paquete', 
     '{"items": [{"producto_id": "10000000-0000-0000-0000-000000000001", "cantidad": 1}]}'::jsonb, false, true),
     
    ('20000000-0000-0000-0000-000000000002', 'Paquete Grifo', 'Atracción + Almuerzo', 86000, 'paquete', 
     '{"items": [{"producto_id": "10000000-0000-0000-0000-000000000001", "cantidad": 1}, {"producto_id": "10000000-0000-0000-0000-000000000002", "cantidad": 1}]}'::jsonb, false, true),
     
    ('20000000-0000-0000-0000-000000000003', 'Paquete Eufrosina', 'Atracción + Almuerzo + Desayuno', 104400, 'paquete', 
     '{"items": [{"producto_id": "10000000-0000-0000-0000-000000000001", "cantidad": 1}, {"producto_id": "10000000-0000-0000-0000-000000000002", "cantidad": 1}, {"producto_id": "10000000-0000-0000-0000-000000000003", "cantidad": 1}]}'::jsonb, false, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escaneo_log ENABLE ROW LEVEL SECURITY;

-- 4.1 Create Permissive Policies (to be tightened later)
CREATE POLICY "Enable all actions for everyone on productos" ON public.productos FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone on ordenes" ON public.ordenes FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone on orden_items" ON public.orden_items FOR ALL USING (true);
CREATE POLICY "Enable all actions for everyone on escaneo_log" ON public.escaneo_log FOR ALL USING (true);

-- Done
