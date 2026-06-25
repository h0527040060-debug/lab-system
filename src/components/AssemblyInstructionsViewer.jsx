import { useState } from 'react';
import Modal from './Modal';
import { BookOpen, PlayCircle, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AssemblyInstructionsViewer({ part, onClose }) {
  const [imageIdx, setImageIdx] = useState(0);
  const instructions = part?.assembly_instructions;

  if (!instructions) return null;

  const images = instructions.images || [];
  const hasImages = images.length > 0;
  const hasVideo = !!instructions.video_url;
  const hasText = !!instructions.text;

  if (!hasText && !hasImages && !hasVideo) return null;

  const getYoutubeEmbed = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`הוראות הרכבה — ${part.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {hasText && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
              <BookOpen size={16} />
              הוראות
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{instructions.text}</p>
          </div>
        )}

        {hasVideo && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold text-sm">
              <PlayCircle size={16} />
              סרטון הדרכה
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={getYoutubeEmbed(instructions.video_url)}
                className="w-full h-full"
                allowFullScreen
                title="הוראות הרכבה"
              />
            </div>
          </div>
        )}

        {hasImages && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                תמונות ({imageIdx + 1}/{images.length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setImageIdx(i => Math.max(0, i - 1))}
                  disabled={imageIdx === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setImageIdx(i => Math.min(images.length - 1, i + 1))}
                  disabled={imageIdx === images.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>
            </div>
            <div className="bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: 240 }}>
              <img
                src={images[imageIdx]}
                alt={`הוראה ${imageIdx + 1}`}
                className="max-w-full max-h-80 object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImageIdx(idx)}
                    className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden ${idx === imageIdx ? 'border-orange-500' : 'border-slate-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
