"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Paperclip,
  Send,
  StopCircle,
  RefreshCw,
  Sparkles,
  Wand2,
  Bot,
  User,
  Plus,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant" | "system";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  pending?: boolean; // for optimistic/streaming UI
};

const quickPrompts = [
  { id: "comp-ideas", label: "Competition ideas", text: "Brainstorm FBLA competition ideas tailored for our chapter." },
  { id: "event-plan", label: "Plan a meeting", text: "Draft a 45-minute meeting agenda for new members." },
  { id: "email", label: "Polish an email", text: "Improve this outreach email to a sponsor for Hack Forsyth." },
  { id: "rules", label: "Rules Q&A", text: "Answer top questions about FBLA membership, dues, and timelines." },
];

const starterMessages: Message[] = [
  {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "Hey! I’m SparkAI. Ask me anything about FBLA, competitions, events, or chapter ops. Try a quick prompt on the left to get started.",
    createdAt: Date.now(),
  },
];

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";
  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted/50 border border-border rounded-bl-sm"
        )}
      >
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {msg.pending && (
          <div className={cn("mt-2 flex items-center gap-1 opacity-70", isUser ? "text-primary-foreground" : "")}>
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0ms]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:100ms]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:200ms]" />
          </div>
        )}
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-foreground/10 text-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function SidePresets({
  onUsePrompt,
  onClear,
  disabled,
}: {
  onUsePrompt: (text: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="hidden lg:flex w-[300px] flex-col p-4 gap-3 border-border/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Quick prompts</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClear} disabled={disabled}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {quickPrompts.map((p) => (
          <Button
            key={p.id}
            variant="secondary"
            className="justify-start text-left"
            onClick={() => onUsePrompt(p.text)}
            disabled={disabled}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {p.label}
          </Button>
        ))}
      </div>

      <Separator className="my-2" />
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Session</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">SparkFBLA</Badge>
          <Badge variant="secondary">RAG enabled</Badge>
          <Badge variant="outline">v1</Badge>
        </div>
      </div>
    </Card>
  );
}

export default function SparkAIPage() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isSending]);

  const addUserMessage = (text: string) => {
    const usr: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      createdAt: Date.now(),
      pending: false,
    };
    setMessages((m) => [...m, usr]);
  };

  const addAssistantPending = () => {
    const asst: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
      pending: true,
    };
    setMessages((m) => [...m, asst]);
    return asst.id;
  };

  const appendToAssistant = (id: string, chunk: string, done = false) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? { ...msg, content: msg.content + chunk, pending: !done }
          : msg
      )
    );
  };

  // Replace with your real API call (streaming or not).
  const fakeStream = async (prompt: string, onToken: (t: string, done?: boolean) => void) => {
    // Simulated tokens for demo.
    const tokens = [
      "Here’s a polished outline to get you rolling.\n\n",
      "1) Kickoff & icebreaker (5 min)\n",
      "2) What is FBLA? (10 min)\n",
      "3) Competition tracks (10 min)\n",
      "4) Team breakout & next steps (15 min)\n",
    ];
    for (let i = 0; i < tokens.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      onToken(tokens[i], i === tokens.length - 1);
    }
  };

  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isSending) return;
      setIsSending(true);

      addUserMessage(content);
      setInput("");

      // show assistant pending bubble and stream into it
      const asstId = addAssistantPending();

      try {
        // ---- replace this with your /api/sparkai streaming ----
        // Example for real streaming:
        // const res = await fetch("/api/sparkai", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ messages: [...messages, { role: "user", content }] }),
        // });
        // const reader = res.body?.getReader();
        // const decoder = new TextDecoder();
        // while (true) {
        //   const { value, done } = await reader!.read();
        //   if (done) break;
        //   appendToAssistant(asstId, decoder.decode(value), false);
        // }
        // appendToAssistant(asstId, "", true);
        await fakeStream(content, (tok, done) => appendToAssistant(asstId, tok, !!done));
      } catch (e) {
        appendToAssistant(asstId, "Sorry—something went wrong. Please try again.", true);
        // Optionally log error
      } finally {
        setIsSending(false);
      }
    },
    [appendToAssistant, input, isSending, messages]
  );

  const clearChat = () => setMessages(starterMessages);

  // Keyboard: Enter to send, Shift+Enter for newline
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const useQuickPrompt = (text: string) => {
    setInput(text);
    // optionally auto-send:
    // send(text);
  };

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  return (
    <SidebarInset>
      {/* Header (unchanged) */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">SparkFBLA</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>SparkAI</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)]">
        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">

          {/* Left: presets / session info */}
          <SidePresets onUsePrompt={useQuickPrompt} onClear={clearChat} disabled={isSending} />

          {/* Right: chat panel */}
          <Card className="flex min-h-0 flex-col border-border/60">
            {/* Chat toolbar */}
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">
                  <Bot className="mr-1 h-3.5 w-3.5" />
                  SparkAI
                </Badge>
                <Separator orientation="vertical" className="mx-1 h-4" />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Ask about competitions, agendas, outreach, or chapter ops
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={clearChat}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    New chat
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Save as preset (soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-4">
                {messages.map((m) => (
                  <ChatBubble key={m.id} msg={m} />
                ))}
              </div>
            </ScrollArea>

            {/* Composer */}
            <div className="border-t p-3">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" disabled>
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach (coming soon)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex-1" />

                  <Badge variant="outline" className="hidden sm:inline-flex">
                    Press <kbd className="mx-1 rounded border px-1 text-[10px]">Enter</kbd> to send
                  </Badge>
                </div>

                <Textarea
                  value={input}
                  onChange={(e: any) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type your message…"
                  className="min-h-[84px] resize-none rounded-xl"
                />

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Shift + Enter for new line
                  </div>
                  <div className="flex items-center gap-2">
                    {isSending ? (
                      <Button variant="outline" onClick={() => { /* implement abort controller */ }} className="gap-2">
                        <StopCircle className="h-4 w-4" />
                        Stop
                      </Button>
                    ) : (
                      <Button onClick={() => send()} disabled={!canSend} className="gap-2">
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
