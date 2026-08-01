import { useState } from 'react'
import moment from 'moment'
import { LuSend } from 'react-icons/lu'
import { toast } from 'react-toastify'
import api from '../utils/axios.js'

export default function CommentSection({ incidentId, comments, onCommentsChange }) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    setSubmitting(true)
    try {
      const { data } = await api.post(`/incidents/${incidentId}/comment`, { comment: text.trim() })
      onCommentsChange(data)
      setText('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h3 className="font-serif text-lg text-brand-brown">Comments</h3>

      <div className="mt-4 space-y-4">
        {comments.length === 0 && <p className="text-sm text-brand-brown/50">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c._id} className="rounded-btn bg-brand-cream/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-brand-brown">{c.user?.fullName || c.email}</span>
              <span className="text-xs text-brand-brown/40">{moment(c.createdAt).fromNow()}</span>
            </div>
            <p className="mt-1 text-sm text-brand-brown/70">{c.comment}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="input-field"
        />
        <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-1.5 disabled:opacity-50">
          <LuSend className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  )
}
