import React, { useRef, useEffect } from 'react';
import { 
  Send, Sparkles, LayoutDashboard 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Citations } from '../components/ui/Citations';
import { useStore } from '../store';
import { useChat } from '../hooks/useChat';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AIAnalysisPage = () => {
  const { 
    messages, isChatLoading,
    setActiveVisualization 
  } = useStore();
  
  // Use the useChat hook for backend API integration
  // Requirements: 5.1, 5.2, 5.3, 5.4
  // Note: The hook handles error display by adding error messages to the chat
  const { sendMessage } = useChat();
  
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedQuery = useRef(false);

  // Handle pre-filled query from URL parameter (e.g., from Dashboard alert)
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !hasProcessedQuery.current && !isChatLoading) {
      hasProcessedQuery.current = true;
      // Clear the query param from URL
      setSearchParams({});
      // Send the message
      sendMessage(query);
    }
  }, [searchParams, setSearchParams, sendMessage, isChatLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle sending a chat message using the backend chat API.
   * 
   * Requirements:
   * - 5.1: POST to /api/chat with query, location_id, and use_semantic parameters
   * - 5.2: Replace Gemini service with backend chat API
   * - 5.3: Display loading indicator while waiting
   * - 5.4: Display error message on failure
   * - 5.5: Maintain conversation context in the UI
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    
    // The useChat hook handles:
    // - Adding user message to store
    // - Calling the backend API
    // - Adding assistant response to store
    // - Loading and error states
    await sendMessage(userMsg);
  };

  const handleVisualizationClick = (viz: string) => {
    setActiveVisualization(viz as any);
    navigate('/');
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col max-w-5xl mx-auto w-full animate-fade-in">
      
      {/* Centered Chat Interface */}
      <Card className="flex-1 flex flex-col overflow-hidden border-accent-primary/20 shadow-2xl shadow-black/40" variant="glass" padding="none">
        {/* Chat Header */}
        <div className="p-6 border-b border-white/10 bg-bg-elevated/50 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-4">
             <div className="relative">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent-primary to-blue-600 flex items-center justify-center shadow-lg shadow-accent-primary/20">
                 <Sparkles size={24} className="text-white" />
               </div>
               <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-bg-elevated rounded-full"></span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-text-primary">AutoInsights Assistant</h3>
               <p className="text-xs text-accent-primary font-medium tracking-wide">AI-POWERED ANALYTICS • ONLINE</p>
             </div>
          </div>
          <button 
            onClick={() => useStore.getState().clearChat()}
            className="text-xs font-medium text-text-tertiary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Clear Conversation
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-base/30 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={clsx("flex gap-4 max-w-3xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto flex-row")}>
              
              {/* Avatar */}
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-md",
                msg.role === 'user' ? "bg-text-secondary text-bg-base" : "bg-bg-surface border border-white/10 text-accent-primary"
              )}>
                {msg.role === 'user' ? 'ME' : 'AI'}
              </div>
              
              {/* Bubble */}
              <div className={clsx(
                "rounded-2xl px-6 py-4 text-sm leading-7 shadow-sm",
                msg.role === 'user' 
                  ? "bg-accent-primary text-white rounded-tr-sm" 
                  : "bg-bg-elevated text-text-secondary border border-white/5 rounded-tl-sm"
              )}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {/* Citations for assistant messages */}
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <Citations citations={msg.citations} />
                )}
                
                {/* Visualization Suggestion Link */}
                {msg.suggestedVisualization && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button 
                      onClick={() => handleVisualizationClick(msg.suggestedVisualization!)}
                      className="group flex items-center gap-3 px-4 py-3 bg-bg-base/50 hover:bg-bg-base rounded-xl border border-white/5 hover:border-accent-primary/50 transition-all w-full text-left"
                    >
                      <div className="p-2 bg-accent-primary/10 rounded-lg text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                        <LayoutDashboard size={18} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs text-text-tertiary uppercase font-bold tracking-wider">Suggested View</span>
                        <span className="block text-text-primary font-medium group-hover:text-accent-primary transition-colors">
                          Open Dashboard Visualization
                        </span>
                      </div>
                      <LayoutDashboard size={14} className="text-text-tertiary group-hover:text-accent-primary" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex gap-4 max-w-3xl mr-auto">
               <div className="w-8 h-8 rounded-full bg-bg-surface border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-accent-primary shadow-md">AI</div>
               <div className="bg-bg-elevated border border-white/5 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-75" />
                  <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce delay-150" />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-bg-elevated/80 border-t border-white/10 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about wait times, staff performance, or customer sentiment..."
              className="w-full bg-bg-surface border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-base text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:ring-1 focus:ring-accent-primary outline-none transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isChatLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-accent-primary text-white rounded-xl disabled:opacity-50 disabled:bg-gray-700 hover:bg-accent-primary-hover transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent-primary/20"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="text-center mt-3">
             <p className="text-[10px] text-text-tertiary">
               AutoInsights can make mistakes. Consider checking the Dashboard for verified metrics.
             </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAnalysisPage;