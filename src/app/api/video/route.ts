import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Sanitize filename — no path traversal
    const sanitizedName = name.replace(/[\/\\\.]/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');

    if (sanitizedName !== name.replace(/[\/\\]/g, '_')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // In sandbox, we don't have actual video files
    // Return a placeholder response
    return NextResponse.json({
      message: 'Video streaming not available in sandbox',
      filename: sanitizedName,
      note: 'In production, this would stream the video file from the output folder',
    });
  } catch (error) {
    console.error('Video stream error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}
