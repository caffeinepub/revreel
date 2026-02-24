import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload as UploadIcon, Video, Image, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUploadVideo } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'drag', label: '🏁 Drag Racing' },
  { value: 'drift', label: '💨 Drift' },
  { value: 'jdm', label: '🇯🇵 JDM' },
  { value: 'muscle', label: '💪 Muscle Cars' },
  { value: 'supercar', label: '🏎️ Supercars' },
  { value: 'offroad', label: '🏔️ Off-Road' },
  { value: 'daily', label: '🚗 Daily Drivers' },
  { value: 'tuner', label: '🔧 Tuner Builds' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const uploadVideo = useUploadVideo();

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setThumbnailFile(file);
    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !title || !category) {
      toast.error('Please fill in all required fields and select a video');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert video file to bytes
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((pct) => {
        setUploadProgress(Math.round(pct * 0.7)); // 0-70% for video
      });

      // Convert thumbnail or use default
      let thumbnailBlob: ExternalBlob;
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress((pct) => {
          setUploadProgress(70 + Math.round(pct * 0.3)); // 70-100% for thumbnail
        });
      } else {
        thumbnailBlob = ExternalBlob.fromURL(`${window.location.origin}/assets/generated/placeholder-thumb.dim_640x360.png`);
        setUploadProgress(100);
      }

      await uploadVideo.mutateAsync({
        title,
        description,
        hashtags,
        category,
        thumbnailBlob,
        videoBlob,
      });

      toast.success('Reel uploaded! 🔥');
      navigate({ to: '/' });
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isValid = !!videoFile && !!title.trim() && !!category;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6 border-b border-border">
        <h1 className="font-display text-3xl text-foreground">DROP A REEL</h1>
        <p className="text-muted-foreground text-sm mt-1">Share your best racing moments</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-6 mt-6">
        {/* Video Upload */}
        <div className="space-y-2">
          <Label className="font-display text-sm text-foreground">VIDEO *</Label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />
          {videoPreview ? (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[9/16] max-h-64">
              <video
                src={videoPreview}
                className="w-full h-full object-cover"
                controls
                muted
              />
              <button
                type="button"
                onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="w-full aspect-video max-h-48 rounded-lg border-2 border-dashed border-border hover:border-neon/50 bg-card flex flex-col items-center justify-center gap-3 transition-colors group"
            >
              <Video className="w-10 h-10 text-muted-foreground group-hover:text-neon transition-colors" />
              <span className="font-display text-sm text-muted-foreground group-hover:text-foreground">
                TAP TO SELECT VIDEO
              </span>
            </button>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-2">
          <Label className="font-display text-sm text-foreground">THUMBNAIL (optional)</Label>
          <input
            ref={thumbInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
          {thumbnailPreview ? (
            <div className="relative rounded-lg overflow-hidden bg-black w-32 h-20">
              <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbInputRef.current?.click()}
              className="w-32 h-20 rounded-lg border-2 border-dashed border-border hover:border-neon/50 bg-card flex flex-col items-center justify-center gap-1 transition-colors group"
            >
              <Image className="w-6 h-6 text-muted-foreground group-hover:text-neon transition-colors" />
              <span className="font-display text-[10px] text-muted-foreground">ADD THUMB</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-display text-sm text-foreground">TITLE *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 10-second quarter mile run 🔥"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            maxLength={80}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="font-display text-sm text-foreground">DESCRIPTION</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about this clip..."
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            rows={3}
            maxLength={300}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="font-display text-sm text-foreground">CATEGORY *</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2.5 rounded-lg text-sm font-display text-left transition-all border ${
                  category === cat.value
                    ? 'bg-neon/20 border-neon text-neon neon-border'
                    : 'bg-secondary border-border text-foreground hover:border-neon/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label className="font-display text-sm text-foreground">HASHTAGS</Label>
          <div className="flex gap-2">
            <Input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              placeholder="#drift #jdm #racing"
              className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              maxLength={30}
            />
            <Button
              type="button"
              onClick={addHashtag}
              variant="outline"
              size="icon"
              className="border-border hover:border-neon/50 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-neon/10 text-neon border border-neon/30 font-display text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                  onClick={() => removeHashtag(tag)}
                >
                  #{tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-foreground">UPLOADING...</span>
              <span className="font-display text-sm text-neon">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isValid || isUploading}
          className="w-full bg-neon text-primary-foreground font-display text-lg py-6 hover:bg-neon/90 neon-glow disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              UPLOADING...
            </>
          ) : (
            <>
              <UploadIcon className="w-5 h-5 mr-2" />
              DROP THE REEL 🔥
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
