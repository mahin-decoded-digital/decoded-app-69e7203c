import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

type TaskRecord = {
  id: string
  title: string
  description: string
  dueDate: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

type SyncDoc = {
  _id: string
  bucketId?: string
  updatedAt?: string
}

function buildSyncCode(bucketId: string): string {
  return bucketId.slice(0, 4).toUpperCase()
}

function randomBucketId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.replace(/[^a-z0-9]/gi, '').slice(0, 16)
}

function isValidBucketId(input: string): boolean {
  return /^[a-z0-9]{10,24}$/i.test(input.trim())
}

function baseUrl(req: Parameters<typeof router.get>[1] extends never ? never : never): string {
  return ''
}

function getOrigin(req: { protocol: string; get: (name: string) => string | undefined }): string {
  const host = req.get('host')
  if (!host) return ''
  return `${req.protocol}://${host}`
}

function buildSyncUrl(req: { protocol: string; get: (name: string) => string | undefined }, bucketId: string): string {
  const origin = getOrigin(req)
  return origin ? `${origin}/sync?sync=${bucketId}` : `/sync?sync=${bucketId}`
}

router.post('/create', async (req, res, next) => {
  try {
    const body = req.body as { bucketId?: unknown }
    const requestedBucketId = typeof body.bucketId === 'string' ? body.bucketId.trim() : ''
    const bucketId = requestedBucketId && isValidBucketId(requestedBucketId) ? requestedBucketId : randomBucketId()
    const now = new Date().toISOString()

    const existing = await db.collection('syncBuckets').find({ bucketId })
    if (existing.length === 0) {
      await db.collection('syncBuckets').insertOne({ bucketId, updatedAt: now })
    } else {
      const first = existing[0]
      if (!first) {
        res.status(500).json({ error: 'Failed to create sync bucket' })
        return
      }
      await db.collection('syncBuckets').updateOne(String(first._id), { bucketId, updatedAt: now })
    }

    res.status(201).json({
      bucketId,
      syncCode: buildSyncCode(bucketId),
      syncUrl: buildSyncUrl(req, bucketId),
      lastSyncedAt: now,
    })
    return
  } catch (err) {
    next(err)
  }
})

router.get('/:bucketId', async (req, res, next) => {
  try {
    const bucketId = String(req.params.bucketId)
    if (!isValidBucketId(bucketId)) {
      res.status(400).json({ error: 'Invalid bucket id' })
      return
    }

    const bucketDocs = await db.collection('syncBuckets').find({ bucketId })
    const bucket = (bucketDocs[0] ?? null) as SyncDoc | null
    const taskDocs = await db.collection('tasks').find({ bucketId })
    const tasks: TaskRecord[] = taskDocs.map((doc) => ({
      id: String(doc._id),
      title: typeof doc.title === 'string' ? doc.title : '',
      description: typeof doc.description === 'string' ? doc.description : '',
      dueDate: typeof doc.dueDate === 'string' ? doc.dueDate : null,
      completed: Boolean(doc.completed),
      createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
    }))

    if (!bucket && taskDocs.length === 0) {
      res.status(404).json({ error: 'No shared task list was found for that sync link.' })
      return
    }

    res.json({
      version: 1,
      bucketId,
      updatedAt: typeof bucket?.updatedAt === 'string' ? bucket.updatedAt : null,
      tasks,
      sync: {
        bucketId,
        syncCode: buildSyncCode(bucketId),
        syncUrl: buildSyncUrl(req, bucketId),
        lastSyncedAt: typeof bucket?.updatedAt === 'string' ? bucket.updatedAt : null,
      },
    })
    return
  } catch (err) {
    next(err)
  }
})

router.post('/:bucketId/push', async (req, res, next) => {
  try {
    const bucketId = String(req.params.bucketId)
    if (!isValidBucketId(bucketId)) {
      res.status(400).json({ error: 'Invalid bucket id' })
      return
    }

    const body = req.body as { tasks?: unknown }
    const tasks = Array.isArray(body.tasks) ? body.tasks as Array<Record<string, unknown>> : []
    const existingTasks = await db.collection('tasks').find({ bucketId })

    for (const existing of existingTasks) {
      await db.collection('tasks').deleteOne(String(existing._id))
    }

    const now = new Date().toISOString()

    for (const rawTask of tasks) {
      const title = typeof rawTask.title === 'string' ? rawTask.title.trim() : ''
      if (!title) {
        continue
      }

      await db.collection('tasks').insertOne({
        title,
        description: typeof rawTask.description === 'string' ? rawTask.description : '',
        dueDate: typeof rawTask.dueDate === 'string' && rawTask.dueDate.trim() ? rawTask.dueDate : null,
        completed: typeof rawTask.completed === 'boolean' ? rawTask.completed : false,
        createdAt: typeof rawTask.createdAt === 'string' ? rawTask.createdAt : now,
        updatedAt: typeof rawTask.updatedAt === 'string' ? rawTask.updatedAt : now,
        bucketId,
      })
    }

    const bucketDocs = await db.collection('syncBuckets').find({ bucketId })
    const bucket = bucketDocs[0] as SyncDoc | undefined
    if (bucket) {
      await db.collection('syncBuckets').updateOne(String(bucket._id), { bucketId, updatedAt: now })
    } else {
      await db.collection('syncBuckets').insertOne({ bucketId, updatedAt: now })
    }

    res.json({
      bucketId,
      syncCode: buildSyncCode(bucketId),
      syncUrl: buildSyncUrl(req, bucketId),
      lastSyncedAt: now,
    })
    return
  } catch (err) {
    next(err)
  }
})

export default router