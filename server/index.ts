import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { meetingStore } from './db/store.ts';

const app = express();
const PORT = process.env.PORT || 5000;

// Setup upload directory
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp3|mp4|wav|m4a|webm|ogg|aac|flac)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported format. Please upload MP3, MP4, WAV, M4A, WEBM, or AAC.'));
    }
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'AI Meeting Intelligence' });
});

// Overview Analytics
app.get('/api/stats', (_req: Request, res: Response) => {
  const stats = meetingStore.getStats();
  res.json(stats);
});

// 1. POST /api/meetings/upload - PRD Section 9
app.post('/api/meetings/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let fileName = 'Sample_Meeting_Discussion.mp3';
    let fileSizeBytes = 6200000;
    let recordingUrl = '/uploads/sample_meeting.mp3';
    let title = req.body.title || undefined;
    let hostName = req.body.host_name || 'Alex Johnson';

    if (req.file) {
      fileName = req.file.originalname;
      fileSizeBytes = req.file.size;
      recordingUrl = `/uploads/${req.file.filename}`;
      if (!title) {
        title = req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }
    }

    const meeting = await meetingStore.createMeeting(
      fileName,
      fileSizeBytes,
      recordingUrl,
      title,
      hostName
    );

    res.status(201).json({
      success: true,
      message: 'Meeting recording uploaded successfully. Processing pipeline started.',
      meeting_id: meeting.id,
      meeting,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error?.message || 'File upload failed' });
  }
});

// 2. GET /api/meetings - PRD Section 9
app.get('/api/meetings', (req: Request, res: Response) => {
  const { status, search } = req.query;
  let meetings = meetingStore.getAllMeetings();

  if (status && typeof status === 'string' && status !== 'all') {
    meetings = meetings.filter(m => m.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    meetings = meetings.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.host_name.toLowerCase().includes(q) ||
      (m.summary?.topics && m.summary.topics.some(t => t.toLowerCase().includes(q)))
    );
  }

  res.json({
    total: meetings.length,
    meetings,
  });
});

// 3. GET /api/meetings/:id - PRD Section 9
app.get('/api/meetings/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meeting = meetingStore.getMeetingById(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }
  res.json(meeting);
});

// 4. GET /api/meetings/:id/transcript - PRD Section 9
app.get('/api/meetings/:id/transcript', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meeting = meetingStore.getMeetingById(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const segments = meetingStore.getTranscriptSegments(id);
  const speakers = meetingStore.getSpeakers(id);

  res.json({
    meeting_id: id,
    speakers,
    total_segments: segments.length,
    segments,
  });
});

// 5. GET /api/meetings/:id/summary - PRD Section 9
app.get('/api/meetings/:id/summary', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meeting = meetingStore.getMeetingById(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const summary = meetingStore.getSummary(id);
  if (!summary) {
    res.status(202).json({
      meeting_id: id,
      status: meeting.status,
      message: 'Summary is currently being processed by LLM pipeline',
    });
    return;
  }

  res.json(summary);
});

// 6. GET /api/meetings/:id/actions - PRD Section 9
app.get('/api/meetings/:id/actions', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meeting = meetingStore.getMeetingById(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const actionItems = meetingStore.getActionItems(id);
  res.json({
    meeting_id: id,
    total: actionItems.length,
    action_items: actionItems,
  });
});

// 7. PATCH /api/actions/:id - PRD Section 9
app.patch('/api/actions/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  if (!status || !['open', 'in-progress', 'done'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be open, in-progress, or done' });
    return;
  }

  const updated = meetingStore.updateActionItemStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: 'Action item not found' });
    return;
  }

  res.json({
    success: true,
    action_item: updated,
  });
});

// 8. POST /api/search - PRD Section 9
app.post('/api/search', (req: Request, res: Response) => {
  const { query, limit } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  const topK = typeof limit === 'number' ? limit : 8;
  const results = meetingStore.searchMeetings(query, topK);

  res.json({
    query,
    total_matches: results.length,
    results,
  });
});

// 9. DELETE /api/meetings/:id - Cascading cleanup (PRD Section 6 Data Hygiene)
app.delete('/api/meetings/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const deleted = meetingStore.deleteMeeting(id);
  if (!deleted) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Meeting and all derived transcript, summary, action items, and embeddings deleted permanently.',
  });
});

// 10. POST /api/meetings/:id/retry - PRD Section 6 Reliability
app.post('/api/meetings/:id/retry', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const meeting = await meetingStore.retryMeeting(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Meeting re-processing initiated',
    meeting,
  });
});

app.listen(PORT, () => {
  console.log(`[AI Meeting Server] Running on http://localhost:${PORT}`);
});

