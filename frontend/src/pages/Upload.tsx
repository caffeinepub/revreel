import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload as UploadIcon, Film, Image, X, Tag, Loader2 } from 'lucide-react';
import { ExternalBlob, Variant_video_photo } from '../backend';
import { useUploadVideo } from '../hooks/useQueries';
import AuthGuard from '../components/AuthGuard';

const CATEGORIES = [
  'Drift', 'Drag Racing', 'Track Day', 'Car Show',
  'Build', 'Off-Road', 'Street', 'Other'
];

type MediaType = 'reel' | 'photo';

export default function Upload() {
  const navigate = useNavigate();
  const [mediaType, setMediaType] = useState<MediaType>('reel');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const uploadVideo = useUploadVideo();

  const isPhoto = mediaType === 'photo';

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const url = URL.createObjectURL(file);
    setThumbnailPreviewUrl(url);
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ' ' || e.key === ',') && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mediaFile) {
      setError(`Please select a ${isPhoto ? 'photo' : 'video'} to upload.`);
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }

    try {
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const mediaBlob = ExternalBlob.fromBytes(mediaBytes).withUploadProgress(
        (pct) => setUploadProgress(pct)
      );

      let thumbnailBlob: ExternalBlob;
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress(
          (pct) => setThumbnailProgress(pct)
        );
      } else {
        // Use a placeholder thumbnail
        thumbnailBlob = ExternalBlob.fromURL('/assets/generated/placeholder-thumb.dim_640x360.png');
      }

      const backendMediaType = isPhoto ? Variant_video_photo.photo : Variant_video_photo.video;

      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        hashtags,
        category,
        thumbnailBlob,
        videoBlob: mediaBlob,
        mediaType: backendMediaType,
      });

      navigate({ to: '/feed' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-lg mx-auto px-4">
          <h1 className="text-3xl font-display font-bold text-foreground mb-6">
            Upload
          </h1>

          {/* Media Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border mb-6 bg-card">
            <button
              type="button"
              onClick={() => {
                setMediaType('reel');
                setMediaFile(null);
                setPreviewUrl(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold transition-colors ${
                mediaType === 'reel'
                  ? 'bg-neon-orange text-black'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Film size={20} />
              Reel
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('photo');
                setMediaFile(null);
                setPreviewUrl(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold transition-colors ${
                mediaType === 'photo'
                  ? 'bg-neon-orange text-black'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Image size={20} />
              Photo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Media Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                {isPhoto ? 'Photo' : 'Video'} *
              </label>
              <div
                onClick={() => mediaInputRef.current?.click()}
                className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-neon-orange/60 transition-colors bg-card"
                style={{ minHeight: '200px' }}
              >
                {previewUrl ? (
                  isPhoto ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      className="w-full h-64 object-cover"
                      muted
                      playsInline
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                    {isPhoto ? <Image size={40} /> : <Film size={40} />}
                    <span className="text-base font-medium">
                      Tap to select {isPhoto ? 'a photo' : 'a video'}
                    </span>
                    <span className="text-sm">
                      {isPhoto ? 'JPEG, PNG, WebP' : 'MP4, MOV, WebM'}
                    </span>
                  </div>
                )}
                {previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <input
                ref={mediaInputRef}
                type="file"
                accept={isPhoto ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime,video/webm'}
                onChange={handleMediaSelect}
                className="hidden"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Uploading {isPhoto ? 'photo' : 'video'}...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-orange rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail (optional for photos, shown for reels) */}
            {!isPhoto && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Thumbnail (optional)
                </label>
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-neon-orange/60 transition-colors bg-card"
                >
                  {thumbnailPreviewUrl ? (
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-28 gap-2 text-muted-foreground">
                      <Image size={28} />
                      <span className="text-sm font-medium">Tap to add thumbnail</span>
                    </div>
                  )}
                  {thumbnailPreviewUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailFile(null);
                        setThumbnailPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                />
                {thumbnailProgress > 0 && thumbnailProgress < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Uploading thumbnail...</span>
                      <span>{thumbnailProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-orange rounded-full transition-all"
                        style={{ width: `${thumbnailProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isPhoto ? 'Give your photo a title...' : 'Give your reel a title...'}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange text-base"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell the story behind this..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange resize-none text-base"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-3 px-2 rounded-xl text-sm font-bold transition-colors ${
                      category === cat
                        ? 'bg-neon-orange text-black'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-neon-orange/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                <Tag size={14} className="inline mr-1" />
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon-orange/20 border border-neon-orange/40 text-neon-orange text-sm font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="ml-1 hover:text-white transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={hashtagInput}
                onChange={e => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Type a tag and press Enter..."
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange text-base"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploadVideo.isPending}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-neon-orange text-black font-bold text-lg hover:bg-neon-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadVideo.isPending ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon size={22} />
                  Post {isPhoto ? 'Photo' : 'Reel'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
