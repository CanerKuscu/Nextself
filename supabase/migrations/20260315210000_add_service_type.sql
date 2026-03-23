-- Add service_type enum
CREATE TYPE service_type_enum AS ENUM ('online', 'face_to_face', 'hybrid');

-- Add service_type column to client_relationships
ALTER TABLE client_relationships 
ADD COLUMN service_type service_type_enum DEFAULT 'face_to_face';

-- Update existing records to be face_to_face (implied by default, but good to be explicit)
UPDATE client_relationships SET service_type = 'face_to_face' WHERE service_type IS NULL;
