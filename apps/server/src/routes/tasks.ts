import { Router } from 'express'
import { db } from '../lib/db.js'

const router = Router()

type TaskBody = {
  title?: string
  description?: string
  dueDate?: string | null
  completed?: boolean
  createdAt?: string
  updatedAt?: string
  bucketId?: string | null
}

function mapTask(doc: { _id: string; [key: string]: unknown }) {
  return {
    id: doc._id,
    title: typeof doc.title === 'string' ? doc.title : '',
    description: typeof doc.description === 'string' ? doc.description : '',
    dueDate: typeof doc.dueDate === 'string' ? doc.dueDate : null,
    completed: Boolean(doc.completed),
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : new Date().toISOString(),
    bucketId: typeof doc.bucketId === 'string' ? doc.bucketId : null,
  }
}

function normalizeTaskInput(body: TaskBody) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const dueDate = typeof body.dueDate === 'string' && body.dueDate.trim() ? body.dueDate.trim() : null
  const completed = typeof body.completed === 'boolean' ? body.completed : false
  const bucketId = typeof body.bucketId === 'string' && body.bucketId.trim() ? body.bucketId.trim() : null

  return {
    title,
    description,
    dueDate,
    completed,
    bucketId,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const bucketId = typeof req.query.bucketId === 'string' && req.query.bucketId.trim() ? req.query.bucketId.trim() : null
    const docs = await db.collection('tasks').find(bucketId ? { bucketId } : {})
    const tasks = docs.map((doc) => mapTask(doc))
    res.json(tasks)
    return
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const task = await db.collection('tasks').findById(String(req.params.id))
    if (!task) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json(mapTask(task))
    return
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const body = req.body as TaskBody
    const input = normalizeTaskInput(body)

    if (!input.title) {
      res.status(400).json({ error: 'Task title is required.' })
      return
    }

    const now = new Date().toISOString()
    const id = await db.collection('tasks').insertOne({
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      completed: input.completed,
      createdAt: now,
      updatedAt: now,
      bucketId: input.bucketId,
    })
    const task = await db.collection('tasks').findById(id)

    if (!task) {
      res.status(500).json({ error: 'Failed to create task' })
      return
    }

    res.status(201).json(mapTask(task))
    return
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body as TaskBody
    const existing = await db.collection('tasks').findById(String(req.params.id))
    if (!existing) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const input = normalizeTaskInput(body)
    if (!input.title) {
      res.status(400).json({ error: 'Task title is required.' })
      return
    }

    const ok = await db.collection('tasks').updateOne(String(req.params.id), {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      completed: typeof body.completed === 'boolean' ? body.completed : Boolean(existing.completed),
      updatedAt: new Date().toISOString(),
      bucketId: input.bucketId,
    })

    if (!ok) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    const task = await db.collection('tasks').findById(String(req.params.id))
    if (!task) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json(mapTask(task))
    return
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await db.collection('tasks').deleteOne(String(req.params.id))
    if (!ok) {
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json({ success: true })
    return
  } catch (err) {
    next(err)
  }
})

router.post('/bulk-delete', async (req, res, next) => {
  try {
    const body = req.body as { ids?: unknown }
    const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter(Boolean) : []

    if (ids.length === 0) {
      res.json({ success: true, deletedCount: 0 })
      return
    }

    let deletedCount = 0
    for (const id of ids) {
      const ok = await db.collection('tasks').deleteOne(id)
      if (ok) {
        deletedCount += 1
      }
    }

    res.json({ success: true, deletedCount })
    return
  } catch (err) {
    next(err)
  }
})

export default router