import styled from 'styled-components';

export const Container = styled.div`
    min-height: 100vh;
    padding: 1.5rem 1rem;
    font-family: 'Source Sans Pro', sans-serif;
    font-size: 14px;
    display: flex;
    justify-content: center;
    background-color: transparent;
`;

export const Content = styled.div`
    max-width: 1000px;
    width: 100%;
    position: relative;
`;

export const Header = styled.div`
    position: relative;
    margin-top: 0.05rem;
    margin-bottom: 1.75rem;
`;

export const BackButton = styled.button<{ isArabic?: boolean }>`
    position: absolute;
    top: 0;
    background: none;
    border: none;
    cursor: pointer;
    ${({ isArabic }) => (isArabic ? 'right: -10px;' : 'left: -10px;')}
`;

export const HeaderText = styled.div`
    text-align: center;
    font-weight: 600;
    font-size: 18px;
    color: #3578de;
`;

export const StepWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
`;

export const StepCircle = styled.div`
    min-width: 28px;
    height: 28px;
    background-color: #DDE9FF;
    border-radius: 50%;
    text-align: center;
    line-height: 28px;
    font-weight: bold;
    color: #3578de;
    font-size: 20px;
`;

export const InstructionText = styled.div`
    flex: 1;
    font-size: 14px;
`;

export const Image = styled.img`
    display: block;
    margin: auto;
    width: 50%;
    margin-bottom: 1.5rem;

`;

export const Timer = styled.div`
    display: flex;
    justify-content: center;
    margin: 3.5rem 0 1.75rem;
`;

export const TimerBox = styled.div`
    border: 1px solid #3578de;
    color: #3578de;
    padding: 0.6rem 1.5rem;
    border-radius: 12px;
    font-weight: bold;
    font-size: 20px;
`;

export const ButtonRow = styled.div`
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2.5rem;
`;

export const CircleButton = styled.button<{ bg: string }>`
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: ${({ bg }) => bg};
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

export const ButtonLabel = styled.div`
    font-size: 14px;
    margin-top: 0.5rem;
    color: #666;
`;


export const CheckboxRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f7f7f7;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: 1px solid #f7f7f7;
    margin-bottom: 2rem;
    font-size: 1rem;
    font-weight: 500;
`;
export const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 24px;
  height: 24px;
  appearance: none;
  -webkit-appearance: none;
  background-color: white;
  border: 3px solid #c4c4c4;
  border-radius: 6px;
  cursor: pointer;
  display: inline-block;
  position: relative;

  &:checked {
    background-color: #007bff;
    border-color: #007bff;
  }

  &:checked::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 1px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

export const Label = styled.label`
    font-size: 1rem;
    color: #393939;
`;

export const ActionButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;

    & > button:first-child {
        background-color: #3578de;
        color: white;
        border: none;
        padding: 1.5rem;
        border-radius: 15px;
        font-weight: bold;
        cursor: pointer;
    }
`;

export const UploadButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

export const UploadText = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 4rem;
`;

export const HiddenFileInput = styled.input`
    display: none;
`;

export const FooterLink = styled.a`
    font-size: 1rem;
    font-weight: bold;
    color: #3578de;
    text-decoration: underline;
    text-align: center;
    display: block;
`;
