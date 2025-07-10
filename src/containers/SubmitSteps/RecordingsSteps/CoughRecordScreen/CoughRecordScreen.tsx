import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import keepDistance from '../../../../assets/images/keepDistance.png';
import mouthDistance from '../../../../assets/images/mouthDistance.png';
import BackIcon from '../../../../assets/icons/arrowLeft.svg';
import UploadIcon from '../../../../assets/icons/upload.svg';
import StartIcon from '../../../../assets/icons/start.svg';
import StopIcon from '../../../../assets/icons/stop.svg';
import i18n from "../../../../i18n";
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
    const { t } = useTranslation();
    const isArabic = i18n.language === 'ar';     
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [involuntary, setInvoluntary] = useState(false);
    const handleBack = () => navigate(-1);
    const handleContinue = () => {
        navigate("/upload-complete", {
            state: {
                audioFileUrl: "",
                filename: t("recordCough.defaultFilename"),
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
                {/* Header */}
                <Header>
                <BackButton
                    onClick={handleBack}
                    aria-label={t("recordCough.goBackAria")}
                    isArabic={isArabic}
                >
                    <img
                    src={BackIcon}
                    alt={t("recordCough.goBackAlt")}
                    width={24}
                    height={24}
                    style={{
                        transform: isArabic ? 'rotate(180deg)' : 'none',
                    }}
                    />
                </BackButton>
                <HeaderText>{t("recordCough.title")}</HeaderText>
                </Header>

                <h3
                    style={{
                        fontFamily: "Source Sans Pro, sans-serif",
                        fontSize: "32px",
                        textAlign: "center",
                        fontWeight: "bold",
                        marginBottom: "2rem",
                        color: "#393939"
                    }}
                >
                    {t("recordCough.instructionsTitle")}
                </h3>
                {/* Instruction Step 1 */}
                <StepWrapper>
                    <StepCircle>1</StepCircle>
                    <InstructionText>{t('recordCough.instruction1_part1')} <strong>{t('recordCough.instruction1_bold1')}</strong>{t('recordCough.instruction1_part2')} <strong>{t('recordCough.instruction1_bold2')}</strong>{t('recordCough.instruction1_part3')}</InstructionText>
                </StepWrapper>
                <Image src={keepDistance} alt={t("recordCough.keepDistanceAlt")} />
                {/* Instruction Step 2 */}
                <StepWrapper>
                    <StepCircle>2</StepCircle>
                    <InstructionText>{t('recordCough.instruction2_part1')}<strong>{t('recordCough.instruction2_bold')}</strong>{t('recordCough.instruction2_part2')}</InstructionText>
                </StepWrapper>
                <Image src={mouthDistance} alt={t("recordCough.mouthDistanceAlt")} />
                {/* Instruction Step 3 */}
                <StepWrapper>
                    <StepCircle>3</StepCircle>
                    <InstructionText>{t('recordCough.instruction3_part1')} <strong>{t('recordCough.instruction3_bold1')}</strong>{t('recordCough.instruction3_part2')}<strong>{t('recordCough.instruction3_bold2')}</strong>{t('recordCough.instruction3_part3')}</InstructionText>
                </StepWrapper>
                {/* Timer */}
                <Timer>
                    <TimerBox>0:00</TimerBox>
                </Timer>
                {/* Recording Buttons */}
                <ButtonRow>
                    <div style={{ textAlign: 'center' }}>
                        <CircleButton bg="#3578de" aria-label={t("recordCough.recordButton")}>
                            <img src={StartIcon} alt={t("recordCough.recordButton")} width={28} height={28} />
                        </CircleButton>
                        <ButtonLabel>{t("recordCough.recordButton")}</ButtonLabel>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <CircleButton bg="#DDE9FF" aria-label={t("recordCough.stopButton")}>
                            <img src={StopIcon} alt={t("recordCough.stopButton")} width={20} height={20} />
                        </CircleButton>
                        <ButtonLabel>{t("recordCough.stopButton")}</ButtonLabel>
                    </div>
                </ButtonRow>
                {/* Checkbox */}
                <CheckboxRow>
                    <Label htmlFor="involuntary" style={{ userSelect: "none" }}>
                        {t("recordCough.checkboxLabel")}
                    </Label>
                    <Checkbox
                        id="involuntary"
                        type="checkbox"
                        checked={involuntary}
                        onChange={() => setInvoluntary(!involuntary)}
                        style={{ cursor: "pointer" }}
                    />
                </CheckboxRow>
                {/* Action Buttons */}
                <ActionButtons>
                    <button onClick={handleContinue}>
                        {t("recordCough.continueButton")}
                    </button>
                    <UploadButton onClick={triggerFileInput} aria-label={t("recordCough.uploadFile")}>
                        <img
                            src={UploadIcon}
                            alt={t("recordCough.uploadFile")}
                            width={22}
                            height={22}
                            style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }}
                        />
                        <UploadText>{t("recordCough.uploadFile")}</UploadText>
                    </UploadButton>
                    <HiddenFileInput
                        type="file"
                        accept="audio/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                </ActionButtons>
                {/* Footer */}
                <FooterLink
                    href="https://docs.google.com/forms/d/e/1FAIpQLScYsWESIcn1uyEzFQT464qLSYZuUduHzThgTRPJODTQcCwz5w/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {t("recordCough.reportIssue")}
                </FooterLink>
            </Content>
        </Container>
    );
};
export default CoughRecordScreen;