-- Add adder column to categories table for bid increment values
ALTER TABLE public.categories
ADD COLUMN adder bigint DEFAULT 1000;