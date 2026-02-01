-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view carrinhos" ON public.carrinhos;
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can view uso_carrinho" ON public.uso_carrinho;
DROP POLICY IF EXISTS "Users can insert their own uso_carrinho" ON public.uso_carrinho;
DROP POLICY IF EXISTS "Users can update their own uso_carrinho" ON public.uso_carrinho;
DROP POLICY IF EXISTS "Users can update carrinhos for checkout" ON public.carrinhos;

-- Allow PUBLIC (anonymous) access to view carrinhos
CREATE POLICY "Public can view carrinhos"
ON public.carrinhos
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow PUBLIC (anonymous) access to view funcionarios for NIF validation
CREATE POLICY "Public can view funcionarios"
ON public.funcionarios
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow PUBLIC (anonymous) access to view uso_carrinho
CREATE POLICY "Public can view uso_carrinho"
ON public.uso_carrinho
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow PUBLIC to insert uso_carrinho (checkout)
CREATE POLICY "Public can insert uso_carrinho"
ON public.uso_carrinho
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow PUBLIC to update uso_carrinho (return cart)
CREATE POLICY "Public can update uso_carrinho"
ON public.uso_carrinho
FOR UPDATE
TO anon, authenticated
USING (true);

-- Allow PUBLIC to update carrinhos status (for checkout/return)
CREATE POLICY "Public can update carrinhos status"
ON public.carrinhos
FOR UPDATE
TO anon, authenticated
USING (true);