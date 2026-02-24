import { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload as UploadIcon, X, Film, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useUploadVideo } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  'Drift',
  'Drag Racing',
  'Track Day',
  'Car Meet',
  'Build Reveal',
  'Street',
  'Off-Road',
  'Burnout',
  'Stance',
  'JDM',
  'Muscle',
  'Euro',
  'Other',
];

type MediaType = 'video' | 'photo';

export default function Upload() {
  const navigate = useNavigate();
  const uploadVideo = useUploadVideo();

  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const mediaPreviewUrl = mediaFile ? URL.createObjectURL(mediaFile) : null;
  const thumbnailPreviewUrl = thumbnailFile ? URL.createObjectURL(thumbnailFile) : null;

  const isFormValid = !!mediaFile && title.trim().length > 0 && category.length > 0;
  const isUploading = uploadVideo.isPending;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setError(null);
    // Auto-detect media type
    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setMediaType('photo');
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isUploading) return;

    setError(null);
    setUploadProgress(0);
    setThumbnailProgress(0);

    try {
      const mediaBytes = new Uint8Array(await mediaFile!.arrayBuffer());
      const mediaBlob = ExternalBlob.fromBytes(mediaBytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      let thumbnailBlob: ExternalBlob;
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress((pct) => {
          setThumbnailProgress(pct);
        });
      } else {
        // Use a placeholder thumbnail
        thumbnailBlob = ExternalBlob.fromURL('/assets/generated/placeholder-thumb.dim_640x360.png');
      }

      const hashtagList = hashtags
        .split(/[\s,#]+/)
        .map((h) => h.trim().toLowerCase())
        .filter((h) => h.length > 0);

      await uploadVideo.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        hashtags: hashtagList,
        mediaUrl: mediaBlob,
        thumbnail: thumbnailBlob,
        mediaType: mediaType === 'video' ? { video: null } : { photo: null },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/feed' });
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message || 'Upload failed. Please try again.');
    }
  };

  const handleClearMedia = () => {
    setMediaFile(null);
    setUploadProgress(0);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground tracking-wider uppercase">
              Upload
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Share your reel or photo with the RevReel community
            </p>
          </div>

          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="font-display text-xl font-bold text-foreground">Upload Successful!</p>
              <p className="text-muted-foreground text-sm">Redirecting to feed…</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Media Type Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    mediaType === 'video'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Film className="h-4 w-4" />
                  Reel / Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('photo')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    mediaType === 'photo'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Image className="h-4 w-4" />
                  Photo
                </button>
              </div>

              {/* Media File Picker */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-2 block">
                  {mediaType === 'video' ? 'Video File *' : 'Photo File *'}
                </Label>

                {/* Hidden file input */}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleMediaSelect}
                  className="hidden"
                  id="media-file-input"
                />

                {!mediaFile ? (
                  <div className="space-y-3">
                    {/* Click area */}
                    <div
                      onClick={() => mediaInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50"
                    >
                      <UploadIcon className="h-10 w-10 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Click to select {mediaType === 'video' ? 'a video' : 'a photo'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mediaType === 'video'
                            ? 'MP4, MOV, WebM, AVI supported'
                            : 'JPG, PNG, WebP, GIF supported'}
                        </p>
                      </div>
                    </div>
                    {/* Explicit button as fallback */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => mediaInputRef.current?.click()}
                    >
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Choose {mediaType === 'video' ? 'Video' : 'Photo'} File
                    </Button>
                    {/* Also expose the label for native file picker */}
                    <label
                      htmlFor="media-file-input"
                      className="block text-center text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    >
                      or tap here to browse files
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden bg-muted border border-border">
                    {mediaType === 'video' && mediaPreviewUrl ? (
                      <video
                        src={mediaPreviewUrl}
                        className="w-full max-h-48 object-cover"
                        controls
                        muted
                      />
                    ) : mediaPreviewUrl ? (
                      <img
                        src={mediaPreviewUrl}
                        alt="Preview"
                        className="w-full max-h-48 object-cover"
                      />
                    ) : null}
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{mediaFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearMedia}
                        className="ml-2 p-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-foreground mb-2 block">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a title…"
                  maxLength={100}
                  className="bg-muted/50 border-border"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-foreground mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the community about this post…"
                  rows={3}
                  maxLength={500}
                  className="bg-muted/50 border-border resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-2 block">
                  Category *
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        category === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <Label htmlFor="hashtags" className="text-sm font-semibold text-foreground mb-2 block">
                  Hashtags
                </Label>
                <Input
                  id="hashtags"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#drift #jdm #turbo"
                  className="bg-muted/50 border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate with spaces or commas</p>
              </div>

              {/* Thumbnail (optional) */}
              <div>
                <Label className="text-sm font-semibold text-foreground mb-2 block">
                  Thumbnail <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  className="hidden"
                  id="thumbnail-file-input"
                />
                {!thumbnailFile ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Choose Thumbnail
                    </Button>
                    <label
                      htmlFor="thumbnail-file-input"
                      className="flex items-center justify-center px-4 py-2 rounded-md border border-border text-sm text-muted-foreground cursor-pointer hover:bg-muted transition-colors"
                    >
                      Browse
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
                    {thumbnailPreviewUrl && (
                      <img
                        src={thumbnailPreviewUrl}
                        alt="Thumbnail"
                        className="h-12 w-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{thumbnailFile.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                      }}
                      className="p-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Uploading media…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                  {thumbnailFile && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Uploading thumbnail…</span>
                        <span>{thumbnailProgress}%</span>
                      </div>
                      <Progress value={thumbnailProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 pb-6">
                <Button
                  type="submit"
                  disabled={!isFormValid || isUploading}
                  className="w-full h-12 text-base font-bold font-display tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-5 w-5 mr-2" />
                      {mediaType === 'video' ? 'Post Reel' : 'Post Photo'}
                    </>
                  )}
                </Button>

                {!isFormValid && !isUploading && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    {!mediaFile
                      ? `Select a ${mediaType === 'video' ? 'video' : 'photo'} file to continue`
                      : !title.trim()
                      ? 'Add a title to continue'
                      : 'Select a category to continue'}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
