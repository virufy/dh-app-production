import styled from 'styled-components';

export const PageWrapper = styled.div`
  min-height: 94vh;
  padding: 1.5rem 1rem;
  display: flex;
  justify-content: center;
  background-color: transparent;
  font-family: 'Source Sans Pro', sans-serif;
  overflow: auto;
`;

export const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const Header = styled.div`
  position: relative;
  margin-top: 1.25rem;
`;

export const BackButton = styled.button<{ isArabic?: boolean }>`
  position: absolute;
  top: 0;
  background: none;
  border: none;
  cursor: pointer;
  ${({ isArabic }) => (isArabic ? 'right: 0;' : 'left: 0;')}
`;

export const HeaderTitle = styled.div`
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: #3578de;
`;

export const Title = styled.h2`
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
  color: #333;
  padding: 0 1.5rem;
`;

export const Subtitle = styled.p`
  font-weight: 700;
  font-size: 1.5rem;
  color: #393939;
  padding: 0 1.5rem;       // Horizontal padding only
  box-sizing: border-box;
`;

export const FileRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  margin-bottom: 0.4rem;
  padding: 0 1.5rem;
`;

export const Slider = styled.input`
  width: calc(100% - 3rem); /* full width minus 2 × 1.5rem padding */
  margin: 0 auto 0.2rem;     /* center it */
  height: 6px;
  appearance: none;
  background-color: #dde9ff;
  border-radius: 4px;
  outline: none;
`;

export const TimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  color: #888;
  margin-bottom: 1.5rem;
  padding: 0 1.5rem;
`;

export const PlayButton = styled.button`
  width: 7.5rem;
  height: 7.5rem;
  border-radius: 50%;
  background-color: #dde9ff;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 2rem auto 5.5rem;
`;
// This wrapper centers and aligns the controls.
export const ControlsWrapper = styled.div`
  width: 100%;
  max-width: 400px;      /* caps everything at 400px */
  margin: 0 auto;        /* centers it horizontally */
  box-sizing: border-box;/* if you ever add padding, it stays inside */
  display: flex;
  flex-direction: column;
`;

export const RetakeButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: 3.5px solid #3578de;
  border-radius: 15px;
  font-weight: bold;
  color: #3578de;
  background-color: transparent;
  margin-bottom: 1.7rem;
  cursor: pointer;
  font-size: 16px;

`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: #3578de;
  border: none;
  border-radius: 15px;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  margin-bottom: 0.5rem;
  font-size: 16px;
`;
// ButtonsWrapper is used to center the buttons.
export const ButtonsWrapper = styled.div` 
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1.5rem; 
`;

export const Footer = styled.div`
  text-align: center;
  margin-top: 1rem;
`;

export const ErrorLink = styled.a`
  font-size: 0.8rem;
  font-weight: bold;
  color: #3578de;
  text-decoration: underline;
`;