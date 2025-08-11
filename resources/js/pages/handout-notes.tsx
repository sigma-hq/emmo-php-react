import { useState, useEffect, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PlusIcon, Pencil, Trash2, Save, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

interface HandoutNote {
    id: number;
    title: string;
    content: string;
    category: string;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    notes: Record<string, HandoutNote[]>;
    currentUser: {
        id: number;
        name: string;
    };
}

const categoryColors = {
    electrical: 'bg-blue-100 text-blue-800 border-blue-200',
    mechanical: 'bg-green-100 text-green-800 border-green-200',
    hydraulic: 'bg-purple-100 text-purple-800 border-purple-200',
    workshop: 'bg-orange-100 text-orange-800 border-orange-200',
    utilities: 'bg-red-100 text-red-800 border-red-200',
};

const categoryLabels = {
    electrical: 'Electrical',
    mechanical: 'Mechanical',
    hydraulic: 'Hydraulic',
    workshop: 'Workshop',
    utilities: 'Utilities',
};

export default function HandoutNotes({ notes, currentUser }: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<HandoutNote | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('electrical');
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Helper function to check if current user can edit/delete a note
    const canManageNote = (note: HandoutNote) => {
        return note.user?.id === currentUser.id;
    };

    // Filter notes based on search term
    const getFilteredNotes = (categoryNotes: HandoutNote[]) => {
        if (!searchTerm.trim()) return categoryNotes;
        
        const searchLower = searchTerm.toLowerCase();
        return categoryNotes.filter(note => 
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.user?.name?.toLowerCase().includes(searchLower)
        );
    };

    // Find the first tab with search results
    const getFirstTabWithResults = () => {
        if (!searchTerm.trim()) return 'electrical';
        
        for (const [categoryKey] of Object.entries(categoryLabels)) {
            const categoryNotes = notes[categoryKey] || [];
            if (getFilteredNotes(categoryNotes).length > 0) {
                return categoryKey;
            }
        }
        return 'electrical';
    };

    // Auto-switch to first tab with results when searching
    useEffect(() => {
        if (searchTerm.trim()) {
            const firstTabWithResults = getFirstTabWithResults();
            if (firstTabWithResults !== activeTab) {
                setActiveTab(firstTabWithResults);
            }
        }
    }, [searchTerm, notes]);

    // Keyboard shortcut to focus search input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Highlight search terms in text
    const highlightSearchTerms = (text: string) => {
        if (!searchTerm.trim()) return text;
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    };

    const createForm = useForm({
        title: '',
        content: '',
        category: '',
    });

    const editForm = useForm({
        title: '',
        content: '',
        category: '',
    });

    const handleCreate = () => {
        createForm.post('/handout-notes', {
            onSuccess: () => {
                createForm.reset();
                setIsCreateDialogOpen(false);
            },
        });
    };

    const handleEdit = (note: HandoutNote) => {
        setEditingNote(note);
        editForm.setData({
            title: note.title,
            content: note.content,
            category: note.category,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = () => {
        if (editingNote) {
            editForm.put(`/handout-notes/${editingNote.id}`, {
                onSuccess: () => {
                    setEditingNote(null);
                    setIsEditDialogOpen(false);
                    editForm.reset();
                },
            });
        }
    };

    const handleDelete = (noteId: number) => {
        if (confirm('Are you sure you want to delete this note?')) {
            useForm().delete(`/handout-notes/${noteId}`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title="Handout Notes" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Handout Notes</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <StickyNote className="h-5 w-5 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Handout Notes</h1>
                </div>
                <p className="text-muted-foreground text-lg">
                    View and manage maintenance notes from all team members, organized by category. Keep track of important information for electrical, mechanical, hydraulic, workshop, and utilities tasks. You can only edit or delete your own notes.
                </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search notes by title, content, or author... (Ctrl+K)"
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            aria-label="Search notes"
                            ref={searchInputRef}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Note
                        </Button>
                    </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Note</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={createForm.data.title}
                                        onChange={(e) => createForm.setData('title', e.target.value)}
                                        placeholder="Enter note title..."
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <Select
                                        value={createForm.data.category}
                                        onValueChange={(value) => createForm.setData('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(categoryLabels).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Note Content</label>
                                    <Textarea
                                        value={createForm.data.content}
                                        onChange={(e) => createForm.setData('content', e.target.value)}
                                        placeholder="Write your note here..."
                                        rows={4}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreate}
                                        disabled={createForm.processing}
                                    >
                                        {createForm.processing ? 'Creating...' : 'Create Note'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

            {/* Search Results Summary */}
            {searchTerm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-blue-800 font-medium">
                            Search Results for "{searchTerm}"
                        </span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                        {(() => {
                            const totalNotes = Object.values(notes).flat().length;
                            const totalResults = Object.values(notes).reduce((acc, categoryNotes) => {
                                return acc + getFilteredNotes(categoryNotes).length;
                            }, 0);
                            return `Found ${totalResults} matching notes out of ${totalNotes} total notes across all categories.`;
                        })()}
                    </p>
                </div>
            )}

            {/* Main Content - Tabs */}
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
                            const categoryNotes = notes[categoryKey] || [];
                            const filteredNotes = getFilteredNotes(categoryNotes);
                            return (
                                <TabsTrigger 
                                    key={categoryKey} 
                                    value={categoryKey}
                                    className="flex items-center gap-2"
                                >
                                    <StickyNote className="h-4 w-4" />
                                    {categoryLabel}
                                    <Badge variant="secondary" className="ml-auto">
                                        {filteredNotes.length}
                                        {searchTerm && filteredNotes.length !== categoryNotes.length && (
                                            <span className="text-xs text-gray-500 ml-1">
                                                /{categoryNotes.length}
                                            </span>
                                        )}
                                    </Badge>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {Object.entries(categoryLabels).map(([categoryKey, categoryLabel]) => {
                        const categoryNotes = notes[categoryKey] || [];
                        const filteredNotes = getFilteredNotes(categoryNotes);
                        return (
                            <TabsContent key={categoryKey} value={categoryKey} className="mt-6">
                                <Card className="shadow-sm border-0">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-lg">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <StickyNote className="h-4 w-4 text-gray-600" />
                                            </div>
                                            {categoryLabel}
                                            <Badge variant="secondary" className="ml-auto">
                                                {filteredNotes.length}
                                                {searchTerm && filteredNotes.length !== categoryNotes.length && (
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        /{categoryNotes.length}
                                                    </span>
                                                )}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {filteredNotes.length === 0 ? (
                                            <div className="text-center py-12">
                                                {searchTerm ? (
                                                    <>
                                                        <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                        <p className="text-muted-foreground text-sm">
                                                            No notes found matching "{searchTerm}".
                                                        </p>
                                                        <p className="text-muted-foreground text-xs mt-1">
                                                            Try adjusting your search terms.
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                                        <p className="text-muted-foreground text-sm">
                                                            No notes in this category yet.
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Create your first note to get started.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredNotes.map((note) => (
                                                    <div
                                                        key={note.id}
                                                        className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <h4 className="font-semibold text-base text-gray-900" 
                                                                        dangerouslySetInnerHTML={{ 
                                                                            __html: highlightSearchTerms(note.title) 
                                                                        }} 
                                                                    />
                                                                    <Badge 
                                                                        variant={canManageNote(note) ? "default" : "outline"} 
                                                                        className={`text-xs ${canManageNote(note) ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}`}
                                                                    >
                                                                        {note.user?.name || 'Unknown User'}
                                                                        {canManageNote(note) && ' (You)'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-3"
                                                                    dangerouslySetInnerHTML={{ 
                                                                        __html: highlightSearchTerms(note.content) 
                                                                    }}
                                                                />
                                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                    <span>Created: {formatDate(note.created_at)}</span>
                                                                    {note.updated_at !== note.created_at && (
                                                                        <span>• Updated: {formatDate(note.updated_at)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {canManageNote(note) && (
                                                                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(note)}
                                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(note.id)}
                                                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                value={editForm.data.title}
                                onChange={(e) => editForm.setData('title', e.target.value)}
                                placeholder="Enter note title..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <Select
                                value={editForm.data.category}
                                onValueChange={(value) => editForm.setData('category', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Note Content</label>
                            <Textarea
                                value={editForm.data.content}
                                onChange={(e) => editForm.setData('content', e.target.value)}
                                placeholder="Write your note here..."
                                rows={4}
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={editForm.processing}
                            >
                                {editForm.processing ? 'Updating...' : 'Update Note'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
