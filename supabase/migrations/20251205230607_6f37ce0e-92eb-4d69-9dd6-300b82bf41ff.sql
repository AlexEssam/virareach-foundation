-- Add UPDATE RLS policy to telegram_extractions table
CREATE POLICY "Users can update their own telegram extractions"
ON telegram_extractions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE RLS policy to telegram_extractions table
CREATE POLICY "Users can delete their own telegram extractions"
ON telegram_extractions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);