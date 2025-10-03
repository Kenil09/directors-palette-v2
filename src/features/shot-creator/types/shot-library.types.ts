export interface LibraryImageReference {
    id: string;
    imageData: string; // base64 encoded image
    preview?: string;
    tags: string[];
    category: 'people' | 'places' | 'props' | 'unorganized';
    prompt?: string;
    createdAt: Date;
    source: 'generated' | 'uploaded';
    settings?: {
        model: "dev" | "max";
        prompt: string;
        negative_prompt: string;
        steps: number;
        cfg_scale: number;
        width: number;
        height: number;
        seed: number;
    };
    referenceTag?: string; // The @ tag used for Gen4 reference
}