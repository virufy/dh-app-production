import React, { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline';
import { useNavigate } from 'react-router-dom';
import BackIcon from '../../../../assets/images/back-icon.png';
import * as S from './styles';

type Props = {
    audioFileUrl: string;
    filename: string;
    onRetake: () => void;
};

function UploadCompleteCough({ audioFileUrl, filename, onRetake }: Props) {
    const navigate = useNavigate();
    const waveformRef = useRef(null);
    const timelineRef = useRef(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (waveformRef.current && timelineRef.current && !wavesurfer.current) {
            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#ddd',
                progressColor: '#007bff',
                height: 60,
                barWidth: 2,
                cursorWidth: 2,
                // responsive: true,
                plugins: [
                    TimelinePlugin.create({
                        container: timelineRef.current,
                        // primaryColor: '#007bff',
                        // secondaryColor: '#ccc',
                        // primaryFontColor: '#007bff',
                        // secondaryFontColor: '#999',
                    }),
                ],
            });

            wavesurfer.current.on('play', () => setIsPlaying(true));
            wavesurfer.current.on('pause', () => setIsPlaying(false));
            wavesurfer.current.on('finish', () => setIsPlaying(false));
        }

        if (wavesurfer.current && audioFileUrl) {
            wavesurfer.current.load(audioFileUrl);
        }

        return () => {
            wavesurfer.current?.destroy();
            wavesurfer.current = null;
        };
    }, [audioFileUrl]);

    const handlePlayPause = () => {
        wavesurfer.current?.playPause();
    };

    const handleSubmit = () => navigate('/speech-record');
    const handleBack = () => navigate(-1);

    return (
        <S.Container>
            <S.Content>
                <S.Header>
                    <S.BackButton onClick={handleBack}>
                        <img src={BackIcon} alt="Back" style={{ width: 25, height: 35 }} />
                    </S.BackButton>
                    <h3>Record your Cough</h3>
                </S.Header>

                <h2>Upload Complete</h2>
                <p>Feel free to take a listen!</p>

                <S.Filename>{filename}</S.Filename>

                <div ref={waveformRef} />
                <div ref={timelineRef} style={{ height: 30 }} />

                <S.PlayButton onClick={handlePlayPause}>
                    {isPlaying ? '❚❚' : '▶'}
                </S.PlayButton>

                <S.DurationText>0:00 - 0:07</S.DurationText>

                <S.RetakeButton onClick={onRetake}>Retake</S.RetakeButton>
                <S.SubmitButton onClick={handleSubmit}>Submit</S.SubmitButton>

                <S.ErrorLink>
                    Something wrong?{' '}
                    <a href="https://forms.gle/SnngkaDSqXVqoLch8">Report an error</a>
                </S.ErrorLink>
            </S.Content>
        </S.Container>
    );
}

export default UploadCompleteCough;
