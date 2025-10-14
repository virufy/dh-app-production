import React from "react";

interface FileUploadButtonProps {
  label: string;
  iconSrc: string;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  label,
  iconSrc,
  onClick,
  inputRef,
  onFileChange,
  accept = "audio/*",
}) => (
  <>
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "none",
        cursor: "pointer",
        background: "transparent",
        padding: "8px 16px",
        borderRadius: 8,
        outline: "none",
        boxShadow: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <img src={iconSrc} alt={label} width={22} height={22} style={{ marginBottom: "0.3rem", marginRight: "0.5rem" }} />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </button>
    <input type="file" accept={accept} ref={inputRef} onChange={onFileChange} style={{ display: "none" }} data-testid="file-upload-input" />
  </>
);

export default FileUploadButton;
