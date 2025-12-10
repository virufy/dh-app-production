import React, { useEffect } from 'react';
import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import AppHeader from "../../components/AppHeader";
import { logger } from '../../services/loggingService';
import { uploadAllLogsForCurrentPatient } from '../../services/logUploadService';
import { handleErrorReport } from '../../utils/errorReportHandler';


import {
    Container,
    InnerWrapper,
    Logo,
    Title,
    ButtonStyled,
    ErrorLink
} from './style';

const ConfirmationScreen: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const uploadPatientLogs = async () => {
            try {
                await logger.forceFlush();
                
                await uploadAllLogsForCurrentPatient();
                
                logger.info('Patient session logs upload initiated', {
                    patientId: logger.getPatientId(),
                    patientSessionId: logger.getPatientSessionId(),
                });
            } catch (error) {
                logger.error('Failed to upload patient logs on confirmation screen', {}, 
                    error instanceof Error ? error : new Error(String(error)));
            }
        };

        uploadPatientLogs();
    }, []);

    const handleUndo = () => {
        // Keep the existing patient session and recordings; simply restart the flow.
        logger.info('Undo from confirmation triggered; returning to cough recording', {
            patientId: logger.getPatientId(),
            patientSessionId: logger.getPatientSessionId(),
        });
        navigate('/record-coughs', { replace: false });
    };

    const handleReturnToMenu = () => {
        sessionStorage.removeItem('patientId');
        logger.startNewPatientSession();
        logger.info('Patient data submission completed, starting new patient session');
        navigate('/');
    };

    const handleReportError = (e: React.MouseEvent<HTMLAnchorElement>) => {
        handleErrorReport(e);
    };

    return (
       
<>
      < AppHeader maxWidth={500} />
        <Container>
            <InnerWrapper>
                <Logo src={SehaDubaiLogo} alt="Dubai Health Logo" />
                <Title>{t('confirmation.titleLine1')}<br />{t('confirmation.titleLine2')}
                </Title>
                <ButtonStyled onClick={handleUndo}>
                    {t('confirmation.undo')}
                </ButtonStyled>
                <ButtonStyled onClick={handleReturnToMenu}>
                    {t('confirmation.button')}
                </ButtonStyled>
                <ErrorLink href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform" onClick={handleReportError}>
                
                    {t('confirmation.report')}
                </ErrorLink>
            </InnerWrapper>
        </Container>
        </>
    );
};

export default ConfirmationScreen;
