-- Allow users to find inactive licenses by key for activation
CREATE POLICY "Users can find licenses by key" 
ON public.licenses 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);