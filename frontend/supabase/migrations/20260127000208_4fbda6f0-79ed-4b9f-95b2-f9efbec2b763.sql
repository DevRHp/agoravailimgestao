-- Drop the permissive policy
DROP POLICY IF EXISTS "Users can update carrinhos status" ON public.carrinhos;

-- Create a proper policy for carrinhos updates
CREATE POLICY "Users can update carrinhos for checkout"
ON public.carrinhos FOR UPDATE
TO authenticated
USING (
    -- User has an active funcionario linked to their profile
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.funcionarios f ON p.funcionario_id = f.id
        WHERE p.user_id = auth.uid()
        AND f.ativo = true
    )
    OR public.has_role(auth.uid(), 'admin')
);