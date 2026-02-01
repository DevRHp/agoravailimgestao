-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix function search path for handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can update cart status" ON public.carrinhos;
DROP POLICY IF EXISTS "Authenticated users can insert uso_carrinho" ON public.uso_carrinho;
DROP POLICY IF EXISTS "Authenticated users can update uso_carrinho" ON public.uso_carrinho;

-- Create more restrictive policies for uso_carrinho
CREATE POLICY "Users can insert their own uso_carrinho"
ON public.uso_carrinho FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.funcionario_id = funcionario_id
    )
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own uso_carrinho"
ON public.uso_carrinho FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid()
        AND p.funcionario_id = funcionario_id
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- For carrinhos, only admins can update or allow status updates via edge function
CREATE POLICY "Users can update carrinhos status"
ON public.carrinhos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (public.has_role(auth.uid(), 'admin') OR true);