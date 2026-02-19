import type { IConnection } from '@/models/Connection'

export type ViewerConnectionState =
  | 'self'
  | 'none'
  | 'pending_incoming'
  | 'pending_outgoing'
  | 'connected'

export const buildPairKey = (firstUserId: string, secondUserId: string): string => {
  return [firstUserId, secondUserId].sort().join(':')
}

export const clampLimit = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

export const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getViewerConnectionState = (
  connection: Pick<IConnection, 'status' | 'requesterUserId' | 'recipientUserId'> | null,
  viewerUserId: string
): ViewerConnectionState => {
  if (!connection) return 'none'

  if (connection.status === 'accepted') {
    return 'connected'
  }

  if (connection.status === 'pending') {
    if (connection.requesterUserId === viewerUserId) {
      return 'pending_outgoing'
    }

    if (connection.recipientUserId === viewerUserId) {
      return 'pending_incoming'
    }
  }

  return 'none'
}
