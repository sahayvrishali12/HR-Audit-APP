"use client"

import { useEffect, useState, type KeyboardEvent } from "react"
import { Bot, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

/** undefined = still checking, then the resolved status */
interface AssistantStatus {
  enabled: boolean
  configured: boolean
}

export function AssistantChat({ auditId }: { auditId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<AssistantStatus | undefined>(undefined)

  useEffect(() => {
    let active = true
    fetch(`/api/assistant/status?auditId=${encodeURIComponent(auditId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setStatus(data ? { enabled: data.enabled, configured: data.configured } : { enabled: true, configured: true })
      })
      .catch(() => {
        if (active) setStatus({ enabled: true, configured: true })
      })
    return () => {
      active = false
    }
  }, [auditId])

  async function handleSend() {
    const question = input.trim()
    if (!question || loading) return
    setError("")
    setInput("")
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }]
    setMessages(nextMessages)
    setLoading(true)
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, messages: nextMessages }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setError("Could not reach the assistant. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  if (status && !status.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            Ask the Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The assistant has been disabled by IT.</p>
        </CardContent>
      </Card>
    )
  }

  if (status && !status.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            Ask the Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The assistant is not yet configured by IT.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          Ask the Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Ask questions about this audit, or general questions about HR governance and compliance.
        </p>
        {messages.length > 0 && (
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "border bg-card",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">Thinking...</div>
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="size-4" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
