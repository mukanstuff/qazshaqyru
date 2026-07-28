'use client';

import React, { useState, useRef } from 'react';
import { Upload, Music, Play, Pause, Loader2, X, Check } from 'lucide-react';
import { uploadMusicFile } from '@/lib/uploads/upload-client';
import { useI18n } from '@/i18n';

interface Track {
  id: string;
  titleKey: string;
  artist: string;
  url: string;
}

const FREE_TRACKS: Track[] = [
  { id: 'romantic-piano', titleKey: 'invitation.edit.musicTrackRomanticPiano', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946ba7b401.mp3' },
  { id: 'wedding-march', titleKey: 'invitation.edit.musicTrackWeddingMarch', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5b6e7f0b8.mp3' },
  { id: 'soft-strings', titleKey: 'invitation.edit.musicTrackSoftStrings', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3' },
  { id: 'love-story', titleKey: 'invitation.edit.musicTrackLoveStory', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2024/02/14/audio_4c1e4c5b32.mp3' },
  { id: 'wedding-bells', titleKey: 'invitation.edit.musicTrackWeddingBells', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2022/08/23/audio_8ad99cdf1d.mp3' },
  { id: 'kazakh-national', titleKey: 'invitation.edit.musicTrackKazakhNational', artist: 'Pixabay', url: 'https://cdn.pixabay.com/audio/2023/03/09/audio_962f68c0f5.mp3' },
];
interface MusicPanelProps {
  currentMusicUrl?: string | null;
  onSelectMusic: (url: string | null) => void;
  onClose: () => void;
  invitationId?: string;
}

export function MusicPanel({ currentMusicUrl, onSelectMusic, onClose, invitationId }: MusicPanelProps) {
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const res = await uploadMusicFile(file, invitationId);
      if (!res.success || !res.url) {
        throw new Error(res.message || t('common.uploadError'));
      }
      onSelectMusic(res.url);
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('common.uploadError'));
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.play().catch(() => {});
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const handleSelectTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onSelectMusic(track.url);
    onClose();
  };

  const handleRemoveMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    onSelectMusic(null);
    onClose();
  };

  return (
    <div
      
      
    >
      {/* Header */}
      <div
        
      >
        <div >
          <Music size={16}  />
          <span >
            {t('invitation.edit.toolbarMusic')}
          </span>
        </div>
        <button
          onClick={onClose}
          
        >
          <X size={16} />
        </button>
      </div>

      {/* Upload */}
      <div >
        <input
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/m4a"
          onChange={handleUpload}
          
          id="upload-music-input"
        />
        <label
          htmlFor="upload-music-input"
          
        >
          {uploading ? (
            <>
              <Loader2 size={14}  />
              {t('common.uploading')}
            </>
          ) : (
            <>
              <Upload size={14} />
              {t('invitation.edit.musicPanelUpload')}
            </>
          )}
        </label>
        {uploadError && (
          <p >
            {uploadError}
          </p>
        )}
      </div>

      {/* Current music */}
      {currentMusicUrl && (
        <div >
          <div >
            <div >
              <Check size={14}  />
              <span >{t('invitation.edit.musicPanelCurrent')}</span>
            </div>
            <button
              onClick={handleRemoveMusic}
              
            >
              {t('invitation.edit.musicPanelRemove')}
            </button>
          </div>
        </div>
      )}

      {/* Track list */}
      <div >
        <p >
          {t('invitation.edit.musicPanelLibrary')}
        </p>
        <div >
          {FREE_TRACKS.map((track) => {
            const isActive = currentMusicUrl === track.url;
            const isPlaying = playingId === track.id;

            return (
              <button
                key={track.id}
                onClick={() => isActive ? handlePlay(track) : handleSelectTrack(track)}
                
              >
                {/* Play button */}
                <div
                  
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14}  />}
                </div>

                {/* Info */}
                <div >
                  <p >
                    {t(track.titleKey)}
                  </p>
                  <p >
                    {track.artist}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <Check size={16}  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
