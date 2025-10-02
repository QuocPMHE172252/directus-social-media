"use client";

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export function PostComposer() {
const router = useRouter();
const fileInputRef = useRef<HTMLInputElement>(null);
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [filePreview, setFilePreview] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (file) {
setSelectedFile(file);

// Tạo preview cho ảnh
if (file.type.startsWith('image/')) {
const reader = new FileReader();
reader.onload = (e) => {
setFilePreview(e.target?.result as string);
};
reader.readAsDataURL(file);
} else {
setFilePreview(null);
}
}
};

const removeFile = () => {
setSelectedFile(null);
setFilePreview(null);
if (fileInputRef.current) {
fileInputRef.current.value = '';
}
};

async function onSubmit(e: FormEvent) {
e.preventDefault();
setSubmitting(true);
setError(null);

try {
let uploadedFileId = null;

// Upload file nếu có
if (selectedFile) {
const formData = new FormData();
formData.append('file', selectedFile);

const uploadRes = await fetch('/api/upload', {
method: 'POST',
body: formData,
});

if (!uploadRes.ok) {
throw new Error('Failed to upload file');
}

const uploadData = await uploadRes.json();
uploadedFileId = uploadData.id;
}

// Tạo post
const res = await fetch('/api/posts', {
method: 'POST',
headers: { 'content-type': 'application/json' },
body: JSON.stringify({ 
title: title || null, 
content: content || null,
image: uploadedFileId
}),
});

if (!res.ok) {
const msg = await res.text();
throw new Error(msg || 'Failed to create post');
}

// Reset form
setTitle('');
setContent('');
setSelectedFile(null);
setFilePreview(null);
if (fileInputRef.current) {
fileInputRef.current.value = '';
}

// Refresh
router.refresh();
setTimeout(() => {
window.location.reload();
}, 1000);
} catch (err: any) {
setError(err.message || 'Error');
} finally {
setSubmitting(false);
}
}

return (
<form onSubmit={onSubmit} className="rounded-md border p-4 space-y-3">
<h2 className="text-base font-semibold">Create Post</h2>

<input
type="text"
placeholder="Title (optional)"
value={title}
onChange={(e) => setTitle(e.target.value)}
className="w-full rounded-md border px-3 py-2 text-sm"
/>

<textarea
placeholder="What's on your mind?"
value={content}
onChange={(e) => setContent(e.target.value)}
className="w-full min-h-[100px] rounded-md border px-3 py-2 text-sm"
/>

{/* File Upload Section */}
<div className="space-y-2">
<input
ref={fileInputRef}
type="file"
accept="image/*,video/*"
onChange={handleFileSelect}
className="hidden"
/>

<div className="flex items-center gap-2">
<button
type="button"
onClick={() => fileInputRef.current?.click()}
className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
>
 Attach File
</button>
<span className="text-xs text-gray-500">
Images & Videos (max 50MB)
</span>
</div>

{/* File Preview */}
{selectedFile && (
<div className="relative">
{filePreview ? (
<div className="relative">
<Image
src={filePreview}
alt="Preview"
width={200}
height={200}
className="object-cover rounded-md"
/>
<button
type="button"
onClick={removeFile}
className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
>

</button>
</div>
) : (
<div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
<span className="text-sm"> {selectedFile.name}</span>
<button
type="button"
onClick={removeFile}
className="text-red-500 text-sm"
>
Remove
</button>
</div>
)}
</div>
)}
</div>

<div className="flex items-center gap-3">
<button
type="submit"
disabled={submitting || (!title && !content && !selectedFile)}
className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
>
{submitting ? 'Posting' : 'Post'}
</button>
{error ? <span className="text-sm text-red-600">{error}</span> : null}
</div>
</form>
);
}
