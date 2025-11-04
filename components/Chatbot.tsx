import React, { useState, useRef, useEffect } from 'react';
import { getCVContext } from '../data/cvData';
import { generateChatResponse } from '../services/geminiService';
import { ChatBubbleIcon, PaperAirplaneIcon, XIcon } from './icons/Icons';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatboxRef = useRef<HTMLDivElement>(null);

  const cvContext = getCVContext();

  useEffect(() => {
    if (isOpen) {
      chatboxRef.current?.scrollTo(0, chatboxRef.current.scrollHeight);
    }
  }, [messages, isOpen]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ sender: 'bot', text: "Hello! I'm an AI assistant. Ask me anything about Jainish's skills, experience, or projects." }]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (userInput.trim() === '' || isLoading) return;
    
    const newMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const botResponse = await generateChatResponse(cvContext, userInput);
      setMessages([...newMessages, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      setMessages([...newMessages, { sender: 'bot', text: "Sorry, something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-sky-500 text-white rounded-full p-4 shadow-lg hover:bg-sky-600 transition-all duration-300 z-50"
        aria-label="Toggle chatbot"
      >
        {isOpen ? <XIcon className="w-8 h-8" /> : <ChatBubbleIcon className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[32rem] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50">
          <header className="p-4 border-b border-gray-700">
            <h3 className="font-bold text-lg text-white">AI Assistant</h3>
            <p className="text-sm text-gray-400">Powered by Gemini</p>
          </header>
          <div ref={chatboxRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-gray-700 text-gray-200">
                    <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center bg-gray-800 rounded-lg">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none"
              />
              <button onClick={handleSend} className="p-3 text-gray-400 hover:text-sky-400 disabled:text-gray-600" disabled={isLoading}>
                <PaperAirplaneIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
