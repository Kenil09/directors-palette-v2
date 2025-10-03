import { supabase } from "../supabase/client";
import { GalleryRepository } from './gallery.repository';
import { ReferenceRepository } from './reference.repository';

export const galleryRepository = new GalleryRepository(supabase);
export const referenceRepository = new ReferenceRepository(supabase);

export { GalleryRepository, ReferenceRepository };

export * from './gallery.repository';
export * from './reference.repository';