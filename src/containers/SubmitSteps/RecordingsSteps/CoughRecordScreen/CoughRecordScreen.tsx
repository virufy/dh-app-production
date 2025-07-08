import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import keepDistance from '../../../../assets/images/keepDistance.png';
import mouthDistance from '../../../../assets/images/mouthDistance.png';
import BackIcon from '../../../../assets/icons/arrowLeft.svg';
import UploadIcon from '../../../../assets/icons/upload.svg';
import StartIcon from '../../../../assets/icons/start.svg';
import StopIcon from '../../../../assets/icons/stop.svg';
import {
    Container,
    Content,
    Header,
    BackButton,
    HeaderText,
    StepCircle,
    StepWrapper,
    InstructionText,
    Image,
    Timer,
    TimerBox,
    ButtonRow,
    CircleButton,
    ButtonLabel,
    CheckboxRow,
    Label,
    Checkbox,
    ActionButtons,
    UploadButton,
    UploadText,
    HiddenFileInput,
    FooterLink
} from './styles';

const CoughRecordScreen: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [involuntary, setInvoluntary] = useState(false);

    const handleBack = () => navigate(-1);

    const handleContinue = () => {
        navigate("/upload-complete", {
            state: {
                audioFileUrl: "",
                filename: "Cough Recording",
                nextPage: "/record-speech",
            },
        });
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);
            navigate("/upload-complete", {
                state: {
                    audioFileUrl: audioUrl,
                    filename: file.name,
                    nextPage: "/record-speech",
                },
            });
        }
    };

    return (
        <Container>
            <Content>
                <Header>
                    <BackButton onClick={handleBack}>
                        <img src={BackIcon} alt="Back" width={24} height={24} />
                    </BackButton>
                    <HeaderText>Record your cough</HeaderText>
                </Header>

                <h3 style={{ fontFamily: "Source Sans Pro, sans-serif", fontSize: '32px', textAlign: 'center', fontWeight: 'bold', marginBottom: '2rem', color: "#393939" }}>Instructions</h3>

                <StepWrapper>
                    <StepCircle>1</StepCircle>
                    <InstructionText>
                        Find a <strong>quiet place</strong> at least <strong>20 ft (6m)</strong> away from others. If you are feeling ill, please sit down.
                    </InstructionText>
                </StepWrapper>
                <Image src={keepDistance} alt="Keep distance" />

                <StepWrapper>
                    <StepCircle>2</StepCircle>
                    <InstructionText>
                        Hold the bottom of your device <strong>1–2 ft (30–60 cm)</strong> away from your mouth. Try not to cough too forcefully.
                    </InstructionText>
                </StepWrapper>
                <Image src={mouthDistance} alt="Mouth distance" />

                <StepWrapper>
                    <StepCircle>3</StepCircle>
                    <InstructionText>
                        Tap record. <strong>Cough 3 times</strong> with a <strong>deep breath</strong> between each cough. Then tap stop.
                    </InstructionText>
                </StepWrapper>

                <Timer><TimerBox>0:00</TimerBox></Timer>

                <ButtonRow>
                    <div style={{ textAlign: 'center' }}>
                        <CircleButton bg="#3578de">
                            <img src={StartIcon} alt="Start Recording" width={28} height={28} />
                        </CircleButton>
                        <ButtonLabel>Record</ButtonLabel>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <CircleButton bg="#DDE9FF">
                            <img src={StopIcon} alt="Stop Recording" width={20} height={20} />
                        </CircleButton>
                        <ButtonLabel>Stop</ButtonLabel>
                    </div>
                </ButtonRow>

                <CheckboxRow>
                    <Label htmlFor="involuntary">Were the coughs involuntary?</Label>
                    <Checkbox
                        id="involuntary"
                        type="checkbox"
                        checked={involuntary}
                        onChange={() => setInvoluntary(!involuntary)}
                    />
                </CheckboxRow>

                <ActionButtons>
                    <button onClick={handleContinue}>Continue</button>

                    <UploadButton onClick={triggerFileInput}>
                        <img src={UploadIcon} alt="Upload Icon" width={22} height={22} style={{ marginBottom: '0.3rem', marginRight: '0.5rem' }} />
                        <UploadText>Upload your own file</UploadText>
                    </UploadButton>
                    <HiddenFileInput
                        type="file"
                        accept="audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </ActionButtons>

                <FooterLink
                    href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Something wrong? Report an error
                </FooterLink>
            </Content>
        </Container>
    );
};

export default CoughRecordScreen;
