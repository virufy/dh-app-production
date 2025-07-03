import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import keepDistance from '../../../../assets/images/keepDistance.png';
import mouthDistance from '../../../../assets/images/mouthDistance.png';
import BackIcon from '../../../../assets/images/back-icon.png';
import Upload from '../../../../assets/images/upload.svg';
import * as S from './styles';

function CoughRecordScreen() {
    const navigate = useNavigate();
    const [involuntary, setInvoluntary] = useState(false);

    const toggleInvoluntary = () => setInvoluntary(!involuntary);
    const handleBack = () => navigate(-1);

    return (
        <S.Container>
            <S.Content>

                <S.Header>
                    <S.BackButton onClick={handleBack}>
                        <img src={BackIcon} alt="Back" />
                    </S.BackButton>
                    <h2>Record your cough</h2>
                </S.Header>

                <S.Paragraph><strong>1</strong>. Find a quiet place at least 20 ft (6m) away from others...</S.Paragraph>
                <S.Image src={keepDistance} alt="Keep distance" />

                <S.Paragraph><strong>2</strong>. Hold the bottom of your device 1-2 ft...</S.Paragraph>
                <S.Image src={mouthDistance} alt="Device distance" />

                <S.Paragraph><strong>3</strong>. Tap record, cough 3 times...</S.Paragraph>

                <S.Timer>0:00</S.Timer>

                <S.ButtonGroup>
                    <S.RecordButton>Record</S.RecordButton>
                    <S.StopButton>Stop</S.StopButton>
                </S.ButtonGroup>

                <S.CheckboxRow>
                    <label htmlFor="involuntary">Were your coughs involuntary?</label>
                    <input
                        id="involuntary"
                        type="checkbox"
                        checked={involuntary}
                        onChange={toggleInvoluntary}
                    />
                </S.CheckboxRow>

                <S.ActionButtons>
                    <S.ContinueButton onClick={() => navigate('/upload-complete')}>
                        Continue
                    </S.ContinueButton>
                    <S.UploadButton>
                        <img src={Upload} alt="Upload" />
                        Upload your own file
                    </S.UploadButton>
                </S.ActionButtons>

                <S.Footer>
                    Something wrong? <a href="https://docs.google.com/forms/...">Report an error</a>
                </S.Footer>

            </S.Content>
        </S.Container>
    );
}

export default CoughRecordScreen;
