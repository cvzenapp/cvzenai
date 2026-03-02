# Chat Sessions Implementation Guide

## What's Done ✅
- Backend session management APIs
- Frontend API service methods
- Database methods for session CRUD

## UI Changes Needed in RecruiterChatInterface.tsx

### 1. Add State
```typescript
const [sessions, setSessions] = useState<Array<{id: number, sessionName: string, isActive: boolean}>>([]);
const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
const [showSidebar, setShowSidebar] = useState(true);
```

### 2. Load Sessions on Mount
```typescript
useEffect(() => {
  loadSessions();
}, []);

const loadSessions = async () => {
  const data = await recruiterAiChatApi.getSessions();
  setSessions(data.sessions);
  const active = data.sessions.find(s => s.isActive);
  if (active) setCurrentSessionId(active.id);
};
```

### 3. Add Sidebar JSX (before main chat area)
```tsx
{showSidebar && (
  <div className="w-64 border-r bg-slate-50 p-4">
    <Button onClick={handleNewChat} className="w-full mb-4">
      <Plus className="w-4 h-4 mr-2" /> New Chat
    </Button>
    <ScrollArea className="h-[calc(100vh-200px)]">
      {sessions.map(session => (
        <div key={session.id} 
             onClick={() => handleSwitchSession(session.id)}
             className={`p-3 rounded cursor-pointer ${session.isActive ? 'bg-brand-background text-white' : 'hover:bg-slate-200'}`}>
          <div className="flex justify-between items-center">
            <span className="truncate">{session.sessionName}</span>
            <Trash2 onClick={(e) => {e.stopPropagation(); handleDeleteSession(session.id);}} 
                    className="w-4 h-4" />
          </div>
        </div>
      ))}
    </ScrollArea>
  </div>
)}
```

### 4. Add Handlers
```typescript
const handleNewChat = async () => {
  const { session } = await recruiterAiChatApi.createSession();
  setMessages([]);
  setCurrentSessionId(session.id);
  await loadSessions();
};

const handleSwitchSession = async (sessionId: number) => {
  await recruiterAiChatApi.switchSession(sessionId);
  setCurrentSessionId(sessionId);
  setMessages([]);
  await loadChatHistory();
  await loadSessions();
};

const handleDeleteSession = async (sessionId: number) => {
  await recruiterAiChatApi.deleteSession(sessionId);
  await loadSessions();
  if (sessionId === currentSessionId) {
    await handleNewChat();
  }
};
```

### 5. Update Main Container
```tsx
<div className="flex h-full">
  {/* Sidebar here */}
  <div className="flex-1">
    {/* Existing chat interface */}
  </div>
</div>
```

## Auto-Title Generation
When first message is sent, update session name:
```typescript
// After sending first message in a new session
if (messages.length === 0) {
  const title = message.substring(0, 50);
  await aiMemoryService.updateSessionName(currentSessionId, title);
}
```

## Files Modified
- ✅ server/services/aiMemoryService.ts
- ✅ server/routes/recruiterAiChat.ts  
- ✅ client/services/recruiterAiChatApi.ts
- ⏳ client/components/dashboard/RecruiterChatInterface.tsx (manual update needed)
