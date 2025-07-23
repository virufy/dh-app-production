import styled from 'styled-components';

export const ConsentContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0.5rem;
  box-sizing: border-box;

  @media (min-width: 48rem) {
    align-items: center;
  }
`;

export const ConsentContent = styled.div`
  width: 100%;

  @media (min-width: 48rem) {
    max-width: 37.5rem;
    width: 100%;
    background-color: white;
    padding: 2rem;
    border-radius: 0.75rem;
  }
`;
