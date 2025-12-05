import { useState, useEffect, useRef, ReactNode } from 'react';
import { Project, Task, TaskColumn } from '../../../../../shared/types/project.types';
import { getSocket, disconnectSocket } from '../../../services/socket';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Edit2, Plus, DollarSign, Clock, Flag, Calendar, MessageCircle, CheckSquare, X, Send, FileText, Image, MoreVertical, Download, Trash2, UserPlus, Mail, Phone, Search, Kanban, List, Tag, Reply, Pencil } from 'lucide-react';
import { 
  useProjectTasks, 
  useUsers, 
  useProjectResources, 
  useProjectPhases, 
  useTechStack, 
  useProjectEnvironments, 
  useDesignReviews, 
  useBugReports, 
  useUAT, 
  useGoLive, 
  useProjectExport,
  useProjectMembers
} from '../../../hooks';
import { useAuth } from '../../auth/hooks/useAuth';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { CreateTaskModal } from './CreateTaskModal';
import { MentionInput, extractMentionedUserIds } from './MentionInput';
import { ResourceManager } from './ResourceManager';
import { PhaseTracker } from './PhaseTracker';
import { TechStackSelector } from './TechStackSelector';
import { EnvironmentManager } from './EnvironmentManager';
import { DesignReview } from './DesignReview';
import { TestingModule } from './TestingModule';
import { UATModule } from './UATModule';
import { GoLiveChecklist } from './GoLiveChecklist';
import { HandoverModule } from './HandoverModule';
import { ExportModule } from './ExportModule';
import { AddMemberModal } from './AddMemberModal';

// Helper function: Build nested comments tree
const buildCommentTree = (comments: any[]): any[] => {
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];
    
    // First pass: create map of all comments
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Second pass: build tree structure
    comments.forEach(comment => {
        const commentNode = commentMap.get(comment.id)!;
        if (comment.parentId) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
                parent.replies.push(commentNode);
            } else {
                // Parent not found, treat as root
                rootComments.push(commentNode);
            }
        } else {
            rootComments.push(commentNode);
        }
    });
    
    return rootComments;
};

/**
 * Recursive function to find and update a comment in a nested comments tree
 * @param comments - Array of comments (can be nested with replies)
 * @param commentId - ID of the comment to update
 * @param updates - Object with fields to update (e.g., { text, updatedAt })
 * @returns New array with updated comment (immutable update)
 */
const updateCommentInTree = (comments: any[], commentId: string, updates: any): any[] => {
    return comments.map(comment => {
        // If this is the comment we're looking for, merge the updates
        if (comment.id === commentId) {
            return {
                ...comment,
                ...updates,
                // Preserve replies if they exist
                replies: comment.replies || [],
            };
        }
        
        // If this comment has replies, recursively search and update in replies
        if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: updateCommentInTree(comment.replies, commentId, updates),
            };
        }
        
        // Return unchanged comment
        return comment;
    });
};

// Helper function: Render text with mentions
// UserHoverCard Component for displaying user info on mention hover
interface UserHoverCardProps {
    userId: string;
    userName: string;
    userAvatar?: string;
    userEmail?: string;
    userRole?: string;
}

const UserHoverCard = ({ userId, userName, userAvatar, userEmail, userRole }: UserHoverCardProps) => {
    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        console.log(`Open chat with ${userId}`);
        // TODO: Implement chat functionality
    };

    return (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
            {/* Arrow pointing down */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-200"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white -mt-px"></div>
            
            {/* User Avatar */}
            <div className="flex flex-col items-center mb-3">
                <img 
                    src={userAvatar || 'https://via.placeholder.com/64'} 
                    alt={userName}
                    className="w-16 h-16 rounded-full border-2 border-slate-200 mb-2 object-cover"
                />
                <h3 className="font-bold text-slate-900 text-sm text-center">{userName}</h3>
                {userEmail && (
                    <p className="text-xs text-slate-500 mt-1 text-center">{userEmail}</p>
                )}
                {userRole && (
                    <p className="text-xs text-slate-400 mt-1 text-center">{userRole}</p>
                )}
            </div>
            
            {/* Message Button */}
            <button
                onClick={handleMessageClick}
                className="w-full px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
            >
                <MessageCircle size={14} />
                Nhắn tin
            </button>
        </div>
    );
};

// Updated renderTextWithMentions function with UserHoverCard support
const renderTextWithMentions = (
    text: string, 
    mentions?: Array<{ userId: string; userName: string; userAvatar: string }>,
    users?: any[] // Full users array for lookup
) => {
    if (!mentions || mentions.length === 0) {
        return <span>{text}</span>;
    }

    const parts: (string | ReactNode)[] = [];
    let lastIndex = 0;
    const mentionMap = new Map(mentions.map(m => [m.userName.toLowerCase(), m]));
    
    // Create a map of userId to full user object for lookup
    const userMap = new Map();
    if (users) {
        users.forEach(user => {
            userMap.set(user.id, user);
        });
    }

    // Find all @mentions in text
    const mentionRegex = /@([^@\s]+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const mentionName = match[1].trim();
        const mention = mentionMap.get(mentionName.toLowerCase());
        
        if (mention) {
            // Get full user details if available
            const fullUser = userMap.get(mention.userId);
            
            parts.push(
                <span
                    key={`mention-${match.index}`}
                    className="relative inline-block group"
                >
                    <span className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                        @{mentionName}
                    </span>
                    <UserHoverCard
                        userId={mention.userId}
                        userName={mention.userName}
                        userAvatar={mention.userAvatar || fullUser?.avatarUrl || fullUser?.avatar}
                        userEmail={fullUser?.email}
                        userRole={fullUser?.role || fullUser?.position}
                    />
                </span>
            );
        } else {
            parts.push(`@${mentionName}`);
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <span>{parts}</span>;
};

// CommentItem Component - MUST be defined outside TaskDetailPanel to prevent re-render issues
interface CommentItemProps {
    comment: any;
    depth?: number;
    currentUserId?: string;
    taskId: string; // Add taskId to props
    editingCommentId: string | null;
    editingText: string;
    replyingToCommentId: string | null;
    replyText: string;
    users: any[];
    onReply: (commentId: string) => void;
    onCancelReply: () => void;
    onSubmitReply: () => void;
    onEdit: (comment: any) => void;
    onCancelEdit: () => void;
    onUpdateComment: (taskId: string, commentId: string, text: string) => Promise<void>; // Add onUpdateComment directly
    onDelete: (commentId: string) => void;
    setEditingText: (text: string) => void;
    setReplyText: (text: string) => void;
}

const CommentItem = ({ 
    comment, 
    depth = 0,
    currentUserId,
    taskId,
    editingCommentId,
    editingText,
    replyingToCommentId,
    replyText,
    users,
    onReply,
    onCancelReply,
    onSubmitReply,
    onEdit,
    onCancelEdit,
    onUpdateComment,
    onDelete,
    setEditingText,
    setReplyText,
}: CommentItemProps) => {
    const isOwner = currentUserId === comment.userId;
    const isEditingThis = editingCommentId === comment.id;
    const isReplyingToThis = replyingToCommentId === comment.id;
    const isDeleted = comment.isDeleted === true;
    
    // Check if comment was edited (updatedAt exists and is different from timestamp)
    const isEdited = comment.updatedAt && 
                     comment.updatedAt !== comment.timestamp && 
                     new Date(comment.updatedAt) > new Date(comment.timestamp);
    
    // Handle save edit - now defined inside CommentItem with access to onUpdateComment
    const handleSaveEdit = async () => {
        if (!editingText.trim() || !onUpdateComment || !editingCommentId) {
            console.warn('[CommentItem handleSaveEdit] Missing required data:', { 
                editingText: editingText.trim(), 
                hasOnUpdateComment: !!onUpdateComment, 
                editingCommentId 
            });
            return;
        }
        
        const commentId = editingCommentId;
        const newText = editingText.trim();
        
        console.log('[CommentItem handleSaveEdit] Starting edit:', { commentId, newText, taskId });
        
        try {
            // Call API to update on server
            await onUpdateComment(taskId, commentId, newText);
            console.log('[CommentItem handleSaveEdit] API call successful');
            
            // Cancel edit mode
            onCancelEdit();
            console.log('[CommentItem handleSaveEdit] Edit mode cancelled');
        } catch (error) {
            console.error('[CommentItem handleSaveEdit] Error updating comment:', error);
            alert('Không thể cập nhật bình luận: ' + (error instanceof Error ? error.message : String(error)));
        }
    };
    
    return (
        <div className={depth > 0 ? 'ml-8 mt-3' : ''}>
            <div className="flex gap-3">
                <img src={comment.userAvatar || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-900">{comment.userName}</span>
                        <div className="flex items-center gap-2">
                            {isEdited && !isDeleted && (
                                <span className="text-[10px] text-slate-400 italic">(đã chỉnh sửa)</span>
                            )}
                            <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                    
                    {isEditingThis ? (
                        <div className="space-y-2">
                            <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                rows={3}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
                                >
                                    Lưu
                                </button>
                                <button
                                    onClick={onCancelEdit}
                                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isDeleted ? (
                                <p className="text-sm text-slate-400 italic">Tin nhắn đã thu hồi</p>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                        {renderTextWithMentions(comment.text, comment.mentions, users)}
                                    </p>
                                    {comment.mentions && comment.mentions.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {comment.mentions.map((mention: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs"
                                                >
                                                    @{mention.userName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* Action buttons - Hide for deleted comments */}
                            {!isDeleted && (
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        onClick={() => onReply(comment.id)}
                                        className="text-xs text-slate-600 hover:text-brand-600 flex items-center gap-1"
                                    >
                                        <Reply size={12} /> Trả lời
                                    </button>
                                    {isOwner && (
                                        <>
                                            <button
                                                onClick={() => onEdit(comment)}
                                                className="text-xs text-slate-600 hover:text-brand-600 flex items-center gap-1"
                                            >
                                                <Pencil size={12} /> Chỉnh sửa
                                            </button>
                                            <button
                                                onClick={() => onDelete(comment.id)}
                                                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                            >
                                                <Trash2 size={12} /> Thu hồi
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Reply Input */}
            {isReplyingToThis && (
                <div className="ml-11 mt-3">
                    <MentionInput
                        value={replyText}
                        onChange={setReplyText}
                        placeholder={`Trả lời ${comment.userName}... (Gõ @ để tag người dùng)`}
                        users={users.map(u => ({
                            id: u.id,
                            fullName: u.fullName || u.name || 'Unknown',
                            email: u.email,
                            avatarUrl: u.avatarUrl || u.avatar,
                        }))}
                        className="w-full pl-4 pr-20 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm"
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={onSubmitReply}
                            className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
                        >
                            Gửi
                        </button>
                        <button
                            onClick={onCancelReply}
                            className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}
            
            {/* Render Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3">
                    {comment.replies.map((reply: any) => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            depth={depth + 1}
                            taskId={taskId}
                            currentUserId={currentUserId}
                            editingCommentId={editingCommentId}
                            editingText={editingText}
                            replyingToCommentId={replyingToCommentId}
                            replyText={replyText}
                            users={users}
                            onReply={onReply}
                            onCancelReply={onCancelReply}
                            onSubmitReply={onSubmitReply}
                            onEdit={onEdit}
                            onCancelEdit={onCancelEdit}
                            onUpdateComment={onUpdateComment}
                            onDelete={onDelete}
                            setEditingText={setEditingText}
                            setReplyText={setReplyText}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Mock project files - can be moved to API later
const MOCK_PROJECT_FILES = [
  { id: 'f1', name: 'Project_Requirements_v2.pdf', size: '2.4 MB', type: 'pdf', uploader: 'Nguyễn Thị Hoa', date: '2024-10-05' },
  { id: 'f2', name: 'Design_System_Assets.zip', size: '156 MB', type: 'zip', uploader: 'Lê Văn B', date: '2024-10-12' },
  { id: 'f3', name: 'Meeting_Minutes_Kickoff.docx', size: '450 KB', type: 'doc', uploader: 'Trần Văn Nam', date: '2024-10-02' },
  { id: 'f4', name: 'Budget_Estimation_2024.xlsx', size: '1.2 MB', type: 'xls', uploader: 'Phạm Thu Trang', date: '2024-10-08' },
  { id: 'f5', name: 'Main_Banner_Draft.png', size: '5.8 MB', type: 'image', uploader: 'Lê Văn B', date: '2024-10-15' },
];

const TaskDetailPanel = ({ 
    task, 
    onClose, 
    onUpdate,
    onDelete,
    columns,
    users,
    onAddChecklistItem,
    onUpdateChecklistItem,
    onDeleteChecklistItem,
    onAddComment,
    onUpdateComment,
    onDeleteComment,
}: { 
    task: Task, 
    onClose: () => void,
    onUpdate: (taskId: string, data: any) => Promise<void>,
    onDelete: (taskId: string) => Promise<void>,
    columns: TaskColumn[],
    users: any[],
    onAddChecklistItem?: (taskId: string, title: string) => Promise<void>,
    onUpdateChecklistItem?: (taskId: string, itemId: string, updates: { title?: string; isCompleted?: boolean }) => Promise<void>,
    onDeleteChecklistItem?: (taskId: string, itemId: string) => Promise<void>,
    onAddComment?: (taskId: string, content: string, mentionedUserIds?: string[], parentId?: string) => Promise<void>,
    onUpdateComment?: (taskId: string, commentId: string, text: string) => Promise<void>,
    onDeleteComment?: (taskId: string, commentId: string) => Promise<void>,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [tags, setTags] = useState<string[]>(task.tags || []);
    const [newTag, setNewTag] = useState('');
    
    // Comment editing and replying states
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState<string>('');
    
    // Edit form state
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority] = useState(task.priority);
    const [assigneeId, setAssigneeId] = useState(task.assigneeId || '');
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [columnId, setColumnId] = useState(task.columnId);
    
    // Reset form when task changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setAssigneeId(task.assigneeId || '');
        setDueDate(task.dueDate || '');
        setColumnId(task.columnId);
        setTags(task.tags || []);
        setIsEditing(false);
        setNewComment('');
        setMentionedUserIds([]);
        setNewChecklistItem('');
        setNewTag('');
        setEditingCommentId(null);
        setEditingText('');
        setReplyingToCommentId(null);
        setReplyText('');
    }, [task]);
    
    const completedChecklist = task.checklist ? task.checklist.filter((i: { isCompleted: boolean }) => i.isCompleted).length : 0;
    const totalChecklist = task.checklist ? task.checklist.length : 0;
    const progress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;
    
    // Find Done column
    const doneColumn = columns.find(col => 
        col.name.toLowerCase().includes('done') || 
        col.name.toLowerCase().includes('hoàn thành')
    ) || columns[columns.length - 1];
    
    const isCompleted = doneColumn && task.columnId === doneColumn.id;
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(task.id, {
                title,
                description: description || null,
                priority,
                assigneeId: assigneeId || null,
                dueDate: dueDate || null,
                columnId,
                tags: tags.length > 0 ? tags : undefined,
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Không thể cập nhật task');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };
    
    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };
    
    const handleCompleteTask = async () => {
        if (doneColumn && task.columnId !== doneColumn.id) {
            try {
                await onUpdate(task.id, { columnId: doneColumn.id });
            } catch (error) {
                console.error('Error completing task:', error);
            }
        }
    };
    
    const handleToggleChecklist = async (itemId: string, isCompleted: boolean) => {
        if (!onUpdateChecklistItem) {
            console.warn('onUpdateChecklistItem not provided');
            return;
        }
        try {
            await onUpdateChecklistItem(task.id, itemId, { isCompleted: !isCompleted });
        } catch (error) {
            console.error('Error toggling checklist item:', error);
            alert('Không thể cập nhật checklist item');
        }
    };
    
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        if (!onAddComment) {
            console.warn('onAddComment not provided');
            return;
        }
        try {
            // Extract mentioned user IDs from comment text
            const mentionedIds = extractMentionedUserIds(newComment, users);
            await onAddComment(task.id, newComment.trim(), mentionedIds);
            setNewComment('');
            setMentionedUserIds([]);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Không thể thêm bình luận');
        }
    };
    
    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;
        if (!onAddChecklistItem) {
            console.warn('onAddChecklistItem not provided');
            return;
        }
        try {
            await onAddChecklistItem(task.id, newChecklistItem.trim());
            setNewChecklistItem('');
        } catch (error) {
            console.error('Error adding checklist item:', error);
            alert('Không thể thêm checklist item');
        }
    };
    
    // Get current user for comment actions
    const { user } = useAuth();
    
    const handleReply = (commentId: string) => {
        setReplyingToCommentId(commentId);
        setReplyText('');
    };
    
    const handleCancelReply = () => {
        setReplyingToCommentId(null);
        setReplyText('');
    };
    
    const handleSubmitReply = async () => {
        if (!replyText.trim() || !onAddComment) return;
        try {
            const mentionedIds = extractMentionedUserIds(replyText, users);
            await onAddComment(task.id, replyText.trim(), mentionedIds, replyingToCommentId!);
            handleCancelReply();
        } catch (error) {
            console.error('Error replying to comment:', error);
            alert('Không thể gửi phản hồi');
        }
    };
    
    const handleEdit = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditingText(comment.text);
    };
    
    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingText('');
    };
    
    // Note: handleSaveEdit is now defined inside CommentItem component
    // This function is kept for backward compatibility but is no longer used
    // The actual save logic is in CommentItem.handleSaveEdit
    
    const handleDelete = async (commentId: string) => {
        if (!onDeleteComment) return;
        if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
            try {
                await onDeleteComment(task.id, commentId);
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('Không thể xóa bình luận');
            }
        }
    };
    

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{task.code}</span>
                        {isEditing ? (
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="px-2 py-1 rounded text-xs font-semibold border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="URGENT">URGENT</option>
                            </select>
                        ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                                priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                    priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                }`}>
                                {priority}
                            </span>
                        )}
                        {isCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                ✓ Hoàn thành
                            </span>
                        )}
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-xl font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                    ) : (
                        <h2 className="text-xl font-bold text-slate-900 leading-snug">{title}</h2>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && !isCompleted && (
                        <button
                            onClick={handleCompleteTask}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                            title="Đánh dấu hoàn thành"
                        >
                            <CheckSquare size={16} />
                            Hoàn thành
                        </button>
                    )}
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                            title="Chỉnh sửa"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Meta Controls */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Người thực hiện</label>
                        {isEditing ? (
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="">Chưa giao</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.fullName}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                <img src={task.assigneeAvatar || 'https://via.placeholder.com/30'} className="w-6 h-6 rounded-full" alt="" />
                                <span className="text-sm font-medium text-slate-900">{task.assigneeName || 'Chưa giao'}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Hạn hoàn thành</label>
                        {isEditing ? (
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        ) : (
                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                <Calendar size={16} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-900">{dueDate || 'Chưa có hạn'}</span>
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Trạng thái (Column)</label>
                            <select
                                value={columnId}
                                onChange={(e) => setColumnId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                {columns.map(col => (
                                    <option key={col.id} value={col.id}>{col.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Tag size={16} className="text-brand-600" /> Tags
                    </h3>
                    {isEditing ? (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <span 
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium"
                                    >
                                        {tag}
                                        <button 
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-brand-900"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                    placeholder="Nhập tag và nhấn Enter..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                                <button
                                    onClick={handleAddTag}
                                    className="px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg font-medium"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {tags.length > 0 ? (
                                tags.map(tag => (
                                    <span 
                                        key={tag}
                                        className="px-2 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400">Chưa có tags</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Mô tả công việc</h3>
                    {isEditing ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 text-sm text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none min-h-[120px]"
                            placeholder="Nhập mô tả công việc..."
                        />
                    ) : (
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                            {description || 'Chưa có mô tả'}
                        </div>
                    )}
                </div>

                {/* Checklist (To Do) */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <CheckSquare size={16} className="text-brand-600" /> Checklist
                        </h3>
                        <span className="text-xs text-slate-500">
                            {completedChecklist}/{totalChecklist} hoàn thành
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                        <div
                            className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="space-y-2">
                        {task.checklist && task.checklist.map((item: { id: string; title: string; isCompleted: boolean }) => (
                            <label key={item.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer group">
                                <div className="relative flex items-center mt-0.5">
                                    <input 
                                        type="checkbox" 
                                        checked={item.isCompleted} 
                                        onChange={() => handleToggleChecklist(item.id, item.isCompleted)}
                                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer" 
                                    />
                                </div>
                                <span className={`text-sm transition-colors ${item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {item.title}
                                </span>
                            </label>
                        ))}
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newChecklistItem}
                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                placeholder="Thêm việc cần làm..."
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <button 
                                onClick={handleAddChecklistItem}
                                className="px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg font-medium flex items-center gap-2"
                            >
                                <Plus size={16} /> Thêm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Comments */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageCircle size={16} className="text-slate-400" /> Thảo luận
                    </h3>

                    <div className="space-y-4 mb-4">
                        {(() => {
                            // Build comment tree - handle both flat and nested structures
                            const commentsToRender = task.comments && task.comments.length > 0 
                                ? (task.comments[0]?.replies ? task.comments : buildCommentTree(task.comments))
                                : [];
                            
                            return commentsToRender.length > 0 ? (
                                commentsToRender.map((comment: any) => (
                                    <CommentItem 
                                        key={comment.id} 
                                        comment={comment}
                                        taskId={task.id}
                                        currentUserId={user?.id}
                                        editingCommentId={editingCommentId}
                                        editingText={editingText}
                                        replyingToCommentId={replyingToCommentId}
                                        replyText={replyText}
                                        users={users}
                                        onReply={handleReply}
                                        onCancelReply={handleCancelReply}
                                        onSubmitReply={handleSubmitReply}
                                        onEdit={handleEdit}
                                        onCancelEdit={handleCancelEdit}
                                        onUpdateComment={onUpdateComment!}
                                        onDelete={handleDelete}
                                        setEditingText={setEditingText}
                                        setReplyText={setReplyText}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">Chưa có bình luận nào</p>
                            );
                        })()}
                    </div>

                    <div className="relative">
                        <MentionInput
                            value={newComment}
                            onChange={setNewComment}
                            placeholder="Viết bình luận... (Gõ @ để tag người dùng)"
                            users={users.map(u => ({
                                id: u.id,
                                fullName: u.fullName || u.name || 'Unknown',
                                email: u.email,
                                avatarUrl: u.avatarUrl || u.avatar,
                            }))}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none shadow-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment();
                                }
                            }}
                        />
                        <button 
                            onClick={handleAddComment}
                            className="absolute right-2 top-2 p-1 text-brand-600 hover:bg-brand-50 rounded"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                {isEditing && (
                    <button
                        onClick={async () => {
                            if (confirm('Bạn có chắc muốn xóa task này?')) {
                                try {
                                    await onDelete(task.id);
                                    onClose();
                                } catch (error) {
                                    console.error('Error deleting task:', error);
                                    alert('Không thể xóa task');
                                }
                            }
                        }}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                        <Trash2 size={16} className="inline mr-2" />
                        Xóa task
                    </button>
                )}
                <div className="flex gap-3 ml-auto">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => {
                                setIsEditing(false);
                                setTitle(task.title);
                                setDescription(task.description || '');
                                setPriority(task.priority);
                                setAssigneeId(task.assigneeId || '');
                                setDueDate(task.dueDate || '');
                                setColumnId(task.columnId);
                            }}>
                                Hủy
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || !title.trim()}
                                className="bg-brand-600 hover:bg-brand-700"
                            >
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={onClose}>Đóng</Button>
                    )}
                </div>
            </div>
        </div>
    );
};


type TabType = 'overview' | 'tasks' | 'team' | 'files' | 'resources' | 'phases' | 'tech-stack' | 'environments' | 'design-review' | 'testing' | 'uat' | 'go-live' | 'export';

export const ProjectDetailView = ({ project, onBack }: { project: Project, onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState<TabType>('tasks');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedColumnForNewTask, setSelectedColumnForNewTask] = useState<string | null>(null);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    // Fetch data using hooks
    const { user } = useAuth(); // Get current user for comments
    const { tasks, columns: rawColumns, loading: tasksLoading, error: tasksError, refetch: refetchTasks, createTask, updateTask, deleteTask, addChecklistItem, updateChecklistItem, deleteChecklistItem, addComment, updateComment, deleteComment } = useProjectTasks(project.id);
    
    // Update selectedTask when tasks change (e.g., after refetch)
    useEffect(() => {
        if (selectedTask && tasks.length > 0) {
            const updatedTask = tasks.find((t: any) => t.id === selectedTask.id);
            if (updatedTask) {
                // Only update if the task data has actually changed
                const taskWithTree = {
                    ...updatedTask,
                    comments: buildCommentTree(updatedTask.comments || []),
                };
                // Check if comments have changed to avoid unnecessary updates
                const commentsChanged = JSON.stringify(selectedTask.comments) !== JSON.stringify(taskWithTree.comments);
                if (commentsChanged) {
                    setSelectedTask(taskWithTree);
                    console.log('[useEffect] Updated selected task from tasks state');
                }
            }
        }
    }, [tasks, selectedTask?.id, selectedTask?.comments]);
    const { users } = useUsers(); // For AddMemberModal and TaskDetailPanel
    const { members, loading: membersLoading, error: membersError, addMember, updateMemberRole, removeMember, refresh: refreshMembers } = useProjectMembers(project.id);
    
    // Web project management hooks
    const resourcesHook = useProjectResources(project.id);
    const phasesHook = useProjectPhases(project.id);
    const techStackHook = useTechStack(project.id);
    const environmentsHook = useProjectEnvironments(project.id);
    const designReviewsHook = useDesignReviews(project.id);
    const bugReportsHook = useBugReports(project.id);
    const uatHook = useUAT(project.id);
    const goLiveHook = useGoLive(project.id);
    const exportHook = useProjectExport(project.id);

    // Sort columns by position
    const columns = [...rawColumns].sort((a, b) => a.position - b.position);

    // Socket.IO setup for real-time comments
    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        // Join task room when a task is selected
        if (selectedTask) {
            socket.emit('join_task', selectedTask.id);
            console.log(`[Socket] Joined task room: ${selectedTask.id}`);
        }

        // Listen for new comments
        const handleNewComment = (data: { taskId: string; comment: any }) => {
            console.log('[Socket] New comment received:', data);
            
            // Only update if the comment is for the currently selected task
            if (selectedTask && data.taskId === selectedTask.id) {
                setSelectedTask((prevTask) => {
                    if (!prevTask) return prevTask;
                    
                    // Check if comment already exists (avoid duplicates)
                    const commentExists = prevTask.comments?.some(
                        (c: any) => c.id === data.comment.id
                    );
                    
                    if (commentExists) {
                        console.log('[Socket] Comment already exists, skipping:', data.comment.id);
                        return prevTask;
                    }
                    
                    return {
                        ...prevTask,
                        comments: [...(prevTask.comments || []), data.comment],
                    };
                });
            }
            
            // Also update the tasks list to keep it in sync
            refetchTasks();
        };
        
        // Listen for comment updates
        const handleCommentUpdated = (data: { taskId: string; comment: any }) => {
            console.log('[Socket] Comment updated:', data);
            
            if (selectedTask && data.taskId === selectedTask.id) {
                setSelectedTask((prevTask) => {
                    if (!prevTask) return prevTask;
                    
                    // Update comment recursively in nested structure
                    const updateCommentInTree = (comments: any[], commentId: string, updatedComment: any): any[] => {
                        return comments.map(c => {
                            if (c.id === commentId) {
                                return { ...c, ...updatedComment };
                            }
                            if (c.replies && c.replies.length > 0) {
                                return {
                                    ...c,
                                    replies: updateCommentInTree(c.replies, commentId, updatedComment)
                                };
                            }
                            return c;
                        });
                    };
                    
                    return {
                        ...prevTask,
                        comments: updateCommentInTree(prevTask.comments || [], data.comment.id, data.comment),
                    };
                });
            }
            
            refetchTasks();
        };
        
        // Listen for comment deletions (soft delete - recall)
        const handleCommentDeleted = (data: { taskId: string; commentId: string; comment?: any }) => {
            console.log('[Socket] Comment deleted (recalled):', data);
            
            if (selectedTask && data.taskId === selectedTask.id) {
                setSelectedTask((prevTask) => {
                    if (!prevTask) return prevTask;
                    
                    // Update comment to set isDeleted = true (soft delete)
                    const updateCommentDeleted = (comments: any[], commentId: string): any[] => {
                        return comments.map(c => {
                            if (c.id === commentId) {
                                return { ...c, isDeleted: true };
                            }
                            if (c.replies && c.replies.length > 0) {
                                return {
                                    ...c,
                                    replies: updateCommentDeleted(c.replies, commentId)
                                };
                            }
                            return c;
                        });
                    };
                    
                    return {
                        ...prevTask,
                        comments: updateCommentDeleted(prevTask.comments || [], data.commentId),
                    };
                });
            }
            
            refetchTasks();
        };

        socket.on('new_comment', handleNewComment);
        socket.on('comment_updated', handleCommentUpdated);
        socket.on('comment_deleted', handleCommentDeleted);

        // Cleanup: Leave room when task changes or component unmounts
        return () => {
            if (selectedTask) {
                socket.emit('leave_task', selectedTask.id);
                console.log(`[Socket] Left task room: ${selectedTask.id}`);
            }
            socket.off('new_comment', handleNewComment);
            socket.off('comment_updated', handleCommentUpdated);
            socket.off('comment_deleted', handleCommentDeleted);
        };
    }, [selectedTask, refetchTasks]);

    // Cleanup socket on component unmount
    useEffect(() => {
        return () => {
            // Don't disconnect socket here as it might be used by other components
            // Just clean up the ref
            socketRef.current = null;
        };
    }, []);

    const handleCreateTask = async (taskData: any) => {
        try {
            await createTask(taskData);
            await refetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    // ============ Overview Calculations ============
    
    // Calculate progress from tasks (tasks in "Done" column / total tasks)
    const calculateProgress = (): number => {
        if (tasks.length === 0) return 0;
        
        // Find "Done" column (case-insensitive)
        const doneColumn = columns.find(col => 
            col.name.toLowerCase().includes('done') || 
            col.name.toLowerCase().includes('hoàn thành')
        );
        
        if (!doneColumn) {
            // If no "Done" column, calculate based on last column
            const lastColumn = columns[columns.length - 1];
            if (!lastColumn) return 0;
            const doneTasks = tasks.filter(t => t.columnId === lastColumn.id).length;
            return Math.round((doneTasks / tasks.length) * 100);
        }
        
        const doneTasks = tasks.filter(t => t.columnId === doneColumn.id).length;
        return Math.round((doneTasks / tasks.length) * 100);
    };

    const actualProgress = calculateProgress();

    // Task stats by column
    const taskStatsByColumn = columns.map(col => ({
        columnName: col.name,
        count: tasks.filter(t => t.columnId === col.id).length,
        percentage: tasks.length > 0 
            ? Math.round((tasks.filter(t => t.columnId === col.id).length / tasks.length) * 100)
            : 0,
    }));

    // Evaluate progress status (On Track / At Risk / Behind)
    const evaluateProgressStatus = (): { status: 'ON_TRACK' | 'AT_RISK' | 'BEHIND'; label: string; color: string } => {
        if (!project.startDate || !project.endDate) {
            return { status: 'ON_TRACK', label: 'On track', color: 'text-green-600' };
        }

        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const today = new Date();
        
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (totalDays <= 0 || daysElapsed < 0) {
            return { status: 'ON_TRACK', label: 'On track', color: 'text-green-600' };
        }

        const expectedProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
        const diff = actualProgress - expectedProgress;

        if (diff >= -10) {
            return { status: 'ON_TRACK', label: 'On track', color: 'text-green-600' };
        } else if (diff >= -25) {
            return { status: 'AT_RISK', label: 'At risk', color: 'text-amber-600' };
        } else {
            return { status: 'BEHIND', label: 'Behind schedule', color: 'text-red-600' };
        }
    };

    const progressStatus = evaluateProgressStatus();

    // Tasks due soon (within 7 days)
    const tasksDueSoon = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    // Overdue tasks
    const overdueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate < today && !columns.find(col => 
            (col.name.toLowerCase().includes('done') || col.name.toLowerCase().includes('hoàn thành')) &&
            task.columnId === col.id
        );
    });

    return (
        <div className="animate-fadeIn relative">
            {/* Create Task Modal */}
            {isCreateTaskModalOpen && (
                <CreateTaskModal
                    isOpen={isCreateTaskModalOpen}
                    onClose={() => {
                        setIsCreateTaskModalOpen(false);
                        setSelectedColumnForNewTask(null);
                    }}
                    onSave={handleCreateTask}
                    preselectedColumnId={selectedColumnForNewTask || undefined}
                />
            )}

            {/* Task Detail Drawer Overlay */}
            {selectedTask && (
                <>
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedTask(null)}></div>
                    <TaskDetailPanel 
                        task={selectedTask} 
                        onClose={() => setSelectedTask(null)}
                        onUpdate={async (taskId, data) => {
                            await updateTask(taskId, data);
                            await refetchTasks();
                            // Update selected task
                            const updatedTask = tasks.find(t => t.id === taskId);
                            if (updatedTask) setSelectedTask(updatedTask);
                        }}
                        onDelete={async (taskId) => {
                            await deleteTask(taskId);
                            await refetchTasks();
                            setSelectedTask(null);
                        }}
                        columns={columns}
                        users={users}
                        onAddChecklistItem={async (taskId, title) => {
                            await addChecklistItem(taskId, title);
                            const updatedTasks = await refetchTasks();
                            // Update selected task after refetch
                            const updatedTask = updatedTasks?.find((t: any) => t.id === taskId);
                            if (updatedTask) setSelectedTask(updatedTask);
                        }}
                        onUpdateChecklistItem={async (taskId, itemId, updates) => {
                            await updateChecklistItem(taskId, itemId, updates);
                            const updatedTasks = await refetchTasks();
                            // Update selected task after refetch
                            const updatedTask = updatedTasks?.find((t: any) => t.id === taskId);
                            if (updatedTask) setSelectedTask(updatedTask);
                        }}
                        onDeleteChecklistItem={async (taskId, itemId) => {
                            await deleteChecklistItem(taskId, itemId);
                            const updatedTasks = await refetchTasks();
                            // Update selected task after refetch
                            const updatedTask = updatedTasks?.find((t: any) => t.id === taskId);
                            if (updatedTask) setSelectedTask(updatedTask);
                        }}
                        onAddComment={async (taskId, content, mentionedUserIds, parentId) => {
                            if (!user?.id) {
                                alert('Bạn cần đăng nhập để thêm bình luận');
                                return;
                            }
                            // addComment already calls fetchData() internally, which will update tasks state
                            // The selected task will automatically reflect the updated comment
                            await addComment(taskId, content, mentionedUserIds, parentId);
                        }}
                        onUpdateComment={async (taskId, commentId, text) => {
                            console.log('[onUpdateComment] Called:', { taskId, commentId, text });
                            try {
                                await updateComment(taskId, commentId, text);
                                console.log('[onUpdateComment] API call successful, refetching...');
                                
                                // Refetch tasks to get updated data
                                // The useEffect hook will automatically update selectedTask when tasks change
                                refetchTasks();
                            } catch (error) {
                                console.error('[onUpdateComment] Error:', error);
                                throw error;
                            }
                        }}
                        onDeleteComment={async (taskId, commentId) => {
                            await deleteComment(taskId, commentId);
                            const updatedTasks = await refetchTasks();
                            // Update selected task after refetch - rebuild the tree structure
                            const updatedTask = updatedTasks?.find((t: any) => t.id === taskId);
                            if (updatedTask) {
                                // Rebuild comment tree for the updated task
                                const taskWithTree = {
                                    ...updatedTask,
                                    comments: buildCommentTree(updatedTask.comments || []),
                                };
                                setSelectedTask(taskWithTree);
                            }
                        }}
                    />
                </>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-start gap-4">
                    <Button variant="outline" onClick={onBack} className="mt-1 p-2 h-10 w-10"><ArrowLeft size={18} /></Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">{project.key}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${project.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                project.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                    project.status === 'PLANNING' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
                                }`}>{project.status}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Edit2 size={16} className="mr-2" /> Cấu hình</Button>
                    <Button onClick={() => setIsCreateTaskModalOpen(true)}><Plus size={16} className="mr-2" /> Thêm Task</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Tổng quan' },
                    { id: 'tasks', label: 'Bảng công việc' },
                    { id: 'resources', label: 'Tài nguyên' },
                    { id: 'phases', label: 'Giai đoạn' },
                    { id: 'tech-stack', label: 'Tech Stack' },
                    { id: 'environments', label: 'Môi trường' },
                    { id: 'design-review', label: 'Design Review' },
                    { id: 'testing', label: 'Testing' },
                    { id: 'uat', label: 'UAT' },
                    { id: 'go-live', label: 'Go Live' },
                    { id: 'team', label: 'Thành viên' },
                    { id: 'files', label: 'Tài liệu' },
                    { id: 'export', label: 'Export' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>


            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Main Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Progress Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Tiến độ tổng thể</div>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-bold text-slate-900">{actualProgress}%</span>
                                    <span className={`text-sm font-medium ${progressStatus.color}`}>
                                        {progressStatus.label}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            progressStatus.status === 'ON_TRACK' ? 'bg-green-500' :
                                            progressStatus.status === 'AT_RISK' ? 'bg-amber-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${actualProgress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs text-slate-400 mt-2">
                                    {tasks.length > 0 
                                        ? `${tasks.filter(t => {
                                            const doneCol = columns.find(col => 
                                                col.name.toLowerCase().includes('done') || 
                                                col.name.toLowerCase().includes('hoàn thành')
                                            ) || columns[columns.length - 1];
                                            return doneCol && t.columnId === doneCol.id;
                                        }).length}/${tasks.length} tasks completed`
                                        : 'No tasks yet'
                                    }
                                </div>
                            </div>

                            {/* Budget Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Ngân sách (Budget)</div>
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign size={20} className="text-slate-400" />
                                    <span className="text-xl font-bold text-slate-900">{project.budget || 'N/A'}</span>
                                </div>
                                <div className="text-xs text-slate-400">Budget allocated</div>
                            </div>

                            {/* Timeline Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Thời gian (Timeline)</div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Clock size={14} className="text-green-500" /> Start: {project.startDate || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Flag size={14} className="text-red-500" /> Deadline: {project.endDate || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks Summary Card */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Tổng số Tasks</div>
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckSquare size={20} className="text-slate-400" />
                                    <span className="text-xl font-bold text-slate-900">{tasks.length}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                    {overdueTasks.length > 0 && (
                                        <span className="text-red-600 font-medium">{overdueTasks.length} overdue</span>
                                    )}
                                    {overdueTasks.length === 0 && tasksDueSoon.length > 0 && (
                                        <span className="text-amber-600 font-medium">{tasksDueSoon.length} due soon</span>
                                    )}
                                    {overdueTasks.length === 0 && tasksDueSoon.length === 0 && 'All on track'}
                                </div>
                            </div>
                        </div>

                        {/* Task Distribution by Column */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Phân bổ công việc</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {taskStatsByColumn.map((stat, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700">{stat.columnName}</span>
                                            <span className="text-lg font-bold text-slate-900">{stat.count}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2">
                                            <div 
                                                className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${stat.percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{stat.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alerts Section */}
                        {(overdueTasks.length > 0 || tasksDueSoon.length > 0) && (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Cảnh báo</h3>
                                <div className="space-y-3">
                                    {overdueTasks.length > 0 && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flag size={18} className="text-red-600" />
                                                <span className="font-semibold text-red-900">
                                                    {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} quá hạn
                                                </span>
                                            </div>
                                            <div className="text-sm text-red-700">
                                                {overdueTasks.slice(0, 3).map(task => task.title).join(', ')}
                                                {overdueTasks.length > 3 && ` và ${overdueTasks.length - 3} task khác`}
                                            </div>
                                        </div>
                                    )}
                                    {tasksDueSoon.length > 0 && (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock size={18} className="text-amber-600" />
                                                <span className="font-semibold text-amber-900">
                                                    {tasksDueSoon.length} task{tasksDueSoon.length > 1 ? 's' : ''} sắp đến hạn (trong 7 ngày)
                                                </span>
                                            </div>
                                            <div className="text-sm text-amber-700">
                                                {tasksDueSoon.slice(0, 3).map(task => task.title).join(', ')}
                                                {tasksDueSoon.length > 3 && ` và ${tasksDueSoon.length - 3} task khác`}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Project Manager Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">PM Phụ trách</h3>
                                {(() => {
                                    const manager = members.find(m => m.role === 'MANAGER');
                                    return manager ? (
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={manager.userAvatar || 'https://via.placeholder.com/48'} 
                                                alt={manager.userName || 'Manager'} 
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200" 
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900">{manager.userName}</p>
                                                <p className="text-sm text-slate-500">{manager.userPosition || 'Project Manager'}</p>
                                                {manager.userEmail && (
                                                    <a href={`mailto:${manager.userEmail}`} className="text-xs text-brand-600 hover:underline">
                                                        {manager.userEmail}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">Chưa có PM được chỉ định</div>
                                    );
                                })()}
                            </div>

                            {/* Description */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Mô tả dự án</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">
                                    {project.description || 'Chưa có mô tả'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                {activeTab === 'tasks' && (
                    <div className="animate-fadeIn h-full flex flex-col">
                        {tasksLoading ? (
                            <LoadingSpinner size="md" text="Đang tải danh sách công việc..." />
                        ) : tasksError ? (
                            <ErrorMessage message={tasksError} onRetry={refetchTasks} />
                        ) : (
                        <>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex gap-2">
                                <div className="flex bg-white border border-slate-200 rounded-md p-1">
                                    <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}><Kanban size={18} /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}><List size={18} /></button>
                                </div>
                                <input type="text" placeholder="Tìm kiếm task..." className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:ring-1 focus:ring-brand-500 outline-none" />
                            </div>
                        </div>

                        {viewMode === 'board' ? (
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex gap-6 min-w-[1000px] h-full pb-4">
                                    {columns.map(col => (
                                        <div key={col.id} className="flex-1 min-w-[280px] bg-slate-100/50 rounded-xl flex flex-col max-h-[calc(100vh-250px)]">
                                            <div className="p-4 border-t-4 border-slate-300 bg-slate-100 rounded-t-xl flex justify-between items-center">
                                                <h3 className="font-bold text-slate-700 text-sm">{col.name}</h3>
                                                <span className="bg-white text-slate-500 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                    {tasks.filter(t => t.columnId === col.id).length}
                                                </span>
                                            </div>
                                            <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                                                {tasks.filter(t => t.columnId === col.id).sort((a, b) => a.position - b.position).map(t => (
                                                    <div key={t.id} onClick={() => setSelectedTask(t)} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md cursor-pointer transition-all group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{t.code}</span>
                                                            <div className={`w-2 h-2 rounded-full ${t.priority === 'URGENT' ? 'bg-red-500' : t.priority === 'HIGH' ? 'bg-orange-500' : t.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-300'
                                                                }`}></div>
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-slate-800 mb-3 leading-snug group-hover:text-brand-600">{t.title}</h4>

                                                        {/* Checklist Progress */}
                                                        {t.checklist && t.checklist.length > 0 && (
                                                            <div className="mb-3">
                                                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                                    <span>Checklist</span>
                                                                    <span>{Math.round((t.checklist.filter(i => i.isCompleted).length / t.checklist.length) * 100)}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-100 rounded-full h-1">
                                                                    <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${(t.checklist.filter(i => i.isCompleted).length / t.checklist.length) * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-center mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <img src={t.assigneeAvatar || 'https://via.placeholder.com/20'} className="w-5 h-5 rounded-full" alt="" />
                                                                <span className="text-xs text-slate-500 truncate max-w-[80px]">{t.assigneeName}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">{t.dueDate}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        setSelectedColumnForNewTask(col.id);
                                                        setIsCreateTaskModalOpen(true);
                                                    }}
                                                    className="w-full py-2 text-slate-500 text-sm font-medium hover:bg-slate-200 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 transition-colors"
                                                >
                                                    + Thêm thẻ
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã Task</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tiêu đề</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người làm</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hạn chót</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {tasks.map((task) => {
                                            const colName = columns.find(c => c.id === task.columnId)?.name || 'Unknown';
                                            return (
                                                <tr key={task.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedTask(task)}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">{task.code}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                            {colName}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <img src={task.assigneeAvatar} className="w-6 h-6 rounded-full" alt="" />
                                                            <span className="text-sm text-slate-600">{task.assigneeName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {task.dueDate}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        </>
                        )}
                    </div>
                )}


                {activeTab === 'team' && (
                    <div className="animate-fadeIn">
                        {membersLoading ? (
                            <LoadingSpinner size="md" text="Đang tải danh sách thành viên..." />
                        ) : membersError ? (
                            <ErrorMessage message={membersError} onRetry={refreshMembers} />
                        ) : (
                        <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Thành viên dự án ({members.length})</h3>
                            <Button onClick={() => setShowAddMemberModal(true)}>
                                <UserPlus size={18} className="mr-2" /> Thêm thành viên
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map(member => (
                                <div key={member.userId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                                    <img 
                                        src={member.userAvatar || 'https://via.placeholder.com/48'} 
                                        alt={member.userName || 'User'} 
                                        className="w-12 h-12 rounded-full object-cover border border-slate-100" 
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 truncate">{member.userName || 'Unknown'}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                member.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' :
                                                member.role === 'LEADER' ? 'bg-blue-100 text-blue-700' :
                                                member.role === 'MEMBER' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {member.role === 'MANAGER' ? 'Quản lý' :
                                                 member.role === 'LEADER' ? 'Trưởng nhóm' :
                                                 member.role === 'MEMBER' ? 'Thành viên' : 'Người xem'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-brand-600 font-medium mb-1 truncate">{member.userPosition || 'N/A'}</p>
                                        <p className="text-xs text-slate-500 mb-3 truncate">{member.userDepartment || 'N/A'}</p>

                                        <div className="flex gap-2">
                                            {member.userEmail && (
                                                <a 
                                                    href={`mailto:${member.userEmail}`}
                                                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                                                    title="Gửi email"
                                                >
                                                    <Mail size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <button className="text-slate-300 hover:text-slate-500">
                                            <MoreVertical size={18} />
                                        </button>
                                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                            <button
                                                onClick={() => {
                                                    const newRole = member.role === 'MANAGER' ? 'LEADER' :
                                                                   member.role === 'LEADER' ? 'MEMBER' :
                                                                   member.role === 'MEMBER' ? 'VIEWER' : 'MEMBER';
                                                    updateMemberRole(member.userId, newRole);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                Đổi vai trò
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Bạn có chắc muốn xóa ${member.userName} khỏi dự án?`)) {
                                                        removeMember(member.userId);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Xóa khỏi dự án
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    <UserPlus size={48} className="mx-auto mb-4 text-slate-300" />
                                    <p>Chưa có thành viên nào trong dự án</p>
                                    <Button onClick={() => setShowAddMemberModal(true)} className="mt-4">
                                        <UserPlus size={16} className="mr-2" /> Thêm thành viên đầu tiên
                                    </Button>
                                </div>
                            )}
                        </div>
                        </>
                        )}
                        
                        {showAddMemberModal && (
                            <AddMemberModal
                                projectId={project.id}
                                existingMemberIds={members.map(m => m.userId)}
                                onAdd={addMember}
                                onClose={() => setShowAddMemberModal(false)}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="animate-fadeIn">
                        {resourcesHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải tài nguyên..." />
                        ) : resourcesHook.error ? (
                            <ErrorMessage message={resourcesHook.error} onRetry={resourcesHook.refresh} />
                        ) : (
                            <ResourceManager 
                                projectId={project.id}
                                resources={resourcesHook.resources}
                                onUpload={resourcesHook.uploadResource}
                                onApprove={resourcesHook.approveResource}
                                onReject={resourcesHook.rejectResource}
                                onDelete={resourcesHook.deleteResource}
                                isManager={true}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'phases' && (
                    <div className="animate-fadeIn">
                        {phasesHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải giai đoạn..." />
                        ) : phasesHook.error ? (
                            <ErrorMessage message={phasesHook.error} onRetry={phasesHook.refresh} />
                        ) : (
                            <PhaseTracker 
                                phases={phasesHook.phases}
                                onTransition={phasesHook.transitionPhase}
                                onBlock={phasesHook.blockPhase}
                                onUnblock={phasesHook.unblockPhase}
                                canTransition={phasesHook.canTransition}
                                missingRequirements={phasesHook.missingRequirements}
                                isManager={true}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'tech-stack' && (
                    <div className="animate-fadeIn">
                        {techStackHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải tech stack..." />
                        ) : techStackHook.error ? (
                            <ErrorMessage message={techStackHook.error} onRetry={techStackHook.refresh} />
                        ) : (
                            <TechStackSelector 
                                projectId={project.id}
                                items={techStackHook.items}
                                isLocked={techStackHook.isLocked}
                                userRole="MANAGER"
                                onAddItem={techStackHook.addItem}
                                onUpdateItem={techStackHook.updateItem}
                                onDeleteItem={techStackHook.deleteItem}
                                onLock={techStackHook.lockTechStack}
                                onUnlock={techStackHook.unlockTechStack}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'environments' && (
                    <div className="animate-fadeIn">
                        {environmentsHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải môi trường..." />
                        ) : environmentsHook.error ? (
                            <ErrorMessage message={environmentsHook.error} onRetry={environmentsHook.refresh} />
                        ) : (
                            <EnvironmentManager 
                                environments={environmentsHook.environments}
                                onDeploy={environmentsHook.deploy}
                                onRollback={environmentsHook.rollback}
                                onUpdateEnv={environmentsHook.updateEnvironment}
                                deploymentReadiness={environmentsHook.readiness}
                                currentUserId="current-user-id"
                                isManager={true}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'design-review' && (
                    <div className="animate-fadeIn">
                        {designReviewsHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải design reviews..." />
                        ) : designReviewsHook.error ? (
                            <ErrorMessage message={designReviewsHook.error} onRetry={designReviewsHook.refresh} />
                        ) : (
                            <DesignReview 
                                reviews={designReviewsHook.reviews}
                                onApprove={designReviewsHook.approveReview}
                                onReject={designReviewsHook.rejectReview}
                                onRequestChanges={designReviewsHook.requestChanges}
                                onCreateReview={designReviewsHook.createReview}
                                canReview={true}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'testing' && (
                    <div className="animate-fadeIn">
                        {bugReportsHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải bug reports..." />
                        ) : bugReportsHook.error ? (
                            <ErrorMessage message={bugReportsHook.error} onRetry={bugReportsHook.refresh} />
                        ) : (
                            <TestingModule 
                                bugs={bugReportsHook.bugs}
                                stats={bugReportsHook.stats}
                                onCreateBug={bugReportsHook.createBug}
                                onUpdateStatus={bugReportsHook.updateStatus}
                                onAssign={bugReportsHook.assignBug}
                                users={users}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'uat' && (
                    <div className="animate-fadeIn">
                        {uatHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải UAT..." />
                        ) : uatHook.error ? (
                            <ErrorMessage message={uatHook.error} onRetry={uatHook.refresh} />
                        ) : (
                            <UATModule 
                                feedback={uatHook.feedback}
                                signoffs={uatHook.signoffs}
                                stagingUrl={environmentsHook.environments.find(e => e.envType === 'STAGING')?.url}
                                status={uatHook.status}
                                onAddFeedback={uatHook.addFeedback}
                                onUpdateFeedbackStatus={uatHook.updateFeedbackStatus}
                                onCreateSignoff={uatHook.createSignoff}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'go-live' && (
                    <div className="animate-fadeIn space-y-8">
                        {goLiveHook.loading ? (
                            <LoadingSpinner size="md" text="Đang tải go-live checklist..." />
                        ) : goLiveHook.error ? (
                            <ErrorMessage message={goLiveHook.error} onRetry={goLiveHook.refresh} />
                        ) : (
                            <>
                                <GoLiveChecklist 
                                    checklist={goLiveHook.checklist}
                                    readiness={goLiveHook.readiness}
                                />
                                {goLiveHook.warranty && (
                                    <HandoverModule 
                                        documents={goLiveHook.documents}
                                        warranty={goLiveHook.warranty}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="animate-fadeIn">
                        <ExportModule 
                            projectId={project.id}
                            onExportJSON={exportHook.exportJSON}
                            onExportCSV={exportHook.exportCSV}
                            onExportPDF={exportHook.exportPDF}
                            onImport={exportHook.importProject}
                            loading={exportHook.loading}
                        />
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Tài liệu dự án</h3>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input type="text" placeholder="Tìm kiếm file..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-64" />
                                    <div className="absolute left-3 top-2.5 text-slate-400">
                                        <Search size={16} />
                                    </div>
                                </div>
                                <Button><Plus size={18} className="mr-2" /> Tải lên</Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tên file</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kích thước</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người tải lên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ngày tải</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {MOCK_PROJECT_FILES.map(file => (
                                        <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${file.type === 'pdf' ? 'bg-red-50 text-red-600' :
                                                        file.type === 'zip' ? 'bg-yellow-50 text-yellow-600' :
                                                            file.type === 'image' ? 'bg-purple-50 text-purple-600' :
                                                                file.type === 'xls' ? 'bg-green-50 text-green-600' :
                                                                    'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {file.type === 'image' ? <Image size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors cursor-pointer">{file.name}</p>
                                                        <p className="text-xs text-slate-500 uppercase">{file.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{file.size}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {file.uploader.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-slate-900">{file.uploader}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{file.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md" title="Download">
                                                        <Download size={16} />
                                                    </button>
                                                    <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
