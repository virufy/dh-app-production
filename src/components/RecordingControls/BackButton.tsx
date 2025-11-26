import React from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
  ariaLabel?: string;
  isArabic?: boolean;
  className?: string;
  children?: React.ReactNode;
  component?: React.ElementType;
}

const BackButton: React.FC<BackButtonProps> = ({ ariaLabel, isArabic, className, children, component }) => {
  const navigate = useNavigate();
  const Component = component || 'button';
  const propsToForward: any = {
    onClick: () => navigate(-1),
    'aria-label': ariaLabel,
    className,
    isArabic,
    // do not impose positioning; let caller styled component handle layout
  };

  return React.createElement(Component, propsToForward, children);
};

export default BackButton;
