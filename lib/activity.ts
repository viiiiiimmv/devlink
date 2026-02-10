import connectDB from '@/lib/mongodb'
import Activity from '@/models/Activity'

type ActivityInput = {
  username: string
  userId?: string
  type: string
  message: string
  metadata?: Record<string, any>
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await connectDB()
    await Activity.create({
      username: input.username,
      userId: input.userId,
      type: input.type,
      message: input.message,
      metadata: input.metadata,
    })
  } catch (error) {
    console.error('Activity log error:', error)
  }
}
