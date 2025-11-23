// import React from "react";
// import { useNavigate } from "react-router-dom";
// import i18n from "../../i18n";
// import styled from "styled-components";

// type Props = {
//   to: string;
//   label: string;
//   ariaLabel?: string;
//   state?: any;
// };

// const StickyButton = styled.button<{ isArabic: boolean }>`
//   position: fixed;
//   top: 72px; /* default top offset; app header controls spacing */
//   z-index: 2000;
//   ${({ isArabic }) => (isArabic ? "left: 20px;" : "right: 20px;")}
//   background-color: #f0f0f0;
//   border: 1px solid #ccc;
//   padding: 8px 16px;
//   border-radius: 4px;
//   cursor: pointer;
//   pointer-events: auto;

//   @media (max-width: 767px) {
//     top: 56px;
//   }
// `;

// const SkipButton: React.FC<Props> = ({ to, label, ariaLabel, state }) => {
//   const isArabic = i18n.language === "ar";
//   const navigate = useNavigate();

//   const handleClick = () => navigate(to, { state: state ?? { skipped: true } });

//   return (
//     <StickyButton isArabic={isArabic} aria-label={ariaLabel} onClick={handleClick}>
//       {label}
//     </StickyButton>
//   );
// };

// export default SkipButton;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import i18n from "../../i18n";
import styled from "styled-components";

type Props = {
  to: string;
  label: string;
  ariaLabel?: string;
  state?: any;
};

// Updated Styled Component
const StickyButton = styled.button<{ isArabic: boolean; isVisible: boolean }>`
  position: fixed;
  top: 72px; 
  z-index: 2000;
  ${({ isArabic }) => (isArabic ? "left: 20px;" : "right: 20px;")}
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  
  /* INSTANTLY hide/show based on prop */
  display: ${({ isVisible }) => (isVisible ? "block" : "none")};

  @media (max-width: 767px) {
    top: 56px;
  }
`;

const SkipButton: React.FC<Props> = ({ to, label, ariaLabel, state }) => {
  const isArabic = i18n.language === "ar";
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const handleClick = () => navigate(to, { state: state ?? { skipped: true } });

  useEffect(() => {
    const handleScroll = () => {
      // Hides the button immediately if scrolled more than 10 pixels
      if (window.scrollY > 10) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    // Add event listener
    window.addEventListener("scroll", handleScroll);

    // Clean up event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <StickyButton
      isArabic={isArabic}
      isVisible={isVisible}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {label}
    </StickyButton>
  );
};

export default SkipButton;