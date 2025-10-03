// Quick preset prompts for different styles
export const quickPresets = [
    { name: 'Cinematic', prompt: 'cinematic shot, dramatic lighting, professional photography' },
    { name: 'Portrait', prompt: 'professional portrait, soft lighting, shallow depth of field' },
    { name: 'Landscape', prompt: 'stunning landscape, golden hour lighting, wide angle view' },
    { name: 'Abstract', prompt: 'abstract composition, vibrant colors, artistic interpretation' },
    { name: 'Street', prompt: 'street photography, candid moment, urban environment' },
    { name: 'Macro', prompt: 'macro photography, extreme close-up, fine details' }
]

// Model-specific aspect ratios
export const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Photo (3:2)' },
    { value: '21:9', label: 'Ultra-wide (21:9)' }
]

// Resolution options
export const resolutions = [
    { value: 'SD', label: 'SD (512x512)' },
    { value: 'HD', label: 'HD (1024x1024)' },
    { value: 'FHD', label: 'Full HD (1920x1080)' },
    { value: 'custom', label: 'Custom' }
]