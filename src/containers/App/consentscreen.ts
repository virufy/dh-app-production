import styled from 'styled-components';

export const ConsentContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0.5rem;
  box-sizing: border-box;
  overflow-x: hidden;
  max-width: 530px;
  margin: 0 auto;
`;

export const ConsentContent = styled.div`
  width: 100%;

  @media (min-width: 48rem) {
    max-width: 37.5rem; 
    width: 100%;
    background-color: white;
    padding: 1rem;
    border-radius: 0.75rem;

    p {
      @media (min-width: 768px) and (max-width: 1024px) {
        font-size: 1rem;
      }
    }
  }
`;

