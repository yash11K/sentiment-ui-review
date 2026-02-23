import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, Sparkles, LayoutDashboard, Trash2 
} from 'lucide-react';
import { Citations } from '../components/ui/Citations';
import { useStore } from '../store';
import { useChat } from '../hooks/useChat';
import { clsx } from 'clsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const LOADING_PHRASES = [
  // The "Deep Thinker"
  'Synthesizing sentiment...',
  'Contextualizing your query...',
  'Aggregating customer feedback...',
  'Parsing review linguistics...',
  'Cross-referencing opinions...',
  'Weighting user ratings...',
  'Decoding the consensus...',
  'Mining for insights...',
  // The "Data Scout"
  'Sifting through the archives...',
  'Scanning 1,000+ opinions...',
  'Rummaging through the digital shelves...',
  'Uncovering hidden gems...',
  'Digging through the feedback pile...',
  'Scouting the latest reviews...',
  'Filtering out the noise...',
  // The "Witty & Human"
  'Reading between the lines...',
  'Getting the "tea" on this topic...',
  'Polishing the response...',
  'Asking the data for a favor...',
  'Consulting the masses...',
  'Channeling the inner critic...',
  'Brewing some fresh insights...',
  // The "System Pro"
  'Optimizing output...',
  'Mapping the intent...',
  'Running a sentiment sweep...',
];

const getRandomPhrase = (): string =>
  LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];

const LoadingIndicator: React.FC = () => {
  const [phrase, setPhrase] = useState(getRandomPhrase);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(getRandomPhrase());
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 max-w-3xl mr-auto">
      <div className="w-8 h-8 rounded-none bg-gradient-to-tr from-accent-primary to-purple-600 flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-md">
        <Sparkles size={14} />
      </div>
      <div className="flex flex-col gap-2 pt-1">
        <p className="text-sm text-accent-primary font-medium animate-pulse">
          {phrase}
        </p>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-accent-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
};

/** Markdown components styled for the chat context */
const markdownComponents: Record<string, React.FC<any>> = {
  h1: ({ children }) => <h1 className="text-xl font-bold text-text-primary mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-text-primary mt-3 mb-1.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-text-primary mt-2 mb-1">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-7 text-text-secondary mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-text-secondary">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-text-secondary">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  code: ({ inline, children }: { inline?: boolean; children: React.ReactNode }) =>
    inline
      ? <code className="px-1.5 py-0.5 bg-bg-surface text-accent-primary text-xs font-mono rounded-sm">{children}</code>
      : <code className="block bg-bg-surface p-3 text-xs font-mono text-text-secondary overflow-x-auto mb-2 border border-accent-primary/10">{children}</code>,
  pre: ({ children }) => <pre className="bg-bg-surface p-3 text-xs font-mono overflow-x-auto mb-2 border border-accent-primary/10">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-accent-primary/40 pl-4 italic text-text-tertiary mb-2">{children}</blockquote>,
  table: ({ children }) => <div className="overflow-x-auto mb-2"><table className="w-full text-sm border-collapse">{children}</table></div>,
  thead: ({ children }) => <thead className="bg-bg-surface">{children}</thead>,
  th: ({ children }) => <th className="text-left px-3 py-2 text-text-primary font-semibold border border-accent-primary/10 text-xs">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-text-secondary border border-accent-primary/10 text-xs">{children}</td>,
  hr: () => <hr className="border-accent-primary/10 my-3" />,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-primary underline hover:text-accent-primary-hover">{children}</a>,
};

const AIAnalysisPage = () => {
  const { 
    messages, isChatLoading,
    setActiveVisualization 
  } = useStore();
  
  const { sendMessage } = useChat();
  
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasProcessedQuery = useRef(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !hasProcessedQuery.current && !isChatLoading) {
      hasProcessedQuery.current = true;
      setSearchParams({});
      sendMessage(query);
    }
  }, [searchParams, setSearchParams, sendMessage, isChatLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;
    const userMsg = inputValue;
    setInputValue('');
    await sendMessage(userMsg);
  };

  const handleVisualizationClick = (viz: string) => {
    setActiveVisualization(viz as any);
    navigate('/');
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col w-full animate-fade-in">
      <div className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        {/* Chat Header */}
        <div className="px-8 py-4 bg-bg-elevated/50 flex justify-between items-center backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-none bg-gradient-to-tr from-accent-primary to-purple-600 flex items-center justify-center shadow-lg shadow-accent-primary/20">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-bg-elevated rounded-full"></span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">AutoInsights Assistant</h3>
              <p className="text-[10px] text-accent-primary font-medium tracking-wide">AI-POWERED ANALYTICS • ONLINE</p>
            </div>
          </div>
          <button 
            onClick={() => useStore.getState().clearChat()}
            className="flex items-center gap-2 text-xs font-medium text-text-tertiary hover:text-red-400 px-3 py-1.5 rounded-none hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
              <div className="w-16 h-16 rounded-none bg-gradient-to-tr from-accent-primary/20 to-purple-600/20 flex items-center justify-center">
                <Sparkles size={28} className="text-accent-primary" />
              </div>
              <div>
                <p className="text-text-secondary text-sm font-medium">Ask me anything about your reviews</p>
                <p className="text-text-tertiary text-xs mt-1">Wait times, staff performance, customer sentiment, and more</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={clsx(
              'flex items-start gap-3 max-w-3xl',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}>
              {/* Avatar */}
              <div className={clsx(
                'w-8 h-8 rounded-none flex items-center justify-center shrink-0 text-xs font-bold shadow-md',
                msg.role === 'user'
                  ? 'bg-accent-primary text-white'
                  : 'bg-gradient-to-tr from-accent-primary to-purple-600 text-white'
              )}>
                {msg.role === 'user' ? 'ME' : <Sparkles size={14} />}
              </div>
              
              {/* Content */}
              <div className={clsx(
                'rounded-none px-5 py-4 text-sm shadow-sm',
                msg.role === 'user' 
                  ? 'bg-accent-primary text-white' 
                  : 'bg-bg-elevated text-text-secondary'
              )}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-7">{msg.content}</p>
                ) : (
                  <div className="prose-chat">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                
                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <Citations citations={msg.citations} />
                )}
                
                {msg.suggestedVisualization && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <button 
                      onClick={() => handleVisualizationClick(msg.suggestedVisualization!)}
                      className="group flex items-center gap-3 px-4 py-2.5 bg-bg-base/50 hover:bg-bg-base rounded-none border border-accent-primary/20 hover:border-accent-primary transition-all w-full text-left"
                    >
                      <div className="p-1.5 bg-accent-primary/10 rounded-none text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                        <LayoutDashboard size={16} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Suggested View</span>
                        <span className="block text-text-primary text-xs font-medium group-hover:text-accent-primary transition-colors">
                          Open Dashboard Visualization
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isChatLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-8 py-4 bg-bg-elevated/60 backdrop-blur-md border-t border-white/5">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about wait times, staff performance, or customer sentiment..."
              className="w-full bg-bg-surface border border-accent-primary/10 rounded-none pl-5 pr-14 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isChatLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent-primary text-white rounded-none disabled:opacity-40 disabled:bg-gray-500 hover:bg-accent-primary-hover transition-all active:scale-95 shadow-lg shadow-accent-primary/20"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-center mt-2 text-[10px] text-text-tertiary">
            AutoInsights can make mistakes. Consider checking the Dashboard for verified metrics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPage;
