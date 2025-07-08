import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    PageWrapper,
    ContentWrapper,
    Header,
    BackButton,
    HeaderTitle,
    Title,
    Subtitle,
    FileRow,
    Slider,
    TimeRow,
    PlayButton,
    RetakeButton,
    SubmitButton,
    Footer,
    ErrorLink
} from './styles';

import ArrowLeftIcon from '../../../../assets/icons/arrowLeft.svg';
import PlayIcon from '../../../../assets/icons/play.svg';
import PauseIcon from '../../../../assets/icons/pause.svg';

const UploadCompleteCough: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { audioFileUrl, filename = 'Filename.flac', nextPage } = location.state || {};
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleLoadedMetadata = () => setDuration(audio.duration);
            const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('timeupdate', handleTimeUpdate);

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
            };
        }
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        isPlaying ? audio.pause() : audio.play();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleBack = () => navigate(-1);
    const handleRetake = () => navigate('/record-coughs');
    const handleSubmit = () => navigate(nextPage || '/confirmation');

    return (
        <PageWrapper>
            <ContentWrapper>
                <audio ref={audioRef} src={audioFileUrl || ''} preload="auto" />

                <Header>
                    <BackButton onClick={handleBack}>
                        <img src={ArrowLeftIcon} alt="Back" width={24} height={24} />
                    </BackButton>
                    <HeaderTitle>Confirm Recording</HeaderTitle>
                </Header>

                <Title>Upload Complete</Title>
                <Subtitle>Confirm audio recording</Subtitle>

                <FileRow>
                    <span>{filename}</span>
                    <span style={{ fontSize: '20px', cursor: 'pointer' }}>✕</span>
                </FileRow>

                <Slider
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    step="0.1"
                    onChange={handleSeek}
                />

                <TimeRow>
                    <span>{formatTime(currentTime)}</span>
                    <span>- {formatTime(duration)}</span>
                </TimeRow>

                <PlayButton onClick={handlePlayPause}>
                    <img
                        src={isPlaying ? PauseIcon : PlayIcon}
                        alt={isPlaying ? 'Pause' : 'Play'}
                        width="35"
                        height="35"
                        style={isPlaying ? {} : { marginLeft: '0.3rem' }}
                    />
                </PlayButton>

                <div>
                    <RetakeButton onClick={handleRetake}>Retake</RetakeButton>
                    <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
                </div>

                <Footer>
                    <ErrorLink
                        href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Something wrong? Report an error
                    </ErrorLink>
                </Footer>
            </ContentWrapper>
        </PageWrapper>
    );
};

export default UploadCompleteCough;
