import React from 'react';
import SehaDubaiLogo from '../../assets/images/SehaDubaiLogo.png';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
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

    return (
        <Container>
            <InnerWrapper>
                <Logo src={SehaDubaiLogo} alt="Dubai Health Logo" />
                <Title>{t('confirmation.titleLine1')}<br />{t('confirmation.titleLine2')}
                </Title>
                <ButtonStyled onClick={() => navigate('/')}>
                    {t('confirmation.button')}
                </ButtonStyled>
                <ErrorLink href="https://docs.google.com/forms/d/e/1FAIpQLSdlBAA3drY6NydPkxKkMWTEZQhE9p5BSH5YSuaK18F_rObBFg/viewform">
                
                    {t('confirmation.report')}
                </ErrorLink>
            </InnerWrapper>
        </Container>
    );
};

export default ConfirmationScreen;
