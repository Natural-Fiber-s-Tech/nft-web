import { useState, useEffect, useRef, useContext } from 'react';
import { generalData, questions } from './data/faqData.js'
import { LanguageContext } from '../../context/LanguageContext';

export const useChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Consume global language context
    const { language, toggleLanguage: setGlobalLanguage } = useContext(LanguageContext);

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    // Default to 'es' if language context is missing (safety check)
    const currentLang = language || 'es';
    const currentGeneralData = generalData[currentLang];

    // Initialize greeting only on first load
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ type: 'bot', text: currentGeneralData.greeting }]);
        }
    }, []); // Only on mount

    // Clear messages and re-greet when language changes
    useEffect(() => {
        setMessages([{ type: 'bot', text: currentGeneralData.greeting }]);
    }, [currentLang]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const toggleChat = () => setIsOpen(!isOpen);

    const toggleLanguage = () => {
        setGlobalLanguage(currentLang === 'es' ? 'en' : 'es');
    };

    const addMessage = (type, text, options = {}) => {
        setMessages(prev => [...prev, { type, text, ...options }]);
    };

    const handleQuickQuestion = (questionObj) => {
        // Quick question is a string from the 'questions' array.
        // We need to pick the "best" representation for the user's side of the chat.
        // We'll use the first user_input available for the current language.
        const userSideText = questionObj.user_inputs[currentLang][0];

        addMessage('user', userSideText);
        setTimeout(() => {
            addMessage('bot', questionObj.answer[currentLang], { showContact: questionObj.showContact });
        }, 500);
    };

    // --- Helper Functions for Search Logic ---
    const normalize = (text) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[¿?¡!.,;]/g, "");      // Remove punctuation
    };

    const getTokens = (text) => {
        // Common stop words in Spanish and English
        const stopWords = new Set([
            "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "de", "del", "a", "al", "en", "es", "son", "que", "para", "por", "con", "mi", "tu", "su", "lo", "le",
            "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "that", "for", "with", "my", "your", "its", "it"
        ]);

        return normalize(text)
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        addMessage('user', inputText);
        const userTokens = getTokens(inputText);
        const rawInput = normalize(inputText);
        setInputText('');

        // If no valid tokens found (only stop words), fallback to exact match or not found
        if (userTokens.length === 0) {
            const exactMatch = questions.find(q =>
                q.user_inputs[currentLang].some(input => normalize(input).includes(rawInput)) ||
                normalize(q.answer[currentLang]).includes(rawInput)
            );

            setTimeout(() => {
                if (exactMatch) {
                    addMessage('bot', exactMatch.answer[currentLang], { showContact: exactMatch.showContact });
                } else {
                    addMessage('bot', currentGeneralData.notFound);
                }
            }, 500);
            return;
        }

        let bestMatch = null;
        let maxScore = 0;

        questions.forEach(q => {
            let score = 0;

            // We search against all VALID inputs for the current language
            const candidateInputs = q.user_inputs[currentLang];
            const candidateKeywords = q.keywords[currentLang] || [];

            // 1. Check against user inputs (titles/questions)
            candidateInputs.forEach(input => {
                const inputTokens = getTokens(input);
                userTokens.forEach(token => {
                    if (inputTokens.some(it => it.includes(token) || token.includes(it))) {
                        score += 2;
                    }
                });

                // Bonus for exact substring in input
                if (normalize(input).includes(rawInput)) {
                    score += 3;
                }
            });

            // 2. Check against answer
            const answerText = q.answer[currentLang];
            if (normalize(answerText).includes(rawInput)) {
                score += 1;
            }

            // 3. Check against keywords
            userTokens.forEach(token => {
                if (candidateKeywords.some(k => k.includes(token) || token.includes(k))) {
                    score += 3;
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestMatch = q;
            }
        });

        // Threshold: need at least some minimal match relevance
        const THRESHOLD = 1;

        setTimeout(() => {
            if (bestMatch && maxScore >= THRESHOLD) {
                addMessage('bot', bestMatch.answer[currentLang], { showContact: bestMatch.showContact });
            } else {
                addMessage('bot', currentGeneralData.notFound);
            }
        }, 500);
    };

    // Transform 'questions' into the format valid for the quick questions display
    // We only display the 'first' user input as the "Question" label
    const quickQuestions = questions
        .filter(q => q.isQuick)
        .map(q => ({
            ...q,
            question: q.user_inputs[currentLang][0]
        }));

    return {
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
        currentData: currentGeneralData, // Expose general strings
        messagesEndRef
    };
};
