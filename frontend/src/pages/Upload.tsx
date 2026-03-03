import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateVideo } from '../hooks/useQueries';
import { ExternalBlob, Variant_video_photo } from '../backend';
import { Loader2, Upload as UploadIcon, Image, Film, X } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const CATEGORIES = [
  'Drift', 'Drag', 'Track', 'Show', 'Build', 'Street', 'Off-Road', 'Other',
];

export default function Upload() {
  const { identity } = useInternetIdentity();
  const createVideo = useCreateVideo();
  const navigate = useNavigate();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [thumbPreview, setThumbPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<Variant_video_photo>(Variant_video_photo.video);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [hashtags, setHashtags] = useState('');
  const [mediaProgress, setMediaProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? Variant_video_photo.video : Variant_video_photo.photo);
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error('Please log in to upload');
      return;
    }
    if (!mediaFile) {
      toast.error('Please select a media file');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsUploading(true);
    setMediaProgress(0);
    setThumbProgress(0);

    try {
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(mediaBytes);

      let thumbBlob: ExternalBlob;
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbBlob = ExternalBlob.fromBytes(thumbBytes);
      } else {
        thumbBlob = ExternalBlob.fromURL('/assets/generated/placeholder-thumb.dim_640x360.png');
      }

      const tags = hashtags
        .split(/[\s,#]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      await createVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        hashtags: tags,
        video: videoBlob,
        thumbnail: thumbBlob,
        mediaType,
        onMediaProgress: setMediaProgress,
        onThumbnailProgress: setThumbProgress,
      });

      toast.success('Reel uploaded successfully!');
      navigate({ to: '/feed' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      if (msg.includes('Unauthorized') || msg.includes('unauthorized')) {
        toast.error('You must be logged in to upload');
      } else if (msg.includes('size') || msg.includes('large')) {
        toast.error('File is too large. Please try a smaller file.');
      } else if (msg.includes('format') || msg.includes('type')) {
        toast.error('Unsupported file format.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <UploadIcon className="w-12 h-12 text-neon-orange/50" />
        <p className="text-white/60">Please log in to upload reels.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-white pb-24 px-4 pt-6">
      <h1 className="text-2xl font-display font-bold text-neon-orange mb-6">Upload Reel</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Media picker */}
        <div
          className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-neon-orange/50 transition-colors"
          onClick={() => mediaInputRef.current?.click()}
        >
          {mediaPreview ? (
            <div className="relative w-full max-h-48 overflow-hidden rounded-lg">
              {mediaType === Variant_video_photo.video ? (
                <video src={mediaPreview} className="w-full max-h-48 object-contain" muted />
              ) : (
                <img src={mediaPreview} alt="preview" className="w-full max-h-48 object-contain" />
              )}
              <button
                type="button"
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaFile(null);
                  setMediaPreview('');
                }}
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3">
                <Film className="w-8 h-8 text-neon-orange/60" />
                <Image className="w-8 h-8 text-neon-orange/60" />
              </div>
              <p className="text-white/60 text-sm">Tap to select video or photo</p>
            </>
          )}
          <input
            ref={mediaInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={handleMediaChange}
          />
        </div>

        {/* Thumbnail picker */}
        <div
          className="border border-white/10 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-neon-orange/30 transition-colors"
          onClick={() => thumbInputRef.current?.click()}
        >
          {thumbPreview ? (
            <img src={thumbPreview} alt="thumb" className="w-16 h-10 object-cover rounded" />
          ) : (
            <div className="w-16 h-10 bg-white/10 rounded flex items-center justify-center">
              <Image className="w-5 h-5 text-white/40" />
            </div>
          )}
          <p className="text-white/60 text-sm">
            {thumbnailFile ? thumbnailFile.name : 'Select thumbnail (optional)'}
          </p>
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleThumbChange}
          />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-white/70 text-sm">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your reel a title…"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-white/70 text-sm">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your reel…"
            rows={3}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-white/70 text-sm">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  category === cat
                    ? 'bg-neon-orange text-black border-neon-orange'
                    : 'border-white/20 text-white/70 hover:border-neon-orange/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-1">
          <label className="text-white/70 text-sm">Hashtags</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="drift, turbo, jdm (comma or space separated)"
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange"
          />
        </div>

        {/* Progress bars */}
        {isUploading && (
          <div className="space-y-2">
            <div>
              <p className="text-white/60 text-xs mb-1">Media upload: {mediaProgress}%</p>
              <Progress value={mediaProgress} className="h-1.5" />
            </div>
            {thumbnailFile && (
              <div>
                <p className="text-white/60 text-xs mb-1">Thumbnail: {thumbProgress}%</p>
                <Progress value={thumbProgress} className="h-1.5" />
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isUploading || !mediaFile || !title.trim()}
          className="w-full bg-neon-orange text-black font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
          ) : (
            <><UploadIcon className="w-5 h-5" /> Post Reel</>
          )}
        </button>
      </form>
    </div>
  );
}
