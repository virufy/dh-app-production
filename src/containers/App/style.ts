import { CSSProperties } from 'react';
export const logoStyle: CSSProperties = {
  height: '100px', // adjust as needed
  marginBottom: 20,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
};
export const pageContainer: CSSProperties = {
  padding: '40px 20px',
  maxWidth: '500px',
  margin: '0 auto',
  fontFamily: "'Source Sans Pro', sans-serif",
};
export const title: CSSProperties = {
  fontSize: '22px',
  fontWeight: 300,
  fontFamily: "'Doppio One', sans-serif",
  color: '#3578DE',
  marginBottom: '30px',
  lineHeight: 1.4,
  textAlign: 'center',
};
export const fieldLabel: CSSProperties = {
  display: 'block',
  marginTop: '20px',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: "'Source Sans Pro', sans-serif",
  color: '#393939',
};
export const fieldInput: CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid #ccc',
  fontSize: '14px',
  boxSizing: 'border-box',
  backgroundColor: '#F5F8FD',  // updated background color
  color: '#393939',            // dark text for readability
};
export const dropdown: CSSProperties = {
  ...fieldInput,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='%23393939'><polygon points='7,11 3,5 11,5'/></svg>")`, // dark arrow
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '14px',
  paddingRight: '40px',
  color: '#393939',              // dark text for dropdown
};
export const buttonContainer: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '80px',
  paddingRight: '20px',
};
export const buttonCircle: CSSProperties = {
  width: '20vw',
  height: '20vw',
  maxWidth: '100px',
  maxHeight: '100px',
  minWidth: '60px',
  minHeight: '60px',
  borderRadius: '50%',
  backgroundColor: '#EDF3FF',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
export const arrowIcon: CSSProperties = {
  color: '#3578DE',
  fontSize: '30px',
};