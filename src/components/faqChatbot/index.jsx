import React from 'react';
import { MessageCircle, X, Send, Globe } from 'lucide-react';
import { useChatbot } from './useChatbot';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const FaqChatbot = () => {
    const { settings } = useSiteSettings();
    const globalPhone = (settings?.useSamePhone !== false ? settings?.phone : settings?.whatsapp)?.replace(/\s|\+|-/g, '') || "51988496839";

    const {
        isOpen,
        toggleChat,
        language,
        toggleLanguage,
        messages,
        inputText,
        setInputText,
        handleSearch,
        handleQuickQuestion,
        quickQuestions,
        currentData,
        messagesEndRef
    } = useChatbot();

    return (
        <div className="z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col animate-fade-in-up transition-all duration-300 ease-out max-h-[80vh] sm:max-h-[600px]">
                    {/* Header */}
                    <div className="bg-red-600 dark:bg-[#f05252] p-4 flex justify-between items-center text-white shadow-lg">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <span className="font-semibold tracking-wide">
                                {language === 'es' ? 'Asistente' : 'Support Bot'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleChat}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white/70 dark:bg-white/5 flex flex-col gap-3 min-h-0">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.type === 'user'
                                    ? 'self-end bg-red-600/90 dark:bg-[#f05252]/90 text-white rounded-br-none'
                                    : 'self-start bg-white dark:bg-[#121316] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-200 rounded-bl-none'
                                    }`}
                            >
                                {msg.text}
                                {msg.showContact && (
                                    <button
                                        onClick={() => window.open(`https://wa.me/${globalPhone}`, '_blank')}
                                        className="mt-3 w-full bg-red-600/10 dark:bg-[#f05252]/10 text-red-600 dark:text-[#f05252] font-medium py-2 rounded-lg hover:bg-red-600/20 dark:hover:bg-[#f05252]/20 transition-colors text-xs flex items-center justify-center gap-2 border border-red-600/20 dark:border-[#f05252]/20"
                                    >
                                        {language === 'es' ? 'Contáctanos' : 'Contact Us'}
                                        <Send size={12} className="-rotate-45 relative top-[1px]" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Quick Questions Chips */}
                        {messages.length > 0 && messages[messages.length - 1].type === 'bot' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {quickQuestions.map(q => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="text-xs bg-white dark:bg-[#121316] text-red-600 dark:text-[#f05252] border border-red-600/30 dark:border-[#f05252]/30 px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white dark:hover:bg-[#f05252] dark:hover:text-white transition-all text-left shadow-sm"
                                    >
                                        {q.question}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSearch} className="p-3 bg-white dark:bg-[#121316] border-t border-gray-200 dark:border-gray-800 flex gap-2 items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={currentData.placeholder}
                            className="flex-1 bg-gray-500/10 dark:bg-gray-400/10 text-gray-900 dark:text-gray-200 text-sm px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600/50 dark:focus:ring-[#f05252]/50 focus:bg-white dark:focus:bg-[#121316] transition-all border border-transparent focus:border-red-600/20 dark:focus:border-[#f05252]/20 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="bg-red-600 dark:bg-[#f05252] text-white p-2 rounded-full hover:bg-red-700 dark:hover:bg-[#fb6a6a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
                        >
                            <Send size={18} className="relative right-[1px]" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="bg-red-600 dark:bg-[#f05252] hover:bg-red-700 dark:hover:bg-[#fb6a6a] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center animate-bounce-slow"
                >
                    <MessageCircle size={28} />
                </button>
            )}
        </div>
    );
};

export default FaqChatbot;
