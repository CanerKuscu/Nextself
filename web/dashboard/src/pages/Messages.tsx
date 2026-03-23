import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FiMessageSquare, FiSend, FiUser, FiArrowLeft } from 'react-icons/fi';

const Messages = () => {
    const [chats, setChats] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionUser, setSessionUser] = useState<any>(null);
    const [showChatList, setShowChatList] = useState(true);
    const messagesEndRef = useRef(null);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setSessionUser(session.user);
            loadChats(session.user.id);
        }
    };

    const loadChats = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('chat_participants')
                .select(`
                    chat_id,
                    chats:chat_id (
                        id, updated_at,
                        chat_participants ( user_id, users:user_id(id, first_name, last_name, avatar_url) )
                    )
                `)
                .eq('user_id', userId);

            if (data) {
                const formatted = data.map(d => {
                    const chat = Array.isArray(d.chats) ? d.chats[0] : d.chats;
                    const participants = chat?.chat_participants || [];
                    const other = participants.find(p => p.user_id !== userId)?.users;
                    const otherUser = Array.isArray(other) ? other[0] : other;
                    return {
                        id: d.chat_id,
                        name: otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown Client',
                        lastMessage: 'Tap to view messages...',
                        time: chat?.updated_at ? new Date(chat.updated_at).toLocaleDateString() : ''
                    };
                });
                setChats(formatted);
            }
        } catch (error: any) {
            console.error('Chat load failed');
        } finally {
            setLoading(false);
        }
    };

    const loadMessagesForChat = async (chatId) => {
        if (!chatId || !sessionUser?.id) { return; }
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (data) {
                setMessages(data.map(m => ({ ...m, isMe: m.sender_id === sessionUser.id })));
            }

            // Clean up previous subscription
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }

            // Subscribe to new messages in this chat
            const channel = supabase
                .channel(`messages:${chatId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                }, (payload) => {
                    const payloadMessage: any = payload.new;
                    const newMsg = { ...payloadMessage, isMe: payloadMessage.sender_id === sessionUser.id };
                    setMessages(prev => {
                        // Deduplicate: replace optimistic temp message or skip if already exists
                        if (prev.some(m => m.id === newMsg.id)) { return prev; }
                        const withoutOptimistic = newMsg.isMe
                            ? prev.filter(m => !String(m.id).startsWith('temp-'))
                            : prev;
                        return [...withoutOptimistic, newMsg];
                    });
                })
                .subscribe();

            subscriptionRef.current = channel;
        } catch (error: any) {
            console.error('Message load failed');
        }
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup subscription on unmount
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, []);

    const handleSelectChat = (chat) => {
        setActiveChat(chat);
        loadMessagesForChat(chat.id);
        // On mobile, hide chat list when a chat is selected
        setShowChatList(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) { return; }

        const msgContent = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const optimistic = { id: `temp-${Date.now()}`, content: msgContent, isMe: true };
        setMessages(prev => [...prev, optimistic]);

        try {
            const { error } = await supabase.from('messages').insert({
                chat_id: activeChat.id,
                sender_id: sessionUser.id,
                content: msgContent,
                message_type: 'text'
            });
            if (error) {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                console.error('Message send failed:', error);
            }
        } catch (err: any) {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            console.error('Message send failed');
        }
    };

    return (
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200" style={{ height: 'calc(100vh - 12rem)' }}>
            {/* Chat List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${activeChat && !showChatList ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : chats.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No active chats</div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${activeChat?.id === chat.id ? 'bg-primary-50' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                        <FiUser />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <p className="text-sm font-medium text-gray-900 truncate">{chat.name}</p>
                                            <p className="text-xs text-gray-500">{chat.time}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col ${!activeChat || showChatList ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
                            <button onClick={() => setShowChatList(true)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg mr-1">
                                <FiArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                <FiUser />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">{activeChat.name}</h3>
                                <p className="text-xs text-green-500">Connected</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 ${msg.isMe
                                            ? 'bg-primary-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <form onSubmit={handleSend} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <button
                                    type="submit"
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                                >
                                    <FiSend />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <FiMessageSquare className="w-16 h-16 mb-4 opacity-50" />
                        <p>Select a client to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
