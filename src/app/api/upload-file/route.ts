import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Get optional metadata from form data
    const metadataString = formData.get('metadata') as string | null;
    let metadata: Record<string, string> | undefined;
    
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
      } catch (_e) {
        return NextResponse.json(
          { error: 'Invalid metadata JSON format' },
          { status: 400 }
        );
      }
    }

    // Upload file to Replicate
    const response = await replicate.files.create(file, metadata);

    // Return the urls.get property as requested
    return NextResponse.json({
      url: response.urls.get,
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file to Replicate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
