
export interface EditHistoryItem {
    id: string;
    prompt: string;
    imageUrl: string;
    timestamp: number;
    model: "dev" | "max";
}
export interface ImageData {
    filename?: string;
    id: string;
    file?: File;
    type?: string;
    size?: number;
    fileUrl?: string;
    preview: string;
    prompt: string;
    selected: boolean;
    status: "idle" | "processing" | "completed" | "failed";
    outputUrl?: string;
    videos?: string[];
    lastFrame?: File | null;
    lastFrameFile?: File | undefined;
    lastFramePreview?: string | null;
    error?: string;
    referenceImages?: (string | File)[];
    editHistory?: EditHistoryItem[];
    mode: "seedance" | "kontext";
    shotId?: string // Link to Director's Palette shot
    finalFrame?: string // Final frame preview URL
    finalFrameFile?: File // Final frame file for API
    framesSwapped?: boolean // True bidirectional toggle - swap start and end positions
}
