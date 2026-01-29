-- Allow users to view their own role (needed for AuthContext to work for all users)
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());