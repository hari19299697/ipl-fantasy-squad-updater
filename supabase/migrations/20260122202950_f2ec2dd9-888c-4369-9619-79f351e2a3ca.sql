-- Change adder column from integer to numeric to support decimal values
ALTER TABLE public.categories 
ALTER COLUMN adder TYPE numeric USING adder::numeric;